// ============================================================
// SALES ARENA v3 — Lógica compartida (arena + panel)
// ============================================================

// 🎯 META SEMANAL: cuando un vendedor llega a este número, su barra está al 100%
const WEEK_TARGET = 85;

// ============== Vendedores ==============
const SELLERS = [
  { id: 'josue',   name: 'Josué',     avatar: 'wolf',    color: '#6BC9FF', colorAlt: '#3FA3F0', pages: ['Sinergia-Bionova'] },
  { id: 'ana',     name: 'Ana',       avatar: 'eagle',   color: '#FFD93D', colorAlt: '#FFB800', pages: ['AgroTec'] },
  { id: 'jose',    name: 'José',      avatar: 'tiger',   color: '#FF8C42', colorAlt: '#FF6A1A', pages: ['Bioterra', 'Zoorigen'] },
  { id: 'daisy',   name: 'Daisy',     avatar: 'fox',     color: '#FF4FB6', colorAlt: '#E0339A', pages: ['IMDIIL', 'GlobalVet'] },
  { id: 'daniela', name: 'Daniela',   avatar: 'panther', color: '#B47CFF', colorAlt: '#9656FF', pages: ['Dermalysse'] },
  { id: 'ani',     name: 'Ani Reyes', avatar: 'falcon',  color: '#5EEAD4', colorAlt: '#2DD4BF', pages: ['Synova'] },
  { id: 'eli',     name: 'Eli',       avatar: 'lion',    color: '#FFAA33', colorAlt: '#FF8800', pages: ['Visión Pecuaria', 'Ingeniería Avícola'] },
  { id: 'anni',    name: 'Anni',      avatar: 'owl',     color: '#9D7CFF', colorAlt: '#7C5CE6', pages: ['ICADEM', 'IMDAC'] },
  { id: 'carla',   name: 'Carla',     avatar: 'dragon',  color: '#FF6FA8', colorAlt: '#FF4787', pages: ['Fisiotec', 'Odonteck'] }
];

const SELLER_BY_ID = Object.fromEntries(SELLERS.map(s => [s.id, s]));
const SELLER_BY_PAGE = (() => { const m = {}; SELLERS.forEach(s => s.pages.forEach(p => { m[p] = s.id; })); return m; })();

const STORAGE_KEY  = 'sales-arena-state-v3';
const CEREMONY_KEY = 'sales-arena-ceremony-v3';
const RANK_LABELS  = ['CHAMPION', 'CHALLENGER', 'CONTENDER', 'RIVAL'];
const RANK_MEDALS  = ['🏆', '🥈', '🥉', '⚔️'];

let state = loadState();
let prevTopIds = [];
let prevLeader = null;

function buildInitialState() {
  const sellers = {}, pages = {};
  SELLERS.forEach(s => { sellers[s.id] = 0; s.pages.forEach(p => { pages[p] = 0; }); });
  const byDay = {};
  ['monday','tuesday','wednesday','thursday','friday','saturday'].forEach(d => {
    byDay[d] = { amount: null, premium: false, revealed: false, revealedAt: null };
  });
  return {
    sellers, pages, history: [], weekStarted: Date.now(),
    commission: {
      byDay,
      month: null,
      premiumUsedThisMonth: 0,
      earned: {}
    }
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildInitialState();
    const p = JSON.parse(raw);
    if (!p.sellers || !p.pages) return buildInitialState();
    if (!p.weekStarted) p.weekStarted = Date.now();
    // Asegurar que commission siempre exista con la nueva estructura
    if (!p.commission) p.commission = { byDay: {}, month: null, premiumUsedThisMonth: 0, earned: {} };
    if (!p.commission.byDay) p.commission.byDay = {};
    ['monday','tuesday','wednesday','thursday','friday','saturday'].forEach(d => {
      if (!p.commission.byDay[d]) {
        p.commission.byDay[d] = { amount: null, premium: false, revealed: false, revealedAt: null };
      }
    });
    if (!p.commission.earned) p.commission.earned = {};
    return p;
  } catch (e) { return buildInitialState(); }
}

function saveState() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {} }

function getRanked() {
  return SELLERS
    .map(s => ({ ...s, total: state.sellers[s.id] || 0 }))
    .sort((a, b) => (b.total - a.total) || a.name.localeCompare(b.name));
}

function getPageBreakdown(seller) {
  return seller.pages.map(p => ({ page: p, count: state.pages[p] || 0 }));
}

// ============== Sales actions ==============
function addSale(page) {
  const sellerId = SELLER_BY_PAGE[page];
  if (!sellerId) return;

  const beforeTop4 = getRanked().slice(0, 4).map(r => r.id);
  const wasInTop4 = beforeTop4.includes(sellerId);
  const beforeTotal = state.sellers[sellerId] || 0;

  state.sellers[sellerId] = beforeTotal + 1;
  state.pages[page]       = (state.pages[page] || 0) + 1;
  state.history.push({ sellerId, page, ts: Date.now() });
  if (state.history.length > 500) state.history.shift();
  saveState();

  if (wasInTop4) fireEvent({ type: 'SALE_TOP', sellerId });
  else           fireEvent({ type: 'SALE_OUTSIDER', sellerId });

  // Goal reached!
  if (beforeTotal < WEEK_TARGET && state.sellers[sellerId] >= WEEK_TARGET) {
    fireEvent({ type: 'GOAL_REACHED', sellerId });
  }

  if (typeof renderAll === 'function') renderAll();
  detectClimbAndLeader(beforeTop4);
}

function detectClimbAndLeader(beforeTop4) {
  const ranked = getRanked();
  const newTop4 = ranked.slice(0, 4).map(r => r.id);
  const newLeader = ranked[0]?.id;

  if (prevLeader && newLeader !== prevLeader) {
    fireEvent({ type: 'NEW_LEADER', sellerId: newLeader });
  }
  if (beforeTop4.length === 4) {
    newTop4.forEach((id, newIdx) => {
      const oldIdx = beforeTop4.indexOf(id);
      if (oldIdx === -1 || newIdx < oldIdx) {
        fireEvent({ type: 'CLIMB', sellerId: id });
      }
    });
  }
  prevTopIds = newTop4;
  prevLeader = newLeader;
}

function undoLastSale() {
  if (!state.history.length) return;
  const last = state.history.pop();
  state.sellers[last.sellerId] = Math.max(0, (state.sellers[last.sellerId] || 0) - 1);
  state.pages[last.page]       = Math.max(0, (state.pages[last.page]       || 0) - 1);
  saveState();
  if (typeof renderAll === 'function') renderAll();
}

function resetAll() {
  // Preservar el contador de premium del mes actual (es por mes, no por semana)
  const prevMonth = state?.commission?.month || null;
  const prevPremiumUsed = state?.commission?.premiumUsedThisMonth || 0;

  state = buildInitialState();

  // Si seguimos en el mismo mes, conservamos el contador para que no se "reseteen" las premium ya usadas
  const nowMonth = (function() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  })();
  if (prevMonth && prevMonth === nowMonth) {
    state.commission.month = prevMonth;
    state.commission.premiumUsedThisMonth = prevPremiumUsed;
  }

  prevTopIds = [];
  prevLeader = null;
  saveState();
  if (typeof renderAll === 'function') renderAll();
  if (typeof updateRevealBtn === 'function') updateRevealBtn();
}

