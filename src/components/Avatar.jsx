import { motion } from 'framer-motion';

// =====================================================================
// Avatares "animal cyberpunk" en SVG.
// Cada uno tiene un look geométrico/futurista, con glow del color del
// vendedor. La animación idle se aplica desde el contenedor.
// =====================================================================

const avatarMap = {
  wolf:    WolfAvatar,
  eagle:   EagleAvatar,
  tiger:   TigerAvatar,
  fox:     FoxAvatar,
  panther: PantherAvatar,
  falcon:  FalconAvatar,
  lion:    LionAvatar,
  owl:     OwlAvatar,
  dragon:  DragonAvatar
};

export default function Avatar({ kind, color = '#B47CFF', colorAlt = '#FF4FB6', size = 110, animated = true, glow = true }) {
  const Component = avatarMap[kind] || WolfAvatar;

  return (
    <motion.div
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: glow ? `drop-shadow(0 0 12px ${color}) drop-shadow(0 0 24px ${color}55)` : 'none'
      }}
      animate={animated ? { y: [0, -4, 0], scale: [1, 1.02, 1] } : false}
      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Component color={color} colorAlt={colorAlt} size={size} />
    </motion.div>
  );
}

// ========== Helpers ==========
function defs(idBase, color, colorAlt) {
  return (
    <defs>
      <linearGradient id={`${idBase}-grad`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={color} />
        <stop offset="100%" stopColor={colorAlt} />
      </linearGradient>
      <linearGradient id={`${idBase}-grad-soft`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.9" />
        <stop offset="100%" stopColor={colorAlt} stopOpacity="0.5" />
      </linearGradient>
      <radialGradient id={`${idBase}-eye`}>
        <stop offset="0%" stopColor="#fff" />
        <stop offset="50%" stopColor={color} />
        <stop offset="100%" stopColor={colorAlt} />
      </radialGradient>
    </defs>
  );
}

// =====================================================================
// LOBO — Josué
// =====================================================================
function WolfAvatar({ color, colorAlt, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      {defs('wolf', color, colorAlt)}
      {/* Orejas */}
      <polygon points="25,40 35,15 50,38" fill={`url(#wolf-grad)`} />
      <polygon points="95,40 85,15 70,38" fill={`url(#wolf-grad)`} />
      {/* Cabeza */}
      <path d="M30 45 Q60 25 90 45 Q95 75 80 95 Q60 110 40 95 Q25 75 30 45 Z"
            fill={`url(#wolf-grad-soft)`} stroke={color} strokeWidth="2"/>
      {/* Hocico */}
      <path d="M48 75 Q60 90 72 75 L70 95 Q60 105 50 95 Z"
            fill="#0a0118" stroke={color} strokeWidth="1.5"/>
      {/* Nariz */}
      <ellipse cx="60" cy="80" rx="5" ry="3" fill={color}/>
      {/* Ojos */}
      <ellipse cx="45" cy="62" rx="6" ry="8" fill="#0a0118"/>
      <ellipse cx="75" cy="62" rx="6" ry="8" fill="#0a0118"/>
      <ellipse cx="45" cy="62" rx="3" ry="5" fill={`url(#wolf-eye)`}/>
      <ellipse cx="75" cy="62" rx="3" ry="5" fill={`url(#wolf-eye)`}/>
      {/* Marcas tribales */}
      <path d="M40 50 L48 55 L40 58" stroke={color} strokeWidth="1.5" fill="none"/>
      <path d="M80 50 L72 55 L80 58" stroke={color} strokeWidth="1.5" fill="none"/>
    </svg>
  );
}

// =====================================================================
// ÁGUILA — Ana
// =====================================================================
function EagleAvatar({ color, colorAlt, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      {defs('eagle', color, colorAlt)}
      {/* Cabeza */}
      <path d="M30 60 Q60 20 90 60 Q90 90 60 100 Q30 90 30 60 Z"
            fill={`url(#eagle-grad-soft)`} stroke={color} strokeWidth="2"/>
      {/* Cresta superior */}
      <path d="M50 40 L60 22 L70 40 Z" fill={`url(#eagle-grad)`}/>
      {/* Pico */}
      <path d="M55 75 L60 95 L65 75 Z" fill={colorAlt} stroke="#0a0118" strokeWidth="1"/>
      <line x1="60" y1="75" x2="60" y2="95" stroke="#0a0118" strokeWidth="1.5"/>
      {/* Ojos feroces */}
      <path d="M38 58 L52 64 L40 70 Z" fill="#0a0118"/>
      <path d="M82 58 L68 64 L80 70 Z" fill="#0a0118"/>
      <circle cx="44" cy="64" r="2.5" fill={color}/>
      <circle cx="76" cy="64" r="2.5" fill={color}/>
      {/* Plumas laterales */}
      <path d="M28 55 L18 50 L28 60" fill="none" stroke={color} strokeWidth="2"/>
      <path d="M28 65 L15 65 L28 70" fill="none" stroke={color} strokeWidth="2"/>
      <path d="M92 55 L102 50 L92 60" fill="none" stroke={color} strokeWidth="2"/>
      <path d="M92 65 L105 65 L92 70" fill="none" stroke={color} strokeWidth="2"/>
    </svg>
  );
}

// =====================================================================
// TIGRE — José
// =====================================================================
function TigerAvatar({ color, colorAlt, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      {defs('tiger', color, colorAlt)}
      {/* Orejas */}
      <path d="M28 38 Q22 22 38 28 Z" fill={color}/>
      <path d="M92 38 Q98 22 82 28 Z" fill={color}/>
      <circle cx="32" cy="32" r="3" fill="#0a0118"/>
      <circle cx="88" cy="32" r="3" fill="#0a0118"/>
      {/* Cabeza */}
      <ellipse cx="60" cy="65" rx="35" ry="35" fill={`url(#tiger-grad-soft)`} stroke={color} strokeWidth="2"/>
      {/* Rayas */}
      <path d="M40 40 Q42 50 38 55" stroke="#0a0118" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M50 35 Q52 45 48 50" stroke="#0a0118" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M70 35 Q68 45 72 50" stroke="#0a0118" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M80 40 Q78 50 82 55" stroke="#0a0118" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M30 70 Q35 75 32 80" stroke="#0a0118" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M88 70 Q83 75 86 80" stroke="#0a0118" strokeWidth="3" fill="none" strokeLinecap="round"/>
      {/* Hocico claro */}
      <ellipse cx="60" cy="80" rx="20" ry="14" fill="#fff8e1" opacity="0.9"/>
      {/* Nariz */}
      <path d="M55 73 Q60 70 65 73 L62 78 L58 78 Z" fill="#0a0118"/>
      {/* Boca */}
      <path d="M60 78 L60 86 M55 86 Q60 92 65 86" stroke="#0a0118" strokeWidth="1.5" fill="none"/>
      {/* Colmillos */}
      <path d="M56 86 L55 92 L58 89 Z" fill="#fff"/>
      <path d="M64 86 L65 92 L62 89 Z" fill="#fff"/>
      {/* Ojos */}
      <ellipse cx="45" cy="60" rx="7" ry="6" fill="#0a0118"/>
      <ellipse cx="75" cy="60" rx="7" ry="6" fill="#0a0118"/>
      <ellipse cx="45" cy="60" rx="3" ry="4" fill={`url(#tiger-eye)`}/>
      <ellipse cx="75" cy="60" rx="3" ry="4" fill={`url(#tiger-eye)`}/>
    </svg>
  );
}

// =====================================================================
// ZORRO — Daisy
// =====================================================================
function FoxAvatar({ color, colorAlt, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      {defs('fox', color, colorAlt)}
      {/* Orejas grandes */}
      <polygon points="22,50 28,15 48,42" fill={`url(#fox-grad)`}/>
      <polygon points="98,50 92,15 72,42" fill={`url(#fox-grad)`}/>
      <polygon points="28,42 32,22 42,40" fill="#0a0118"/>
      <polygon points="92,42 88,22 78,40" fill="#0a0118"/>
      {/* Cara */}
      <path d="M30 50 Q60 35 90 50 Q90 80 60 100 Q30 80 30 50 Z"
            fill={`url(#fox-grad-soft)`} stroke={color} strokeWidth="2"/>
      {/* Mejillas blancas */}
      <ellipse cx="35" cy="78" rx="14" ry="12" fill="#fff" opacity="0.95"/>
      <ellipse cx="85" cy="78" rx="14" ry="12" fill="#fff" opacity="0.95"/>
      {/* Hocico */}
      <path d="M50 75 Q60 90 70 75 L62 95 L58 95 Z" fill="#fff"/>
      {/* Nariz */}
      <ellipse cx="60" cy="78" rx="4" ry="3" fill="#0a0118"/>
      {/* Ojos picaros */}
      <path d="M40 60 Q48 56 52 64 Q48 68 40 60" fill="#0a0118"/>
      <path d="M80 60 Q72 56 68 64 Q72 68 80 60" fill="#0a0118"/>
      <circle cx="46" cy="62" r="2" fill={color}/>
      <circle cx="74" cy="62" r="2" fill={color}/>
    </svg>
  );
}

// =====================================================================
// PANTERA — Daniela
// =====================================================================
function PantherAvatar({ color, colorAlt, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      {defs('panther', color, colorAlt)}
      {/* Orejas redondas */}
      <circle cx="32" cy="35" r="10" fill="#1a0a2e" stroke={color} strokeWidth="2"/>
      <circle cx="88" cy="35" r="10" fill="#1a0a2e" stroke={color} strokeWidth="2"/>
      <circle cx="32" cy="35" r="5" fill={color}/>
      <circle cx="88" cy="35" r="5" fill={color}/>
      {/* Cabeza negra */}
      <ellipse cx="60" cy="65" rx="34" ry="34" fill="#0f0420" stroke={color} strokeWidth="2.5"/>
      {/* Brillos sutiles morados */}
      <path d="M30 50 Q40 45 45 55" stroke={color} strokeWidth="1.5" fill="none" opacity="0.6"/>
      <path d="M90 50 Q80 45 75 55" stroke={color} strokeWidth="1.5" fill="none" opacity="0.6"/>
      {/* Ojos felinos brillantes */}
      <ellipse cx="45" cy="60" rx="9" ry="6" fill={color}/>
      <ellipse cx="75" cy="60" rx="9" ry="6" fill={color}/>
      <ellipse cx="45" cy="60" rx="2" ry="6" fill="#0a0118"/>
      <ellipse cx="75" cy="60" rx="2" ry="6" fill="#0a0118"/>
      {/* Hocico */}
      <path d="M50 78 Q60 88 70 78 L65 90 L55 90 Z" fill="#1a0a2e"/>
      <path d="M55 80 Q60 76 65 80 L62 84 L58 84 Z" fill={color}/>
      {/* Bigotes */}
      <line x1="42" y1="82" x2="22" y2="80" stroke={color} strokeWidth="1" opacity="0.6"/>
      <line x1="42" y1="86" x2="22" y2="88" stroke={color} strokeWidth="1" opacity="0.6"/>
      <line x1="78" y1="82" x2="98" y2="80" stroke={color} strokeWidth="1" opacity="0.6"/>
      <line x1="78" y1="86" x2="98" y2="88" stroke={color} strokeWidth="1" opacity="0.6"/>
    </svg>
  );
}

// =====================================================================
// HALCÓN — Ani Reyes
// =====================================================================
function FalconAvatar({ color, colorAlt, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      {defs('falcon', color, colorAlt)}
      {/* Cresta */}
      <path d="M40 35 Q60 15 80 35 L75 45 Q60 30 45 45 Z" fill={`url(#falcon-grad)`}/>
      {/* Cabeza */}
      <path d="M28 55 Q60 35 92 55 Q92 88 60 100 Q28 88 28 55 Z"
            fill={`url(#falcon-grad-soft)`} stroke={color} strokeWidth="2"/>
      {/* Banda visor */}
      <path d="M28 60 Q60 55 92 60 L92 70 Q60 65 28 70 Z" fill="#0a0118" opacity="0.8"/>
      {/* Ojos brillantes */}
      <circle cx="42" cy="65" r="4" fill={color}/>
      <circle cx="78" cy="65" r="4" fill={color}/>
      <circle cx="42" cy="65" r="1.5" fill="#fff"/>
      <circle cx="78" cy="65" r="1.5" fill="#fff"/>
      {/* Pico curvo */}
      <path d="M52 78 Q60 95 68 78 L64 92 L60 96 L56 92 Z" fill={colorAlt} stroke="#0a0118" strokeWidth="1"/>
      <path d="M55 82 Q60 87 65 82" stroke="#0a0118" strokeWidth="1" fill="none"/>
      {/* Detalles tech */}
      <line x1="20" y1="60" x2="28" y2="60" stroke={color} strokeWidth="2"/>
      <line x1="100" y1="60" x2="92" y2="60" stroke={color} strokeWidth="2"/>
      <circle cx="18" cy="60" r="2" fill={color}/>
      <circle cx="102" cy="60" r="2" fill={color}/>
    </svg>
  );
}

// =====================================================================
// LEÓN — Eli
// =====================================================================
function LionAvatar({ color, colorAlt, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      {defs('lion', color, colorAlt)}
      {/* Melena (capas) */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const cx = 60 + Math.cos(angle) * 38;
        const cy = 62 + Math.sin(angle) * 38;
        return <circle key={i} cx={cx} cy={cy} r="14" fill={`url(#lion-grad)`} opacity="0.85"/>;
      })}
      {/* Melena interior */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2 + 0.2;
        const cx = 60 + Math.cos(angle) * 28;
        const cy = 62 + Math.sin(angle) * 28;
        return <circle key={i} cx={cx} cy={cy} r="11" fill={colorAlt}/>;
      })}
      {/* Cara */}
      <ellipse cx="60" cy="65" rx="26" ry="26" fill="#fff8e1"/>
      {/* Orejas */}
      <circle cx="40" cy="48" r="6" fill={color}/>
      <circle cx="80" cy="48" r="6" fill={color}/>
      <circle cx="40" cy="48" r="3" fill={colorAlt}/>
      <circle cx="80" cy="48" r="3" fill={colorAlt}/>
      {/* Ojos */}
      <ellipse cx="50" cy="62" rx="4" ry="5" fill="#0a0118"/>
      <ellipse cx="70" cy="62" rx="4" ry="5" fill="#0a0118"/>
      <circle cx="50" cy="61" r="1.5" fill={color}/>
      <circle cx="70" cy="61" r="1.5" fill={color}/>
      {/* Nariz */}
      <path d="M55 72 Q60 68 65 72 L62 78 L58 78 Z" fill="#0a0118"/>
      {/* Boca y bigotes */}
      <path d="M60 78 L60 84 M55 84 Q60 90 65 84" stroke="#0a0118" strokeWidth="1.5" fill="none"/>
      <line x1="38" y1="72" x2="48" y2="74" stroke="#0a0118" strokeWidth="1"/>
      <line x1="38" y1="78" x2="48" y2="78" stroke="#0a0118" strokeWidth="1"/>
      <line x1="82" y1="72" x2="72" y2="74" stroke="#0a0118" strokeWidth="1"/>
      <line x1="82" y1="78" x2="72" y2="78" stroke="#0a0118" strokeWidth="1"/>
    </svg>
  );
}

