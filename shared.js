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
  return { sellers, pages, history: [], weekStarted: Date.now() };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildInitialState();
    const p = JSON.parse(raw);
    if (!p.sellers || !p.pages) return buildInitialState();
    if (!p.weekStarted) p.weekStarted = Date.now();
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
  state = buildInitialState();
  prevTopIds = [];
  prevLeader = null;
  saveState();
  if (typeof renderAll === 'function') renderAll();
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
  }
  if (ev.type === 'SALE_OUTSIDER') {
    outsiderPop(seller);
    smallConfetti(seller.color);
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

  let bestPage = null, bestPageCount = 0;
  winner.pages.forEach(p => {
    const c = state.pages[p] || 0;
    if (c > bestPageCount) { bestPageCount = c; bestPage = p; }
  });
  if (!bestPage) bestPage = winner.pages[0];

  const data = {
    sellerId: winner.id,
    name: winner.name,
    avatar: winner.avatar,
    color: winner.color,
    colorAlt: winner.colorAlt,
    total: winner.total,
    bestPage,
    bestPageCount,
    ts: Date.now()
  };

  if (triggeredLocally) {
    try { localStorage.setItem(CEREMONY_KEY, JSON.stringify(data)); } catch (e) {}
  }
  showCeremony(data);
}

function showCeremony(data) {
  const overlay = document.createElement('div');
  overlay.className = 'ceremony-overlay';
  overlay.style.cssText = `--accent: ${data.color}; --accent-alt: ${data.colorAlt};`;

  overlay.innerHTML = `
    <div class="ceremony-stage">
      <div class="ceremony-rings"></div>
      <div class="ceremony-avatar">
        ${avatarSVG(data.avatar, data.color, data.colorAlt, 280)}
      </div>
    </div>
    <div class="ceremony-tag">◆ ◆ ◆  GANADOR DE LA SEMANA  ◆ ◆ ◆</div>
    <div class="ceremony-name">${data.name.toUpperCase()}</div>
    <div class="ceremony-stats">
      <div class="ceremony-stat">
        <div class="ceremony-stat-label">TOTAL DE VENTAS</div>
        <div class="ceremony-stat-value">${data.total}</div>
      </div>
      <div class="ceremony-stat">
        <div class="ceremony-stat-label">CONSULTORA GANADORA</div>
        <div class="ceremony-stat-value small">${data.bestPage}</div>
        <div class="ceremony-stat-label" style="margin-top: 6px;">${data.bestPageCount} ventas</div>
      </div>
    </div>
    <div class="ceremony-actions">
      <button class="btn-primary" data-action="new-week">🎯 INICIAR NUEVA SEMANA</button>
      <button class="btn-secondary" data-action="close">Cerrar</button>
    </div>
  `;

  document.body.appendChild(overlay);
  void overlay.offsetWidth;
  overlay.classList.add('visible');

  setTimeout(() => massiveConfetti(data.color, data.colorAlt), 3000);
  setTimeout(() => massiveConfetti(data.color, data.colorAlt), 4200);
  setTimeout(() => massiveConfetti(data.color, data.colorAlt), 5200);

  overlay.querySelector('[data-action="close"]').addEventListener('click', () => {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 600);
  });

  overlay.querySelector('[data-action="new-week"]').addEventListener('click', () => {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      resetAll();
    }, 600);
  });
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
        const beforeTop4 = getRanked().slice(0, 4).map(r => r.id);
        const oldTotal = Object.values(state.sellers).reduce((a, b) => a + b, 0);
        const newTotal = Object.values(incoming.sellers).reduce((a, b) => a + b, 0);
        const oldHistLen = state.history.length;
        const oldSellerTotals = { ...state.sellers };
        state = incoming;
        if (typeof renderAll === 'function') renderAll();

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