// ============== Avatar SVG ==============
function avatarSVG(kind, color, colorAlt, size = 80) {
  const id = `${kind}-${Math.random().toString(36).slice(2, 7)}`;
  const baseDefs = `
    <defs>
      <linearGradient id="${id}-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${color}"/>
        <stop offset="100%" stop-color="${colorAlt}"/>
      </linearGradient>
      <linearGradient id="${id}-soft" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="${colorAlt}" stop-opacity="0.5"/>
      </linearGradient>
      <radialGradient id="${id}-eye">
        <stop offset="0%" stop-color="#fff"/>
        <stop offset="50%" stop-color="${color}"/>
        <stop offset="100%" stop-color="${colorAlt}"/>
      </radialGradient>
    </defs>`;

  const bodies = {
    wolf: `
      <polygon points="25,40 35,15 50,38" fill="url(#${id}-grad)"/>
      <polygon points="95,40 85,15 70,38" fill="url(#${id}-grad)"/>
      <path d="M30 45 Q60 25 90 45 Q95 75 80 95 Q60 110 40 95 Q25 75 30 45 Z" fill="url(#${id}-soft)" stroke="${color}" stroke-width="2"/>
      <path d="M48 75 Q60 90 72 75 L70 95 Q60 105 50 95 Z" fill="#0a0118" stroke="${color}" stroke-width="1.5"/>
      <ellipse cx="60" cy="80" rx="5" ry="3" fill="${color}"/>
      <ellipse cx="45" cy="62" rx="6" ry="8" fill="#0a0118"/>
      <ellipse cx="75" cy="62" rx="6" ry="8" fill="#0a0118"/>
      <ellipse cx="45" cy="62" rx="3" ry="5" fill="url(#${id}-eye)"/>
      <ellipse cx="75" cy="62" rx="3" ry="5" fill="url(#${id}-eye)"/>`,
    eagle: `
      <path d="M30 60 Q60 20 90 60 Q90 90 60 100 Q30 90 30 60 Z" fill="url(#${id}-soft)" stroke="${color}" stroke-width="2"/>
      <path d="M50 40 L60 22 L70 40 Z" fill="url(#${id}-grad)"/>
      <path d="M55 75 L60 95 L65 75 Z" fill="${colorAlt}" stroke="#0a0118" stroke-width="1"/>
      <line x1="60" y1="75" x2="60" y2="95" stroke="#0a0118" stroke-width="1.5"/>
      <path d="M38 58 L52 64 L40 70 Z" fill="#0a0118"/>
      <path d="M82 58 L68 64 L80 70 Z" fill="#0a0118"/>
      <circle cx="44" cy="64" r="2.5" fill="${color}"/>
      <circle cx="76" cy="64" r="2.5" fill="${color}"/>`,
    tiger: `
      <path d="M28 38 Q22 22 38 28 Z" fill="${color}"/>
      <path d="M92 38 Q98 22 82 28 Z" fill="${color}"/>
      <ellipse cx="60" cy="65" rx="35" ry="35" fill="url(#${id}-soft)" stroke="${color}" stroke-width="2"/>
      <path d="M40 40 Q42 50 38 55" stroke="#0a0118" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M50 35 Q52 45 48 50" stroke="#0a0118" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M70 35 Q68 45 72 50" stroke="#0a0118" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M80 40 Q78 50 82 55" stroke="#0a0118" stroke-width="3" fill="none" stroke-linecap="round"/>
      <ellipse cx="60" cy="80" rx="20" ry="14" fill="#fff8e1" opacity="0.9"/>
      <path d="M55 73 Q60 70 65 73 L62 78 L58 78 Z" fill="#0a0118"/>
      <ellipse cx="45" cy="60" rx="7" ry="6" fill="#0a0118"/>
      <ellipse cx="75" cy="60" rx="7" ry="6" fill="#0a0118"/>
      <ellipse cx="45" cy="60" rx="3" ry="4" fill="url(#${id}-eye)"/>
      <ellipse cx="75" cy="60" rx="3" ry="4" fill="url(#${id}-eye)"/>
      <path d="M56 86 L55 92 L58 89 Z" fill="#fff"/>
      <path d="M64 86 L65 92 L62 89 Z" fill="#fff"/>`,
    fox: `
      <polygon points="22,50 28,15 48,42" fill="url(#${id}-grad)"/>
      <polygon points="98,50 92,15 72,42" fill="url(#${id}-grad)"/>
      <polygon points="28,42 32,22 42,40" fill="#0a0118"/>
      <polygon points="92,42 88,22 78,40" fill="#0a0118"/>
      <path d="M30 50 Q60 35 90 50 Q90 80 60 100 Q30 80 30 50 Z" fill="url(#${id}-soft)" stroke="${color}" stroke-width="2"/>
      <ellipse cx="35" cy="78" rx="14" ry="12" fill="#fff" opacity="0.95"/>
      <ellipse cx="85" cy="78" rx="14" ry="12" fill="#fff" opacity="0.95"/>
      <path d="M50 75 Q60 90 70 75 L62 95 L58 95 Z" fill="#fff"/>
      <ellipse cx="60" cy="78" rx="4" ry="3" fill="#0a0118"/>
      <path d="M40 60 Q48 56 52 64 Q48 68 40 60" fill="#0a0118"/>
      <path d="M80 60 Q72 56 68 64 Q72 68 80 60" fill="#0a0118"/>
      <circle cx="46" cy="62" r="2" fill="${color}"/>
      <circle cx="74" cy="62" r="2" fill="${color}"/>`,
    panther: `
      <circle cx="32" cy="35" r="10" fill="#1a0a2e" stroke="${color}" stroke-width="2"/>
      <circle cx="88" cy="35" r="10" fill="#1a0a2e" stroke="${color}" stroke-width="2"/>
      <circle cx="32" cy="35" r="5" fill="${color}"/>
      <circle cx="88" cy="35" r="5" fill="${color}"/>
      <ellipse cx="60" cy="65" rx="34" ry="34" fill="#0f0420" stroke="${color}" stroke-width="2.5"/>
      <ellipse cx="45" cy="60" rx="9" ry="6" fill="${color}"/>
      <ellipse cx="75" cy="60" rx="9" ry="6" fill="${color}"/>
      <ellipse cx="45" cy="60" rx="2" ry="6" fill="#0a0118"/>
      <ellipse cx="75" cy="60" rx="2" ry="6" fill="#0a0118"/>
      <path d="M50 78 Q60 88 70 78 L65 90 L55 90 Z" fill="#1a0a2e"/>
      <path d="M55 80 Q60 76 65 80 L62 84 L58 84 Z" fill="${color}"/>`,
    falcon: `
      <path d="M40 35 Q60 15 80 35 L75 45 Q60 30 45 45 Z" fill="url(#${id}-grad)"/>
      <path d="M28 55 Q60 35 92 55 Q92 88 60 100 Q28 88 28 55 Z" fill="url(#${id}-soft)" stroke="${color}" stroke-width="2"/>
      <path d="M28 60 Q60 55 92 60 L92 70 Q60 65 28 70 Z" fill="#0a0118" opacity="0.8"/>
      <circle cx="42" cy="65" r="4" fill="${color}"/>
      <circle cx="78" cy="65" r="4" fill="${color}"/>
      <circle cx="42" cy="65" r="1.5" fill="#fff"/>
      <circle cx="78" cy="65" r="1.5" fill="#fff"/>
      <path d="M52 78 Q60 95 68 78 L64 92 L60 96 L56 92 Z" fill="${colorAlt}" stroke="#0a0118" stroke-width="1"/>`,
    lion: (() => {
      let path = '';
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const cx = 60 + Math.cos(a) * 38;
        const cy = 62 + Math.sin(a) * 38;
        path += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="14" fill="url(#${id}-grad)" opacity="0.85"/>`;
      }
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.2;
        const cx = 60 + Math.cos(a) * 28;
        const cy = 62 + Math.sin(a) * 28;
        path += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="11" fill="${colorAlt}"/>`;
      }
      path += `
        <ellipse cx="60" cy="65" rx="26" ry="26" fill="#fff8e1"/>
        <circle cx="40" cy="48" r="6" fill="${color}"/>
        <circle cx="80" cy="48" r="6" fill="${color}"/>
        <circle cx="40" cy="48" r="3" fill="${colorAlt}"/>
        <circle cx="80" cy="48" r="3" fill="${colorAlt}"/>
        <ellipse cx="50" cy="62" rx="4" ry="5" fill="#0a0118"/>
        <ellipse cx="70" cy="62" rx="4" ry="5" fill="#0a0118"/>
        <path d="M55 72 Q60 68 65 72 L62 78 L58 78 Z" fill="#0a0118"/>
        <path d="M60 78 L60 84 M55 84 Q60 90 65 84" stroke="#0a0118" stroke-width="1.5" fill="none"/>`;
      return path;
    })(),
    owl: `
      <path d="M60 18 L70 35 L85 25 L82 42 L98 45 L88 58 L98 68 L85 75 L82 90 L70 80 L60 95 L50 80 L38 90 L35 75 L22 68 L32 58 L22 45 L38 42 L35 25 L50 35 Z" fill="url(#${id}-soft)" stroke="${color}" stroke-width="2"/>
      <ellipse cx="60" cy="62" rx="32" ry="30" fill="url(#${id}-soft)"/>
      <circle cx="45" cy="60" r="14" fill="#fff8e1" opacity="0.95"/>
      <circle cx="75" cy="60" r="14" fill="#fff8e1" opacity="0.95"/>
      <circle cx="45" cy="60" r="9" fill="#0a0118"/>
      <circle cx="75" cy="60" r="9" fill="#0a0118"/>
      <circle cx="45" cy="60" r="6" fill="${color}"/>
      <circle cx="75" cy="60" r="6" fill="${color}"/>
      <circle cx="46" cy="58" r="2" fill="#fff"/>
      <circle cx="76" cy="58" r="2" fill="#fff"/>
      <path d="M55 72 L60 82 L65 72 Z" fill="${colorAlt}" stroke="#0a0118" stroke-width="1"/>`,
    dragon: `
      <path d="M30 40 L20 15 L38 32 Z" fill="url(#${id}-grad)"/>
      <path d="M90 40 L100 15 L82 32 Z" fill="url(#${id}-grad)"/>
      <path d="M50 22 L55 12 L60 22" fill="${colorAlt}"/>
      <path d="M60 22 L65 12 L70 22" fill="${colorAlt}"/>
      <path d="M28 55 Q60 30 92 55 L88 80 Q60 105 32 80 Z" fill="url(#${id}-soft)" stroke="${color}" stroke-width="2"/>
      <ellipse cx="44" cy="62" rx="7" ry="9" fill="#0a0118"/>
      <ellipse cx="76" cy="62" rx="7" ry="9" fill="#0a0118"/>
      <ellipse cx="44" cy="62" rx="2.5" ry="7" fill="${color}"/>
      <ellipse cx="76" cy="62" rx="2.5" ry="7" fill="${color}"/>
      <ellipse cx="50" cy="80" rx="2" ry="3" fill="#0a0118"/>
      <ellipse cx="70" cy="80" rx="2" ry="3" fill="#0a0118"/>
      <path d="M48 88 Q55 92 62 88 Q68 92 75 88" stroke="#0a0118" stroke-width="2" fill="none"/>
      <path d="M52 88 L50 96 L54 92 Z" fill="#fff"/>
      <path d="M68 88 L70 96 L66 92 Z" fill="#fff"/>`
  };

  return `<svg width="${size}" height="${size}" viewBox="0 0 120 120">${baseDefs}${bodies[kind] || bodies.wolf}</svg>`;
}

// ============== Eventos visuales (compartidos) ==============
function fireEvent(ev) {
  const seller = SELLER_BY_ID[ev.sellerId];
  if (!seller) return;

  if (ev.type === 'SALE_TOP') {
    setTimeout(() => {
      const pillar = document.querySelector(`.pillar[data-seller-id="${seller.id}"]`);
      if (!pillar) return;
      const avatar = pillar.querySelector('[data-avatar]');
      if (avatar) {
        avatar.classList.remove('bounce'); void avatar.offsetWidth;
        avatar.classList.add('bounce');
      }
      const num = pillar.querySelector('.bar-v-num');
      if (num) {
        num.classList.remove('bump'); void num.offsetWidth;
        num.classList.add('bump');
      }
      spawnSpark(pillar, seller.color);
    }, 60);
    flyingPlus(seller.color);
    // Streak pop
    showStreakPop(seller, state.sellers[seller.id]);
    showContextPhrase(PHRASES_AFTER_SALE, 4000);
  }
  if (ev.type === 'SALE_OUTSIDER') {
    outsiderPop(seller);
    smallConfetti(seller.color);
    showStreakPop(seller, state.sellers[seller.id]);
    showContextPhrase(PHRASES_AFTER_SALE, 4000);
  }
  if (ev.type === 'CLIMB') {
    setTimeout(() => {
      const pillar = document.querySelector(`.pillar[data-seller-id="${seller.id}"]`);
      if (!pillar) return;
      pillar.classList.remove('glow'); void pillar.offsetWidth;
      pillar.classList.add('glow');
      const avatar = pillar.querySelector('[data-avatar]');
      if (avatar) {
        avatar.classList.remove('spin'); void avatar.offsetWidth;
        avatar.classList.add('spin');
      }
      const badge = document.createElement('div');
      badge.className = 'climb-badge';
      badge.textContent = '▲ SUBE';
      pillar.appendChild(badge);
      setTimeout(() => badge.remove(), 2400);
    }, 80);
  }
  if (ev.type === 'NEW_LEADER') {
    showLeaderBanner(seller);
    bigConfetti(seller.color, seller.colorAlt);
    showContextPhrase(PHRASES_NEW_LEADER, 5000);
  }
  if (ev.type === 'GOAL_REACHED') {
    showGoalBanner(seller);
    bigConfetti(seller.color, seller.colorAlt);
  }
}