// =====================================================================
// BÚHO — Anni
// =====================================================================
function OwlAvatar({ color, colorAlt, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      {defs('owl', color, colorAlt)}
      {/* Cabeza con plumas puntiagudas */}
      <path d="M60 18 L70 35 L85 25 L82 42 L98 45 L88 58 L98 68 L85 75 L82 90 L70 80 L60 95 L50 80 L38 90 L35 75 L22 68 L32 58 L22 45 L38 42 L35 25 L50 35 Z"
            fill={`url(#owl-grad-soft)`} stroke={color} strokeWidth="2"/>
      {/* Cara redonda */}
      <ellipse cx="60" cy="62" rx="32" ry="30" fill={`url(#owl-grad-soft)`}/>
      {/* Discos faciales */}
      <circle cx="45" cy="60" r="14" fill="#fff8e1" opacity="0.95"/>
      <circle cx="75" cy="60" r="14" fill="#fff8e1" opacity="0.95"/>
      {/* Ojos enormes */}
      <circle cx="45" cy="60" r="9" fill="#0a0118"/>
      <circle cx="75" cy="60" r="9" fill="#0a0118"/>
      <circle cx="45" cy="60" r="6" fill={color}/>
      <circle cx="75" cy="60" r="6" fill={color}/>
      <circle cx="46" cy="58" r="2" fill="#fff"/>
      <circle cx="76" cy="58" r="2" fill="#fff"/>
      {/* Pico triangular */}
      <path d="M55 72 L60 82 L65 72 Z" fill={colorAlt} stroke="#0a0118" strokeWidth="1"/>
      {/* Cejas */}
      <path d="M35 50 Q45 45 55 50" stroke={color} strokeWidth="2" fill="none"/>
      <path d="M65 50 Q75 45 85 50" stroke={color} strokeWidth="2" fill="none"/>
    </svg>
  );
}