function spawnSpark(pillar, color) {
  const sparksHost = pillar.querySelector('.bar-v-sparks');
  if (!sparksHost) return;
  for (let i = 0; i < 6; i++) {
    const sp = document.createElement('span');
    sp.className = 'spark';
    sp.style.left = (10 + Math.random() * 80) + '%';
    sp.style.bottom = (Math.random() * 30) + '%';
    sp.style.background = color;
    sp.style.boxShadow = `0 0 8px ${color}, 0 0 16px ${color}`;
    sp.style.animationDelay = (i * 0.08) + 's';
    sparksHost.appendChild(sp);
    setTimeout(() => sp.remove(), 1700);
  }
}

function flyingPlus(color) {
  const el = document.createElement('div');
  el.className = 'float-plus';
  el.textContent = '+1';
  el.style.color = color;
  el.style.textShadow = `0 0 20px ${color}, 0 0 40px ${color}`;
  el.style.left = (40 + Math.random() * 60) + '%';
  el.style.top = '40%';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

function outsiderPop(seller) {
  const el = document.createElement('div');
  el.className = 'outsider-pop';
  el.style.cssText += `--accent: ${seller.color}; --accent-alt: ${seller.colorAlt}; border: 2px solid ${seller.color}; box-shadow: 0 0 60px ${seller.color}, 0 10px 40px rgba(0,0,0,0.6);`;
  el.innerHTML = `
    <div style="filter: drop-shadow(0 0 8px ${seller.color});">${avatarSVG(seller.avatar, seller.color, seller.colorAlt, 56)}</div>
    <div>
      <div class="name" style="text-shadow: 0 0 10px ${seller.color};">${seller.name}</div>
      <div class="plus">+1 🎉</div>
    </div>
  `;
  document.body.appendChild(el);
  setTimeout(() => {
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 400);
  }, 3000);
}

function showLeaderBanner(seller) {
  const el = document.createElement('div');
  el.className = 'leader-banner';
  el.style.cssText += `--accent: ${seller.color}; --accent-alt: ${seller.colorAlt};`;
  el.innerHTML = `
    <div class="leader-inner">
      <div class="leader-tag">◆ ◆ ◆ NUEVO LÍDER ◆ ◆ ◆</div>
      <div class="leader-row">
        <div style="filter: drop-shadow(0 0 14px ${seller.color}) drop-shadow(0 0 28px ${seller.color}88);">
          ${avatarSVG(seller.avatar, seller.color, seller.colorAlt, 110)}
        </div>
        <div class="leader-name">${seller.name.toUpperCase()}</div>
      </div>
      <div class="leader-throne" style="color: ${seller.color};">TOMA EL TRONO 👑</div>
    </div>
  `;
  document.body.appendChild(el);
  setTimeout(() => {
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 500);
  }, 3500);
}

function showGoalBanner(seller) {
  const el = document.createElement('div');
  el.className = 'leader-banner';
  el.style.cssText += `--accent: ${seller.color}; --accent-alt: ${seller.colorAlt};`;
  el.innerHTML = `
    <div class="leader-inner">
      <div class="leader-tag" style="color: #FFD93D;">◆ ◆ ◆ META ALCANZADA ◆ ◆ ◆</div>
      <div class="leader-row">
        <div style="filter: drop-shadow(0 0 14px ${seller.color}) drop-shadow(0 0 28px #FFD93D);">
          ${avatarSVG(seller.avatar, seller.color, seller.colorAlt, 110)}
        </div>
        <div class="leader-name">${seller.name.toUpperCase()}</div>
      </div>
      <div class="leader-throne" style="color: #FFD93D;">${WEEK_TARGET} VENTAS 🎯</div>
    </div>
  `;
  document.body.appendChild(el);
  setTimeout(() => {
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 500);
  }, 3500);
}

function smallConfetti(color) {
  if (typeof confetti === 'undefined') return;
  confetti({
    particleCount: 80, spread: 70,
    origin: { x: 0.15, y: 0.85 },
    colors: [color, '#FFD93D', '#fff', '#B47CFF'],
    scalar: 0.9
  });
}

function bigConfetti(c1, c2) {
  if (typeof confetti === 'undefined') return;
  const end = Date.now() + 2500;
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 70, origin: { x: 0 }, colors: [c1, c2, '#fff', '#FFD93D'] });
    confetti({ particleCount: 5, angle: 120, spread: 70, origin: { x: 1 }, colors: [c1, c2, '#fff', '#FFD93D'] });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({
    particleCount: 200, spread: 120,
    origin: { x: 0.5, y: 0.5 },
    colors: [c1, c2, '#fff', '#FFD93D', '#5EEAD4'],
    scalar: 1.2, startVelocity: 50
  });
}

function massiveConfetti(c1, c2) {
  if (typeof confetti === 'undefined') return;
  confetti({
    particleCount: 250, spread: 160,
    origin: { x: 0.5, y: 0.4 },
    colors: [c1, c2, '#fff', '#FFD93D', '#5EEAD4', '#B47CFF', '#FF4FB6'],
    scalar: 1.4, startVelocity: 60, ticks: 300
  });
  confetti({ particleCount: 100, spread: 100, origin: { x: 0, y: 0.5 },
    colors: [c1, c2, '#fff'], angle: 60, startVelocity: 55 });
  confetti({ particleCount: 100, spread: 100, origin: { x: 1, y: 0.5 },
    colors: [c1, c2, '#fff'], angle: 120, startVelocity: 55 });
}

// ============== Ceremonia ==============
function closeWeek(triggeredLocally = true) {
  const ranked = getRanked();
  const winner = ranked[0];
  if (!winner || winner.total === 0) {
    alert('Aún no hay ventas registradas para cerrar la semana.');
    return;
  }

  // Top 3
  const top3 = ranked.slice(0, 3).map(s => {
    let bestPage = null, bestPageCount = 0;
    s.pages.forEach(p => {
      const c = state.pages[p] || 0;
      if (c > bestPageCount) { bestPageCount = c; bestPage = p; }
    });
    if (!bestPage) bestPage = s.pages[0];
    return {
      sellerId: s.id, name: s.name, avatar: s.avatar,
      color: s.color, colorAlt: s.colorAlt,
      total: s.total, bestPage, bestPageCount,
      pages: s.pages
    };
  });

  // Stats extras
  const totalWeek = ranked.reduce((sum, s) => sum + s.total, 0);
  const bestStreak = computeBestStreak();

  const data = {
    top3,
    totalWeek,
    bestStreak,
    ts: Date.now()
  };

  if (triggeredLocally) {
    try { localStorage.setItem(CEREMONY_KEY, JSON.stringify(data)); } catch (e) {}
  }
  showCeremony(data);
}

// Calcular mejor racha consecutiva
function computeBestStreak() {
  const hist = state.history || [];
  if (!hist.length) return { sellerId: null, count: 0 };

  let bestId = null, bestCount = 0;
  let curId = null, curCount = 0;
  hist.forEach(h => {
    if (h.sellerId === curId) {
      curCount++;
    } else {
      curId = h.sellerId;
      curCount = 1;
    }
    if (curCount > bestCount) {
      bestCount = curCount;
      bestId = curId;
    }
  });
  return { sellerId: bestId, count: bestCount };
}

function showCeremony(data) {
  // Limpiar ceremonia anterior
  document.querySelectorAll('.ceremony-overlay').forEach(el => el.remove());

  const overlay = document.createElement('div');
  overlay.className = 'ceremony-overlay';

  // Top 3 (compatibilidad con datos viejos)
  const top3 = data.top3 || [{
    sellerId: data.sellerId, name: data.name, avatar: data.avatar,
    color: data.color, colorAlt: data.colorAlt, total: data.total,
    bestPage: data.bestPage, bestPageCount: data.bestPageCount,
    pages: SELLER_BY_ID[data.sellerId]?.pages || []
  }];

  const winner = top3[0];
  const second = top3[1];
  const third  = top3[2];

  const streakSeller = data.bestStreak?.sellerId ? SELLER_BY_ID[data.bestStreak.sellerId] : null;
  const streakHtml = streakSeller && data.bestStreak.count > 1 ? `
    <div class="ceremony-extra">
      <div class="ceremony-extra-label">🔥 MEJOR RACHA</div>
      <div class="ceremony-extra-value">${streakSeller.name} · ${data.bestStreak.count}</div>
    </div>` : '';

  const totalHtml = data.totalWeek != null ? `
    <div class="ceremony-extra">
      <div class="ceremony-extra-label">🎯 TOTAL DE LA SEMANA</div>
      <div class="ceremony-extra-value">${data.totalWeek} ventas</div>
    </div>` : '';

  function spotMarkup(seller, place) {
    if (!seller) return '';
    const pageText = seller.pages && seller.pages.length > 1
      ? `${seller.bestPage} · ${seller.bestPageCount} ventas`
      : (seller.bestPage || seller.pages?.[0] || '');
    const placeNum = place === 'first' ? '1°' : place === 'second' ? '2°' : '3°';
    const avSize = place === 'first' ? 130 : place === 'second' ? 100 : 88;

    return `
      <div class="podium-spot ${place} pre-fly" data-place="${place}">
        ${place === 'first' ? '<div class="podium-light-beam"></div>' : ''}
        ${place === 'first' ? '<div class="podium-crown" data-state="hidden">👑</div>' : ''}
        <div class="podium-trail"></div>
        <div class="podium-avatar" style="--accent: ${seller.color}; --accent-alt: ${seller.colorAlt}; --accent-55: ${seller.color}8c;">
          ${avatarSVG(seller.avatar, seller.color, seller.colorAlt, avSize)}
        </div>
        <div class="podium-name" style="color: ${seller.color}; text-shadow: 0 0 16px ${seller.color}">${seller.name}</div>
        <div class="podium-pages">${pageText}</div>
        <div class="podium-sales" style="color: ${seller.color}; text-shadow: 0 0 16px ${seller.color}">
          <span class="count-up" data-target="${seller.total}">0</span> VENTAS
        </div>
        <div class="podium-block">
          <div class="place">${placeNum}</div>
        </div>
      </div>
    `;
  }

  overlay.innerHTML = `
    <div class="ceremony-rays"></div>
    <div class="ceremony-stars"></div>
    <button class="ceremony-close" data-action="close">✕</button>
    <h1 class="ceremony-title">
      <span class="trophy">🏆</span>
      GANADORES DE LA SEMANA
      <span class="trophy">🏆</span>
    </h1>
    <div class="podium-stage">
      ${spotMarkup(second, 'second')}
      ${spotMarkup(winner, 'first')}
      ${spotMarkup(third,  'third')}
    </div>
    <div class="ceremony-extras">
      ${totalHtml}
      ${streakHtml}
    </div>
    <div class="ceremony-message">
      ¡FELICIDADES EQUIPO! · MAÑANA VAMOS POR MÁS 🚀
    </div>
    <div class="ceremony-actions">
      <button class="btn-primary" data-action="new-week">🎯 INICIAR NUEVA SEMANA</button>
      <button class="btn-secondary" data-action="close">Cerrar</button>
    </div>
  `;

  document.body.appendChild(overlay);
  void overlay.offsetWidth;
  overlay.classList.add('visible');

  // ============== Choreography ==============
  // 0s: arranca todo, fanfarria comienza
  Sounds.victoryFanfare();

  // 0.3s: título aparece con glitch
  setTimeout(() => {
    overlay.querySelector('.ceremony-title')?.classList.add('appear');
  }, 300);

  // Función para animar count-up de números
  function animateCountUp(el, target, duration = 1500) {
    if (!el) return;
    const start = Date.now();
    function step() {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const value = Math.round(target * eased);
      el.textContent = value;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function activateSpot(place, delay) {
    setTimeout(() => {
      const spot = overlay.querySelector(`.podium-spot[data-place="${place}"]`);
      if (!spot) return;
      spot.classList.remove('pre-fly');
      spot.classList.add('flying-in');
      Sounds.swoosh();

      // Después de la entrada (1.4s), aterriza y comienza count-up
      setTimeout(() => {
        spot.classList.remove('flying-in');
        spot.classList.add('landed');
        Sounds.land();
        const counter = spot.querySelector('.count-up');
        if (counter) animateCountUp(counter, parseInt(counter.dataset.target, 10));

        // Iniciar animación de baile en el avatar
        const avatar = spot.querySelector('.podium-avatar');
        if (avatar) {
          avatar.classList.add('celebrating');
          if (place === 'first') avatar.classList.add('celebrating-strong');
        }

        // Confetti per spot
        const colors = {
          first:  ['#FFD93D', '#FF8C42'],
          second: ['#C0C0C0', '#E8E8E8'],
          third:  ['#CD7F32', '#8B4513']
        };
        const c = colors[place] || ['#B47CFF', '#FF4FB6'];
        smallConfetti(c[0]);
      }, 1400);
    }, delay);
  }

  // 3.0s: aparece el #3 (vuela desde la izquierda)
  if (third) activateSpot('third', 3000);

  // 7.0s: aparece el #2 (vuela desde la derecha)
  if (second) activateSpot('second', 7000);

  // 11.0s: light beam aparece (preludio del #1)
  setTimeout(() => {
    const beam = overlay.querySelector('.podium-spot.first .podium-light-beam');
    if (beam) beam.classList.add('active');
  }, 11000);

  // 11.5s: aparece el #1 (desciende del cielo con haz de luz)
  if (winner) {
    setTimeout(() => {
      const spot = overlay.querySelector('.podium-spot[data-place="first"]');
      if (!spot) return;
      spot.classList.remove('pre-fly');
      spot.classList.add('descending-from-sky');
      Sounds.swoosh();

      // Aterrizaje del ganador (1.6s después)
      setTimeout(() => {
        spot.classList.remove('descending-from-sky');
        spot.classList.add('landed');
        Sounds.land();
        const counter = spot.querySelector('.count-up');
        if (counter) animateCountUp(counter, parseInt(counter.dataset.target, 10), 1800);

        const avatar = spot.querySelector('.podium-avatar');
        if (avatar) avatar.classList.add('celebrating', 'celebrating-strong');

        // Confeti dorado masivo
        massiveConfetti(winner.color, '#FFD93D');
        setTimeout(() => massiveConfetti('#FFD93D', '#FF8C42'), 600);
      }, 1600);

      // 1.8s después del aterrizaje: corona desciende
      setTimeout(() => {
        const crown = overlay.querySelector('.podium-spot.first .podium-crown');
        if (crown) {
          crown.dataset.state = 'descending';
          Sounds.crownDescend();
          setTimeout(() => { crown.dataset.state = 'placed'; }, 1000);
        }
      }, 3400);
    }, 11500);
  }

  // 15.5s: confeti final masivo (climax de música)
  setTimeout(() => {
    massiveConfetti('#FFD93D', '#FF8C42');
  }, 15500);
  setTimeout(() => {
    massiveConfetti('#FF4FB6', '#B47CFF');
  }, 16500);
  setTimeout(() => {
    massiveConfetti('#5EEAD4', '#FFD93D');
  }, 17500);

  // Mensajes y acciones aparecen al final (16s)
  setTimeout(() => {
    overlay.querySelector('.ceremony-extras')?.classList.add('appear');
    overlay.querySelector('.ceremony-message')?.classList.add('appear');
    overlay.querySelector('.ceremony-actions')?.classList.add('appear');
  }, 16000);

  overlay.querySelectorAll('[data-action="close"]').forEach(btn => {
    btn.addEventListener('click', () => {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 600);
    });
  });

  const newWeekBtn = overlay.querySelector('[data-action="new-week"]');
  if (newWeekBtn) {
    newWeekBtn.addEventListener('click', () => {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.remove();
        resetAll();
      }, 600);
    });
  }
}

// ============== Idle Mode ==============
let idleTimer = null;
let idleEl = null;
function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  if (idleEl) idleEl.classList.remove('visible');
  particlesIntensity = 1.2;
  const total = Object.values(state.sellers).reduce((a, b) => a + b, 0);
  if (total === 0) return;
  idleTimer = setTimeout(showIdle, 30000);
}

function showIdle() {
  if (!idleEl) {
    idleEl = document.createElement('div');
    idleEl.className = 'idle-banner';
    idleEl.innerHTML = `<span class="idle-dot"></span> ESPERANDO VENTAS <span class="idle-dot"></span>`;
    document.body.appendChild(idleEl);
  }
  idleEl.classList.add('visible');
  particlesIntensity = 0.4;
}