// =====================================================================
// DRAGÓN — Carla
// =====================================================================
function DragonAvatar({ color, colorAlt, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      {defs('dragon', color, colorAlt)}
      {/* Cuernos */}
      <path d="M30 40 L20 15 L38 32 Z" fill={`url(#dragon-grad)`}/>
      <path d="M90 40 L100 15 L82 32 Z" fill={`url(#dragon-grad)`}/>
      {/* Espinas dorsales */}
      <path d="M50 22 L55 12 L60 22" fill={colorAlt}/>
      <path d="M60 22 L65 12 L70 22" fill={colorAlt}/>
      {/* Cabeza alargada */}
      <path d="M28 55 Q60 30 92 55 L88 80 Q60 105 32 80 Z"
            fill={`url(#dragon-grad-soft)`} stroke={color} strokeWidth="2"/>
      {/* Escamas */}
      <path d="M40 50 Q45 45 50 50" fill="none" stroke={color} strokeWidth="1" opacity="0.7"/>
      <path d="M55 48 Q60 43 65 48" fill="none" stroke={color} strokeWidth="1" opacity="0.7"/>
      <path d="M70 50 Q75 45 80 50" fill="none" stroke={color} strokeWidth="1" opacity="0.7"/>
      <path d="M45 60 Q50 55 55 60" fill="none" stroke={color} strokeWidth="1" opacity="0.7"/>
      <path d="M65 60 Q70 55 75 60" fill="none" stroke={color} strokeWidth="1" opacity="0.7"/>
      {/* Ojos reptilianos */}
      <ellipse cx="44" cy="62" rx="7" ry="9" fill="#0a0118"/>
      <ellipse cx="76" cy="62" rx="7" ry="9" fill="#0a0118"/>
      <ellipse cx="44" cy="62" rx="2.5" ry="7" fill={color}/>
      <ellipse cx="76" cy="62" rx="2.5" ry="7" fill={color}/>
      <ellipse cx="44" cy="62" rx="0.8" ry="6" fill="#0a0118"/>
      <ellipse cx="76" cy="62" rx="0.8" ry="6" fill="#0a0118"/>
      {/* Hocico con humo */}
      <ellipse cx="50" cy="80" rx="2" ry="3" fill="#0a0118"/>
      <ellipse cx="70" cy="80" rx="2" ry="3" fill="#0a0118"/>
      <path d="M48 88 Q55 92 62 88 Q68 92 75 88" stroke="#0a0118" strokeWidth="2" fill="none"/>
      {/* Colmillos */}
      <path d="M52 88 L50 96 L54 92 Z" fill="#fff"/>
      <path d="M68 88 L70 96 L66 92 Z" fill="#fff"/>
    </svg>
  );
}