// ============== Particles ==============
let particlesIntensity = 1.2;
function initParticles() {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resize() {
    canvas.width  = window.innerWidth  * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const colors = [
    'rgba(255,217,61,0.9)', 'rgba(255,140,66,0.9)',
    'rgba(107,201,255,0.9)', 'rgba(255,79,182,0.9)',
    'rgba(94,234,212,0.9)',  'rgba(180,124,255,0.9)'
  ];

  function makeP() {
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.8 + 0.6,
      color: colors[Math.floor(Math.random() * colors.length)],
      pulse: Math.random() * Math.PI * 2
    };
  }
  particles = Array.from({ length: 60 }, makeP);

  function tick() {
    const w = window.innerWidth, h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);
    const I = particlesIntensity;

    for (let a = 0; a < particles.length; a++) {
      for (let b = a + 1; b < particles.length; b++) {
        const dx = particles[a].x - particles[b].x;
        const dy = particles[a].y - particles[b].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 130) {
          const alpha = (1 - dist / 130) * 0.15 * I;
          ctx.strokeStyle = `rgba(180,124,255,${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[a].x, particles[a].y);
          ctx.lineTo(particles[b].x, particles[b].y);
          ctx.stroke();
        }
      }
    }

    particles.forEach(p => {
      p.x += p.vx * I; p.y += p.vy * I; p.pulse += 0.04;
      if (p.x < 0) p.x = w; else if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h; else if (p.y > h) p.y = 0;
      const ps = p.r + Math.sin(p.pulse) * 0.6;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8 * I;
      ctx.beginPath();
      ctx.arc(p.x, p.y, ps, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    requestAnimationFrame(tick);
  }
  tick();
}

// ============== Cross-tab sync ==============
function setupCrossTabSync() {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const incoming = JSON.parse(e.newValue);
        // Asegurar que commission siempre exista (defensa)
        if (!incoming.commission) {
          incoming.commission = {
            todayDate: null, todayAmount: null, todayPremium: false,
            month: null, premiumUsedThisMonth: 0, earned: {}
          };
        }
        const beforeTop4 = getRanked().slice(0, 4).map(r => r.id);
        const oldTotal = Object.values(state.sellers).reduce((a, b) => a + b, 0);
        const newTotal = Object.values(incoming.sellers).reduce((a, b) => a + b, 0);
        const oldHistLen = state.history.length;
        const oldSellerTotals = { ...state.sellers };
        state = incoming;
        if (typeof renderAll === 'function') renderAll();
        if (typeof updateRevealBtn === 'function') updateRevealBtn();

        if (newTotal > oldTotal && state.history.length > oldHistLen) {
          const last = state.history[state.history.length - 1];
          const seller = SELLER_BY_ID[last.sellerId];
          if (seller) {
            const wasInTop = beforeTop4.includes(last.sellerId);
            fireEvent({ type: wasInTop ? 'SALE_TOP' : 'SALE_OUTSIDER', sellerId: last.sellerId });
            detectClimbAndLeader(beforeTop4);

            const beforeS = oldSellerTotals[last.sellerId] || 0;
            const afterS = state.sellers[last.sellerId];
            if (beforeS < WEEK_TARGET && afterS >= WEEK_TARGET) {
              fireEvent({ type: 'GOAL_REACHED', sellerId: last.sellerId });
            }
          }
        }
      } catch (err) {}
    }
    if (e.key === CEREMONY_KEY && e.newValue) {
      try {
        const data = JSON.parse(e.newValue);
        showCeremony(data);
      } catch (err) {}
    }
  });
}

// ============== FRASES MOTIVACIONALES ROTATIVAS ==============
const PHRASES_ACTIVE = [
  "Cierra como si tu bono dependiera de eso · Spoiler: depende",
  "El que no vende no come · Vamos",
  "Sales mode: ON",
  "Ofrece, sonríe y vende",
  "Cada NO te acerca a un SÍ",
  "Tu meta no se va a alcanzar sola",
  "Dale más fuego al WhatsApp",
  "El cliente está esperando · No lo dejes solo",
  "Hoy es el día de cerrar",
  "Que tu próximo cliente sienta el fuego"
];

const PHRASES_IDLE = [
  "El silencio del teléfono no se llena solo",
  "Una llamada vale por mil mensajes",
  "Hay metas que no se rompen solas",
  "Vamos · Que la racha empieza con un click",
  "Recuerda: el primer NO es solo el inicio"
];

const PHRASES_AFTER_SALE = [
  "¡Ese lleva carrera!",
  "¡Otra más para la cuenta!",
  "¡Imparable!",
  "¡Que llueva!",
  "¡Así se cierra!",
  "¡Esto está prendiendo!",
  "¡Más madera!"
];

const PHRASES_NEW_LEADER = [
  "El trono cambió de dueño",
  "Nuevo líder en la pista",
  "Toma el liderazgo · Defiéndelo",
  "El que mucho vende, lidera"
];

let phraseEl = null;
let phraseTimer = null;

function setPhrase(text) {
  if (!phraseEl) return;
  phraseEl.style.animation = 'none';
  void phraseEl.offsetWidth;
  phraseEl.textContent = text;
  phraseEl.style.animation = '';
}

function startPhraseRotator() {
  phraseEl = document.getElementById('phraseRotator');
  if (!phraseEl) return;

  function pickAndShow() {
    const total = Object.values(state.sellers).reduce((a, b) => a + b, 0);
    const lastTs = state.history.length ? state.history[state.history.length - 1].ts : 0;
    const isIdle = total === 0 || (Date.now() - lastTs > 60000);
    const pool = isIdle ? PHRASES_IDLE : PHRASES_ACTIVE;
    const phrase = pool[Math.floor(Math.random() * pool.length)];
    setPhrase(phrase);
  }

  pickAndShow();
  if (phraseTimer) clearInterval(phraseTimer);
  phraseTimer = setInterval(pickAndShow, 9000);
}

// Frase contextual al recibir venta (sobreescribe temporalmente)
function showContextPhrase(pool, ms = 5000) {
  if (!phraseEl) return;
  const phrase = pool[Math.floor(Math.random() * pool.length)];
  setPhrase(phrase);
  setTimeout(() => {
    if (typeof startPhraseRotator === 'function') startPhraseRotator();
  }, ms);
}

// ============== STREAK POP ==============
function showStreakPop(seller, salesCount) {
  // Quitar otros pops antes
  document.querySelectorAll('.streak-pop').forEach(el => {
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 400);
  });

  const el = document.createElement('div');
  el.className = 'streak-pop';
  el.style.cssText = `--accent: ${seller.color};`;

  const phrase = PHRASES_AFTER_SALE[Math.floor(Math.random() * PHRASES_AFTER_SALE.length)];

  el.innerHTML = `
    <div class="streak-pop-avatar">${avatarSVG(seller.avatar, seller.color, seller.colorAlt, 48)}</div>
    <div class="streak-pop-text">
      <div class="streak-pop-msg">${phrase}</div>
      <div class="streak-pop-detail">${seller.name} · venta #${salesCount}</div>
    </div>
  `;
  document.body.appendChild(el);
  setTimeout(() => {
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 400);
  }, 4000);
}

// ============== STATS PARA FOOTER ==============
function getTopSeller() {
  const ranked = getRanked();
  return ranked[0]?.total > 0 ? ranked[0] : null;
}

function getCurrentStreak() {
  // Racha actual: cuántas ventas seguidas lleva el último que vendió
  const hist = state.history || [];
  if (!hist.length) return null;
  const lastId = hist[hist.length - 1].sellerId;
  let count = 0;
  for (let i = hist.length - 1; i >= 0; i--) {
    if (hist[i].sellerId === lastId) count++;
    else break;
  }
  return { sellerId: lastId, count };
}

function getBestStreakOfWeek() {
  return computeBestStreak();
}

// ============================================================
// SISTEMA DE COMISIONES + SONIDOS + REVELACIÓN
// ============================================================

const COMMISSION_KEY  = 'sales-arena-commission-v3';
const COMMISSION_REVEAL_KEY = 'sales-arena-commission-reveal-v3';

// Días de la semana laborable (Lun-Sab)
const WEEK_DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday'];
const DAY_LABELS_ES = {
  monday: 'LUNES', tuesday: 'MARTES', wednesday: 'MIÉRCOLES',
  thursday: 'JUEVES', friday: 'VIERNES', saturday: 'SÁBADO'
};

// Número de comisiones premium ($25-$30) que se permiten por mes
const PREMIUM_PER_MONTH = 1;

// Inicializar / migrar state de commission
function ensureCommissionState() {
  if (!state.commission) {
    state.commission = {
      byDay: {},
      month: null,
      premiumUsedThisMonth: 0,
      earned: {}
    };
  }
  if (!state.commission.byDay) state.commission.byDay = {};
  WEEK_DAYS.forEach(d => {
    if (!state.commission.byDay[d]) {
      state.commission.byDay[d] = {
        amount: null, premium: false, revealed: false, revealedAt: null
      };
    }
  });
  if (!state.commission.earned) state.commission.earned = {};
  // Cleanup de keys legacy
  delete state.commission.todayDate;
  delete state.commission.todayAmount;
  delete state.commission.todayPremium;
}
ensureCommissionState();
saveState();

// === Helpers de fecha ===
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function monthStr() { return todayStr().slice(0, 7); }

// === Roll de comisión inteligente para un día específico ===
function rollCommissionForDay(day, forceReroll = false) {
  ensureCommissionState();
  const month = monthStr();

  // Reset al cambiar de mes
  if (state.commission.month !== month) {
    state.commission.month = month;
    state.commission.premiumUsedThisMonth = 0;
  }

  const dayState = state.commission.byDay[day];

  // Si ya está revelado y no forzamos re-roll, devolver el actual
  if (dayState.revealed && dayState.amount != null && !forceReroll) {
    return {
      day,
      amount: dayState.amount,
      premium: dayState.premium,
      alreadyRolled: true
    };
  }

  // Si forzamos re-roll y era premium, devolver esa premium al pool
  if (forceReroll && dayState.premium && state.commission.premiumUsedThisMonth > 0) {
    state.commission.premiumUsedThisMonth -= 1;
  }

  // ============== REGLAS POR DÍA ==============
  // - Lunes: SOLO $12-$19 (nunca $20+, nunca premium)
  // - Martes a Sábado: pueden salir $20-$24 (con tope semanal)
  // - Premium $25-$30: solo 1 vez al mes, NUNCA en lunes (preferencia: sábado)

  const isMonday = day === 'monday';

  // Contar cuántos días de esta semana ya tienen monto en cada rango (excluyendo el día actual)
  let weekHigh21To24 = 0;   // cuántos días con $21-$24
  let weekTwenties = 0;     // cuántos días con $20+
  WEEK_DAYS.forEach(d => {
    if (d === day) return;
    const ds = state.commission.byDay[d];
    if (ds.revealed && ds.amount != null && !ds.premium) {
      if (ds.amount >= 21 && ds.amount <= 24) weekHigh21To24++;
      if (ds.amount >= 20) weekTwenties++;
    }
  });

  // === DECIDIR PREMIUM ===
  const date = new Date();
  const totalDays = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const daysLeft  = totalDays - date.getDate() + 1;
  const rollsLeftEstimate = Math.max(1, Math.round(daysLeft * 6 / 7));
  const premiumLeft = Math.max(0, PREMIUM_PER_MONTH - (state.commission.premiumUsedThisMonth || 0));

  let isPremium = false;
  if (!isMonday && premiumLeft > 0) {
    let premiumChance = 0.07; // base baja: rara
    const minNeeded = premiumLeft / Math.max(1, rollsLeftEstimate);
    if (minNeeded > premiumChance) premiumChance = minNeeded;
    premiumChance = Math.min(0.85, premiumChance);
    isPremium = Math.random() < premiumChance;
  }

  // === DECIDIR MONTO ===
  let amount;
  if (isPremium) {
    amount = 25 + Math.floor(Math.random() * 6); // 25-30
  } else if (isMonday) {
    // Lunes SIEMPRE bajo: $12-$19
    amount = 12 + Math.floor(Math.random() * 8); // 12-19
  } else {
    // Otros días: por default $12-$19, pero con cierta probabilidad puede ser $20-$24
    // Reglas:
    //   - Tope semanal: máximo 2 días con $20+
    //   - Tope semanal: máximo 1 día con $21-$24
    //   - Probabilidad base: 25% de "salir alto" (20+) si los topes lo permiten

    const canBe20  = weekTwenties < 2;
    const canBe21Plus = weekHigh21To24 < 1;

    let highChance = 0.25; // 25% de chance de "alto" si caben
    if (Math.random() < highChance && canBe20) {
      // Sale "alto". ¿Cuánto?
      if (canBe21Plus && Math.random() < 0.45) {
        amount = 21 + Math.floor(Math.random() * 4); // 21-24
      } else {
        amount = 20; // solo 20
      }
    } else {
      // Sale bajo: $12-$19
      amount = 12 + Math.floor(Math.random() * 8); // 12-19
    }
  }

  state.commission.byDay[day] = {
    amount, premium: isPremium, revealed: true, revealedAt: Date.now()
  };
  if (isPremium) state.commission.premiumUsedThisMonth += 1;
  saveState();

  return { day, amount, premium: isPremium, alreadyRolled: false };
}

// === Establecer manualmente el monto de un día (custom) ===
function setManualCommission(day, amount) {
  ensureCommissionState();
  amount = Math.max(1, Math.min(99, parseInt(amount, 10) || 0));
  if (amount === 0) return null;

  const month = monthStr();
  if (state.commission.month !== month) {
    state.commission.month = month;
    state.commission.premiumUsedThisMonth = 0;
  }

  const dayState = state.commission.byDay[day];
  // Si tenía premium, devolver la premium al pool
  if (dayState.premium && state.commission.premiumUsedThisMonth > 0) {
    state.commission.premiumUsedThisMonth -= 1;
  }

  const isPremium = amount >= 25;
  state.commission.byDay[day] = {
    amount, premium: isPremium, revealed: true, revealedAt: Date.now()
  };
  if (isPremium) state.commission.premiumUsedThisMonth += 1;
  saveState();
  return { day, amount, premium: isPremium };
}

// === Comisión activa = la del último día revelado ===
function getActiveCommission() {
  ensureCommissionState();
  let latest = null;
  WEEK_DAYS.forEach(d => {
    const ds = state.commission.byDay[d];
    if (ds.revealed && ds.amount != null) {
      if (!latest || (ds.revealedAt || 0) > (latest.revealedAt || 0)) {
        latest = { day: d, ...ds };
      }
    }
  });
  return latest;
}

// === Acumulado por vendedor ===
function getEarningsBoard() {
  return SELLERS.map(s => ({
    ...s,
    earned: state.commission.earned[s.id] || 0,
    total: state.sellers[s.id] || 0
  })).sort((a, b) => (b.earned - a.earned) || a.name.localeCompare(b.name));
}

// === Hook al hacer una venta: sumar comisión activa ===
function applyCommissionToSale(sellerId) {
  const active = getActiveCommission();
  if (!active) return;
  state.commission.earned[sellerId] = (state.commission.earned[sellerId] || 0) + active.amount;
  saveState();
}

// === Disparar revelación cross-tab ===
function triggerCommissionReveal(day, forceReroll = false) {
  const result = rollCommissionForDay(day, forceReroll);
  const data = {
    day: result.day,
    dayLabel: DAY_LABELS_ES[result.day] || result.day.toUpperCase(),
    amount: result.amount,
    premium: result.premium,
    alreadyRolled: result.alreadyRolled,
    ts: Date.now()
  };
  try { localStorage.setItem(COMMISSION_REVEAL_KEY, JSON.stringify(data)); } catch (e) {}
  showCommissionReveal(data);
  return data;
}

// ============================================================
// SONIDOS — Web Audio API (sintetizados, sin archivos)
// ============================================================
const SOUND_KEY_PREFIX = 'sa-sound-pack-';

// Definición de los packs disponibles
const SOUND_PACKS = {
  sale: {
    label: '🔔 Sonido de venta',
    description: 'Cuando alguien registra una venta',
    options: {
      coin:    { label: '🪙 Moneda Mario',  description: 'Ding clásico de videojuego' },
      arcade:  { label: '🎮 Arcade',        description: 'Beep estilo arcade 80s' },
      bell:    { label: '🛎️ Campana',       description: 'Campanita suave' },
      laser:   { label: '🔫 Láser',         description: 'Pew-pew futurista' }
    },
    default: 'coin'
  },
  reveal: {
    label: '🎵 Música de revelación',
    description: 'Cuando se rolea la comisión del día',
    options: {
      squid:   { label: '🦑 Squid Game',     description: 'Trompetas dramáticas + drumroll' },
      drumroll:{ label: '🥁 Solo drumroll',   description: 'Tambores tradicionales de tensión' },
      casino:  { label: '🎰 Casino',         description: 'Slot machine con bells' }
    },
    default: 'squid'
  },
  victory: {
    label: '🏆 Música de victoria',
    description: 'Cuando se cierra la semana (ceremonia)',
    options: {
      classical: { label: '🎺 Clásica épica', description: 'Fanfarria triunfal estilo orquesta' },
      anthem:    { label: '🎸 Himno glorioso', description: 'Acordes potentes ascendentes' },
      celebration:{ label: '🎉 Celebración',   description: 'Más alegre, ritmo de fiesta' }
    },
    default: 'classical'
  }
};

const Sounds = {
  enabled: (function() {
    try { return localStorage.getItem('sa-sound') !== 'off'; } catch (e) { return true; }
  })(),
  ctx: null,
  master: null,
  // Packs activos por categoría
  active: {
    sale:    (function(){ try { return localStorage.getItem(SOUND_KEY_PREFIX+'sale') || 'coin'; } catch(e) { return 'coin'; }})(),
    reveal:  (function(){ try { return localStorage.getItem(SOUND_KEY_PREFIX+'reveal') || 'squid'; } catch(e) { return 'squid'; }})(),
    victory: (function(){ try { return localStorage.getItem(SOUND_KEY_PREFIX+'victory') || 'classical'; } catch(e) { return 'classical'; }})()
  },

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.4;
      this.master.connect(this.ctx.destination);
    } catch (e) {}
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  toggle() {
    this.enabled = !this.enabled;
    try { localStorage.setItem('sa-sound', this.enabled ? 'on' : 'off'); } catch (e) {}
    return this.enabled;
  },

  setPack(category, packId) {
    if (!SOUND_PACKS[category] || !SOUND_PACKS[category].options[packId]) return;
    this.active[category] = packId;
    try { localStorage.setItem(SOUND_KEY_PREFIX + category, packId); } catch (e) {}
  },

  beep(freq, duration = 0.1, type = 'square', startGain = 0.3) {
    if (!this.enabled) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(g); g.connect(this.master);
    g.gain.setValueAtTime(startGain, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },

  // ====== SONIDOS DE VENTA — 4 packs ======
  _sale_coin() {
    this.beep(523.25, 0.05, 'square', 0.3);   // C5
    setTimeout(() => this.beep(783.99, 0.12, 'square', 0.3), 60);  // G5
  },
  _sale_arcade() {
    this.beep(880, 0.04, 'square', 0.25);
    setTimeout(() => this.beep(1100, 0.04, 'square', 0.25), 40);
    setTimeout(() => this.beep(1320, 0.08, 'square', 0.28), 80);
  },
  _sale_bell() {
    this.beep(1318.51, 0.18, 'triangle', 0.32);
    setTimeout(() => this.beep(1567.98, 0.22, 'triangle', 0.28), 80);
  },
  _sale_laser() {
    if (!this.enabled) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.connect(g); g.connect(this.master);
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(1500, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.15);
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.start(t); osc.stop(t + 0.2);
  },

  sale() {
    const fn = '_sale_' + this.active.sale;
    if (typeof this[fn] === 'function') this[fn]();
    else this._sale_coin();
  },

  // Venta especial / outsider — más alto
  saleOut() {
    // Variante más aguda del pack actual
    if (this.active.sale === 'coin') {
      this.beep(659.25, 0.05, 'square', 0.3);
      setTimeout(() => this.beep(987.77, 0.12, 'square', 0.3), 60);
    } else if (this.active.sale === 'arcade') {
      this.beep(1100, 0.04, 'square', 0.28);
      setTimeout(() => this.beep(1320, 0.04, 'square', 0.28), 40);
      setTimeout(() => this.beep(1760, 0.10, 'square', 0.30), 80);
    } else if (this.active.sale === 'bell') {
      this.beep(1567.98, 0.18, 'triangle', 0.34);
      setTimeout(() => this.beep(1975.53, 0.24, 'triangle', 0.30), 80);
    } else if (this.active.sale === 'laser') {
      this._sale_laser();
      setTimeout(() => this._sale_laser(), 100);
    } else {
      this.sale();
    }
  },

  // Sube de posición — riser
  climb() {
    this.beep(440, 0.04, 'sawtooth', 0.2);
    setTimeout(() => this.beep(554, 0.04, 'sawtooth', 0.2), 50);
    setTimeout(() => this.beep(659, 0.04, 'sawtooth', 0.2), 100);
    setTimeout(() => this.beep(880, 0.1, 'sawtooth', 0.25), 150);
  },

  // Nuevo líder — fanfarria corta
  newLeader() {
    this.beep(523, 0.08, 'square', 0.3);
    setTimeout(() => this.beep(659, 0.08, 'square', 0.3), 80);
    setTimeout(() => this.beep(784, 0.08, 'square', 0.3), 160);
    setTimeout(() => this.beep(1047, 0.18, 'square', 0.4), 240);
  },

  // Tick para slot machine
  tick() {
    this.beep(1200, 0.025, 'square', 0.15);
  },

  // Drumroll (ruido blanco)
  drumroll(durationMs = 2500) {
    if (!this.enabled) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * durationMs / 1000, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 600;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, this.ctx.currentTime + durationMs / 1000 * 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + durationMs / 1000);
    noise.connect(filter); filter.connect(gain); gain.connect(this.master);
    noise.start();
  },

  // Reveal premium — ka-ching épico
  bigReveal() {
    this.beep(523.25, 0.1, 'square', 0.4);
    setTimeout(() => this.beep(659.25, 0.1, 'square', 0.4), 100);
    setTimeout(() => this.beep(783.99, 0.1, 'square', 0.4), 200);
    setTimeout(() => this.beep(1046.5, 0.2, 'square', 0.45), 300);
    setTimeout(() => this.beep(1318.5, 0.3, 'square', 0.45), 500);
  },

  // Reveal normal
  smallReveal() {
    this.beep(659, 0.1, 'square', 0.35);
    setTimeout(() => this.beep(880, 0.18, 'square', 0.35), 100);
  },

  // ============================================================
  // PACKS DE REVELACIÓN (3 estilos)
  // ============================================================

  // Pack 1: Squid Game — trompetas dramáticas (~14 segundos)
  _reveal_squid() {
    if (!this.enabled) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const master = this.master;

    function brass(freq, start, dur, vol = 0.22) {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const g = ctx.createGain();
      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.value = freq;
      osc2.frequency.value = freq * 0.5;
      osc1.connect(g); osc2.connect(g);
      g.connect(master);
      const t = ctx.currentTime + start;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.04);
      g.gain.linearRampToValueAtTime(vol * 0.65, t + dur * 0.4);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc1.start(t); osc2.start(t);
      osc1.stop(t + dur); osc2.stop(t + dur);
    }
    function kick(start, vol = 0.35) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.connect(g); g.connect(master);
      const t = ctx.currentTime + start;
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.start(t); osc.stop(t + 0.25);
    }
    function snare(start, vol = 0.18) {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass'; filter.frequency.value = 1800;
      const g = ctx.createGain();
      const t = ctx.currentTime + start;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      noise.connect(filter); filter.connect(g); g.connect(master);
      noise.start(t);
    }

    const A4=440, C5=523, D5=587, E5=659, F5=698, G5=783, A5=880, B5=988, C6=1046;

    brass(A4, 0, 0.5, 0.18); brass(C5, 0.5, 0.5, 0.20); brass(E5, 1.0, 0.5, 0.22); brass(A5, 1.5, 0.5, 0.24);
    kick(0); kick(0.5); kick(1.0); kick(1.5);
    brass(G5, 2.0, 0.5, 0.24); brass(F5, 2.5, 0.5, 0.24); brass(E5, 3.0, 0.5, 0.24); brass(D5, 3.5, 0.5, 0.24);
    kick(2.0); kick(2.5); kick(3.0); kick(3.5); snare(2.5); snare(3.5);
    brass(C5, 4.0, 0.4, 0.24); brass(E5, 4.4, 0.4, 0.26); brass(G5, 4.8, 0.4, 0.28);
    brass(B5, 5.2, 0.4, 0.30); brass(C6, 5.6, 0.4, 0.32);
    for (let i = 0; i < 4; i++) kick(4.0 + i * 0.5);
    snare(4.5); snare(5.5);
    brass(A5, 6.0, 0.6, 0.30); brass(C5, 6.0, 0.6, 0.16);
    brass(G5, 6.6, 0.6, 0.30); brass(E5, 6.6, 0.6, 0.16);
    brass(A5, 7.2, 0.6, 0.32); brass(E5, 7.2, 0.6, 0.16);
    brass(C6, 7.8, 0.6, 0.34); brass(A5, 7.8, 0.6, 0.18);
    for (let i = 0; i < 5; i++) { kick(6.0 + i * 0.5); snare(6.25 + i * 0.5); }
    brass(C6, 8.4, 0.5, 0.34); brass(B5, 8.9, 0.5, 0.34);
    brass(A5, 9.4, 0.5, 0.34); brass(G5, 9.9, 0.5, 0.32);
    brass(F5, 10.4, 0.5, 0.32); brass(E5, 10.9, 0.5, 0.32);
    for (let i = 0; i < 5; i++) { kick(8.4 + i * 0.5); snare(8.65 + i * 0.5); }
    brass(A5, 11.4, 1.8, 0.36); brass(E5, 11.4, 1.8, 0.18); brass(C5, 11.4, 1.8, 0.16);
    for (let i = 0; i < 30; i++) {
      const tt = 11.4 + i * 0.07;
      snare(tt, 0.10 + i * 0.005);
    }
  },

  // Pack 2: Solo drumroll tradicional con kicks acelerando
  _reveal_drumroll() {
    if (!this.enabled) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    const ctx = this.ctx;
    // Drumroll snare aumentando intensidad
    this.drumroll(13000);
    // Kicks marcando el ritmo, acelerando
    const intervals = [0, 1.5, 3.0, 4.3, 5.5, 6.5, 7.4, 8.2, 8.9, 9.5, 10.0, 10.4, 10.7, 10.9, 11.1, 11.3, 11.5, 11.7, 11.9, 12.1, 12.3, 12.5, 12.7, 12.9];
    intervals.forEach(t => {
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.connect(g); g.connect(this.master);
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        g.gain.setValueAtTime(0.32, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now); osc.stop(now + 0.25);
      }, t * 1000);
    });
  },

  // Pack 3: Casino — slot machine con bells y ticks rítmicos
  _reveal_casino() {
    if (!this.enabled) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const master = this.master;

    // Bells melódicos en escala mayor
    const notes = [523, 659, 783, 1046, 1318, 1567];
    let i = 0;
    const interval = setInterval(() => {
      if (i >= 28) { clearInterval(interval); return; }
      const freq = notes[i % notes.length];
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.connect(g); g.connect(master);
      const t = ctx.currentTime;
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t); osc.stop(t + 0.3);
      i++;
    }, 450);

    // Ticks de fondo aceleran al final
    let tickCount = 0;
    function nextTick() {
      if (tickCount > 60) return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 1500 + Math.random() * 200;
      osc.connect(g); g.connect(master);
      const t = ctx.currentTime;
      g.gain.setValueAtTime(0.08, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.start(t); osc.stop(t + 0.05);
      tickCount++;
      const delay = Math.max(80, 250 - tickCount * 3);
      setTimeout(nextTick, delay);
    }
    nextTick();
  },

  // Dispatcher para revelación
  squidMelody() {
    const fn = '_reveal_' + this.active.reveal;
    if (typeof this[fn] === 'function') this[fn]();
    else this._reveal_squid();
  },

  // ============================================================
  // PACKS DE VICTORIA (3 estilos)
  // ============================================================

  // Pack 1: Clásica épica — fanfarria triunfal estilo orquesta (~18s)
  _victory_classical() {
    if (!this.enabled) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const master = this.master;

    function trumpet(freq, start, dur, vol = 0.22) {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const g = ctx.createGain();
      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.value = freq;
      osc2.frequency.value = freq * 2;
      const g2 = ctx.createGain();
      g2.gain.value = 0.3;
      osc2.connect(g2); g2.connect(g);
      osc1.connect(g);
      g.connect(master);
      const t = ctx.currentTime + start;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.03);
      g.gain.linearRampToValueAtTime(vol * 0.7, t + dur * 0.5);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc1.start(t); osc2.start(t);
      osc1.stop(t + dur); osc2.stop(t + dur);
    }
    function bell(freq, start, dur, vol = 0.18) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.connect(g); g.connect(master);
      const t = ctx.currentTime + start;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t);
      osc.stop(t + dur);
    }
    function kick(start, vol = 0.32) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.connect(g); g.connect(master);
      const t = ctx.currentTime + start;
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.start(t); osc.stop(t + 0.25);
    }
    function crash(start, vol = 0.22) {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 1.0, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.5));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass'; filter.frequency.value = 4000;
      const g = ctx.createGain();
      const t = ctx.currentTime + start;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
      noise.connect(filter); filter.connect(g); g.connect(master);
      noise.start(t);
    }

    const C5=523.25, D5=587.33, E5=659.25, F5=698.46, G5=783.99;
    const A5=880, B5=987.77, C6=1046.5, D6=1174.66, E6=1318.51;
    const F6=1396.91, G6=1567.98, C7=2093;

    crash(0, 0.3);
    trumpet(C5, 0.0, 0.3, 0.24); trumpet(E5, 0.3, 0.3, 0.26); trumpet(G5, 0.6, 0.3, 0.28);
    trumpet(C6, 0.9, 1.0, 0.32); bell(C6, 0.9, 1.5, 0.15);
    kick(0); kick(0.5); kick(1.0); kick(1.5);
    trumpet(G5, 2.0, 0.3, 0.26); trumpet(G5, 2.3, 0.3, 0.26);
    trumpet(E5, 2.6, 0.3, 0.26); trumpet(C5, 2.9, 0.3, 0.26);
    trumpet(G5, 3.2, 0.4, 0.28); trumpet(C6, 3.6, 0.4, 0.30);
    kick(2.0); kick(2.6); kick(3.2); kick(3.8);
    trumpet(B5, 4.0, 0.3, 0.28); trumpet(A5, 4.3, 0.3, 0.28);
    trumpet(G5, 4.6, 0.3, 0.28); trumpet(F5, 4.9, 0.3, 0.28);
    trumpet(E5, 5.2, 0.4, 0.30); trumpet(D5, 5.6, 0.2, 0.26); trumpet(C5, 5.8, 0.2, 0.26);
    kick(4.0); kick(4.6); kick(5.2); kick(5.8);
    [C5, D5, E5, F5, G5, A5, B5, C6].forEach((n, i) => {
      trumpet(n, 6.0 + i * 0.25, 0.22, 0.26 + i * 0.01);
      bell(n * 2, 6.0 + i * 0.25, 0.4, 0.10);
    });
    for (let i = 0; i < 6; i++) kick(6.0 + i * 0.5);
    crash(8.0, 0.25);
    trumpet(C6, 8.5, 0.4, 0.32); trumpet(E5, 8.5, 0.4, 0.18);
    trumpet(D6, 8.9, 0.4, 0.32); trumpet(F5, 8.9, 0.4, 0.18);
    trumpet(E6, 9.3, 0.4, 0.34); trumpet(G5, 9.3, 0.4, 0.18);
    trumpet(D6, 9.7, 0.4, 0.32); trumpet(F5, 9.7, 0.4, 0.18);
    trumpet(C6, 10.1, 0.4, 0.32); trumpet(E5, 10.1, 0.4, 0.18);
    trumpet(G5, 10.5, 0.6, 0.30); trumpet(C5, 10.5, 0.6, 0.18);
    trumpet(C6, 11.1, 0.6, 0.32); trumpet(E5, 11.1, 0.6, 0.20);
    for (let i = 0; i < 5; i++) kick(8.5 + i * 0.5);
    crash(11.5, 0.32);
    trumpet(G5, 11.7, 0.25, 0.30); trumpet(A5, 11.95, 0.25, 0.30);
    trumpet(B5, 12.2, 0.25, 0.30); trumpet(C6, 12.45, 0.6, 0.34);
    bell(C6, 12.45, 1.5, 0.15); bell(E6, 12.45, 1.5, 0.13); bell(G6, 12.45, 1.5, 0.11);
    [C6, E6, G6, C7].forEach((n, i) => {
      trumpet(n, 13.05 + i * 0.15, 0.5, 0.30);
    });
    for (let i = 0; i < 4; i++) kick(11.5 + i * 0.5);
    crash(13.8, 0.4);
    trumpet(C6, 14.0, 0.5, 0.34); trumpet(G5, 14.0, 0.5, 0.22);
    trumpet(E5, 14.0, 0.5, 0.18); trumpet(C5, 14.0, 0.5, 0.16);
    trumpet(C6, 14.6, 0.4, 0.34); bell(C7, 14.6, 1.0, 0.18);
    trumpet(C6, 15.2, 2.0, 0.36); trumpet(G5, 15.2, 2.0, 0.22);
    trumpet(E5, 15.2, 2.0, 0.18); bell(C6, 15.2, 2.5, 0.16); bell(G6, 15.2, 2.5, 0.14);
    crash(15.2, 0.3); crash(16.5, 0.25);
    kick(15.2); kick(15.7); kick(16.2); kick(16.7); kick(17.2);
  },

  // Pack 2: Himno glorioso — acordes potentes ascendentes
  _victory_anthem() {
    if (!this.enabled) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const master = this.master;

    function chord(freqs, start, dur, vol = 0.18) {
      freqs.forEach(freq => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        osc.connect(g); g.connect(master);
        const t = ctx.currentTime + start;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.1);
        g.gain.linearRampToValueAtTime(vol * 0.8, t + dur * 0.7);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.start(t); osc.stop(t + dur);
      });
    }
    function kick(start, vol = 0.32) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.connect(g); g.connect(master);
      const t = ctx.currentTime + start;
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.start(t); osc.stop(t + 0.25);
    }

    // C, G, Am, F progresión clásica
    const C  = [261.63, 329.63, 392.00];        // C E G
    const G  = [196.00, 293.66, 392.00, 493.88];// G D G B
    const Am = [220.00, 329.63, 440.00];        // A E A
    const F  = [174.61, 261.63, 349.23, 440.00];// F C F A
    const Cmaj = [261.63, 329.63, 392.00, 523.25, 659.25]; // C major full

    chord(C,  0.0, 1.5, 0.20);  kick(0.0); kick(0.7);
    chord(G,  1.5, 1.5, 0.22);  kick(1.5); kick(2.2);
    chord(Am, 3.0, 1.5, 0.24);  kick(3.0); kick(3.7);
    chord(F,  4.5, 1.5, 0.26);  kick(4.5); kick(5.2);

    chord(C,  6.0, 1.0, 0.26);  kick(6.0);
    chord(G,  7.0, 1.0, 0.28);  kick(7.0);
    chord(Am, 8.0, 1.0, 0.30);  kick(8.0);
    chord(F,  9.0, 1.0, 0.32);  kick(9.0);

    chord(C,  10.0, 0.7, 0.30); kick(10.0);
    chord(G,  10.7, 0.7, 0.32); kick(10.7);
    chord(F,  11.4, 0.7, 0.34); kick(11.4);
    chord(G,  12.1, 0.7, 0.36); kick(12.1);

    // Climax sostenido
    chord(Cmaj, 12.8, 5.0, 0.40);
    kick(12.8, 0.4); kick(13.3, 0.36); kick(13.8, 0.32);
    kick(14.3, 0.32); kick(14.8, 0.32); kick(15.3, 0.32);
    kick(15.8, 0.32); kick(16.3, 0.32); kick(16.8, 0.32);
    kick(17.3, 0.36);
  },

  // Pack 3: Celebración — alegre, ritmo de fiesta con brass animado
  _victory_celebration() {
    if (!this.enabled) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const master = this.master;

    function bell(freq, start, dur, vol = 0.18) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.connect(g); g.connect(master);
      const t = ctx.currentTime + start;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t); osc.stop(t + dur);
    }
    function pluck(freq, start, dur = 0.2, vol = 0.18) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      osc.connect(g); g.connect(master);
      const t = ctx.currentTime + start;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t); osc.stop(t + dur);
    }
    function kick(start, vol = 0.32) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.connect(g); g.connect(master);
      const t = ctx.currentTime + start;
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.start(t); osc.stop(t + 0.25);
    }
    function hh(start, vol = 0.10) {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass'; filter.frequency.value = 6000;
      const g = ctx.createGain();
      const t = ctx.currentTime + start;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      noise.connect(filter); filter.connect(g); g.connect(master);
      noise.start(t);
    }

    // Melodía festiva en C mayor con ritmo bailable
    const melody = [
      // tiempo, freq, duración
      [0.0, 523, 0.25], [0.25, 659, 0.25], [0.5, 783, 0.25], [0.75, 1046, 0.5],
      [1.5, 783, 0.25], [1.75, 659, 0.25], [2.0, 783, 0.5],
      [2.5, 880, 0.25], [2.75, 1046, 0.25], [3.0, 1318, 0.5],
      [3.5, 1046, 0.25], [3.75, 880, 0.25], [4.0, 783, 0.5],

      [4.5, 523, 0.25], [4.75, 659, 0.25], [5.0, 783, 0.25], [5.25, 1046, 0.5],
      [6.0, 1318, 0.25], [6.25, 1567, 0.25], [6.5, 1318, 0.5],
      [7.0, 1046, 0.25], [7.25, 880, 0.25], [7.5, 1046, 0.5],
      [8.0, 783, 0.25], [8.25, 1046, 0.25], [8.5, 1318, 0.5],

      [9.0, 1567, 0.5], [9.5, 1318, 0.5], [10.0, 1567, 0.5],
      [10.5, 1318, 0.25], [10.75, 1046, 0.25], [11.0, 783, 0.5],

      // Final climático
      [11.5, 1046, 0.4], [11.9, 1318, 0.4], [12.3, 1567, 0.6],
      [12.9, 1046, 0.3], [13.2, 1318, 0.3], [13.5, 2093, 1.5]
    ];
    melody.forEach(([t, f, d]) => {
      pluck(f, t, d, 0.20);
      bell(f, t, d * 1.5, 0.10);
    });

    // Ritmo de batería bailable (4/4 con kicks fuertes)
    for (let beat = 0; beat < 36; beat++) {
      const t = beat * 0.4;
      kick(t, 0.32);
      hh(t + 0.2, 0.10);
      hh(t + 0.4, 0.08);
    }

    // Acorde final masivo
    [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5].forEach(f => {
      pluck(f, 13.5, 2.5, 0.18);
      bell(f, 13.5, 3.0, 0.12);
    });
  },

  // Dispatcher para victoria
  victoryFanfare() {
    const fn = '_victory_' + this.active.victory;
    if (typeof this[fn] === 'function') this[fn]();
    else this._victory_classical();
  },

  // Swoosh — avatar volando
  swoosh() {
    if (!this.enabled) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.connect(g); g.connect(this.master);
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.3);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.6);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.2, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.start(t); osc.stop(t + 0.6);
  },

  // Aterrizaje — thud + bounce
  land() {
    if (!this.enabled) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.connect(g); g.connect(this.master);
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.start(t); osc.stop(t + 0.3);
    setTimeout(() => this.beep(660, 0.08, 'sine', 0.15), 100);
    setTimeout(() => this.beep(880, 0.12, 'sine', 0.18), 180);
  },

  // Corona descendiendo — glissando con campanas
  crownDescend() {
    if (!this.enabled) return;
    this.init(); this.resume();
    if (!this.ctx) return;
    const ctx = this.ctx;
    // Glissando ascendente
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.connect(g); g.connect(this.master);
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(1760, t + 1.0);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.18, t + 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
    osc.start(t); osc.stop(t + 1.0);

    // Campanas en cascada
    [523, 659, 783, 1046, 1318].forEach((freq, i) => {
      setTimeout(() => {
        const o = ctx.createOscillator();
        const og = ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = freq;
        o.connect(og); og.connect(this.master);
        og.gain.setValueAtTime(0.2, ctx.currentTime);
        og.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        o.start(); o.stop(ctx.currentTime + 0.5);
      }, 100 * i + 200);
    });
  }
};

// Hook el sonido a las ventas
const _addSale_orig = addSale;
addSale = function(page) {
  const sellerId = SELLER_BY_PAGE[page];
  // Aplicar comisión si hay una activa (el último día revelado)
  _addSale_orig(page);
  if (sellerId && getActiveCommission()) {
    applyCommissionToSale(sellerId);
  }
  Sounds.play && Sounds.sale();
};

// Hook a fireEvent para sonidos
const _fireEvent_orig = fireEvent;
fireEvent = function(ev) {
  _fireEvent_orig(ev);
  if (ev.type === 'CLIMB') Sounds.climb();
  if (ev.type === 'NEW_LEADER') Sounds.newLeader();
  if (ev.type === 'SALE_OUTSIDER') Sounds.saleOut();
};

// ============================================================
// MODAL DE REVELACIÓN — Tipo Squid Game / Slot Machine
// ============================================================
function showCommissionReveal(data) {
  // Limpiar revelaciones anteriores
  document.querySelectorAll('.commission-reveal-overlay').forEach(el => el.remove());

  const overlay = document.createElement('div');
  overlay.className = 'commission-reveal-overlay';
  if (data.premium) overlay.classList.add('premium');

  overlay.innerHTML = `
    <div class="reveal-rays"></div>
    <div class="reveal-shapes">
      <div class="shape circle"></div>
      <div class="shape triangle"></div>
      <div class="shape square"></div>
    </div>
    <div class="reveal-content">
      <div class="reveal-tag">▸ COMISIÓN DEL ${data.dayLabel || 'DÍA'} ◂</div>
      <div class="reveal-amount" id="revealAmount">$??</div>
      <div class="reveal-status" id="revealStatus">EL JEFE LO ESTÁ DECIDIENDO...</div>
      <div class="reveal-message" id="revealMessage">PREPÁRATE · ESTO VIENE FUERTE</div>
      ${data.premium ? '<div class="reveal-premium-badge">★ DÍA PREMIUM ★</div>' : ''}
    </div>
  `;
  document.body.appendChild(overlay);
  void overlay.offsetWidth;
  overlay.classList.add('visible');

  // ===== FASE 1: Música épica de Squid Game (~13.5 seg) =====
  Sounds.squidMelody();

  const amountEl  = overlay.querySelector('#revealAmount');
  const statusEl  = overlay.querySelector('#revealStatus');
  const messageEl = overlay.querySelector('#revealMessage');
  const target = data.amount;
  const range  = data.premium ? [25, 30] : [12, 24];

  // Animación sutil del número durante la música (cambios lentos)
  let teaserChange = 0;
  let teaserActive = true;
  function teaserFrame() {
    if (!teaserActive) return;
    if (Date.now() - teaserChange >= 700) {
      const fake = range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1));
      amountEl.textContent = `$${fake}`;
      teaserChange = Date.now();
    }
    requestAnimationFrame(teaserFrame);
  }
  requestAnimationFrame(teaserFrame);

  // Cambiar mensajes durante la música para crear tensión
  setTimeout(() => { statusEl.textContent = 'CALCULANDO LA SUERTE...'; }, 4000);
  setTimeout(() => { statusEl.textContent = 'YA CASI LO TENEMOS...'; }, 8000);
  setTimeout(() => {
    statusEl.textContent = 'RESULTADO INMINENTE...';
    messageEl.textContent = '¡PREPÁRATE!';
  }, 11500);

  // ===== FASE 2: Slot machine final (13.5s — 16.5s) =====
  setTimeout(() => {
    teaserActive = false;
    const start = Date.now();
    const duration = 3000;
    let lastChange = 0, lastTickTime = 0;

    function frame() {
      const t = (Date.now() - start) / duration;
      if (t >= 1) {
        amountEl.textContent = `$${target}`;
        amountEl.classList.add('final');
        statusEl.textContent = '¡COMISIÓN DEL DÍA!';
        messageEl.textContent = data.premium ? '¡DÍA ESPECIAL · A DARLE CON TODO! 🔥' : '¡SUERTE · A VENDER!';

        if (data.premium) {
          Sounds.bigReveal();
          setTimeout(() => massiveConfetti('#FFD93D', '#FF8C42'), 100);
          setTimeout(() => massiveConfetti('#FF4FB6', '#FFD93D'), 700);
          setTimeout(() => massiveConfetti('#FFD93D', '#5EEAD4'), 1400);
        } else {
          Sounds.smallReveal();
          setTimeout(() => smallConfetti('#5EEAD4'), 100);
        }
        return;
      }

      const easeT = t * t;
      const interval = 50 + 350 * easeT;
      if (Date.now() - lastChange >= interval) {
        const fake = range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1));
        amountEl.textContent = `$${fake}`;
        lastChange = Date.now();
      }

      if (Date.now() - lastTickTime >= Math.max(80, interval * 0.7)) {
        Sounds.tick();
        lastTickTime = Date.now();
      }

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }, 13500);

  // Auto-cerrar después de 22 segundos
  setTimeout(() => {
    overlay.classList.add('leaving');
    setTimeout(() => overlay.remove(), 800);
  }, 22000);

  // Click anywhere to dismiss
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.add('leaving');
      setTimeout(() => overlay.remove(), 800);
    }
  });
}

// Listener cross-tab para recibir la revelación en el sales arena
window.addEventListener('storage', (e) => {
  if (e.key === COMMISSION_REVEAL_KEY && e.newValue) {
    try {
      const data = JSON.parse(e.newValue);
      // Refrescar state local
      state = loadState();
      showCommissionReveal(data);
      if (typeof renderAll === 'function') renderAll();
    } catch (err) {}
  }
});
