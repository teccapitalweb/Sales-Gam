// =====================================================================
// Vendedores y páginas asignadas — TEC CAPITAL / IPCI
// Cada vendedor tiene un avatar tipo "animal cyberpunk" en SVG inline.
// =====================================================================

export const SELLERS = [
  {
    id: 'josue',
    name: 'Josué',
    avatar: 'wolf',
    color: '#6BC9FF',          // azul pastel
    colorAlt: '#3FA3F0',
    pages: ['Sinergia-Bionova']
  },
  {
    id: 'ana',
    name: 'Ana',
    avatar: 'eagle',
    color: '#FFD93D',          // amarillo
    colorAlt: '#FFB800',
    pages: ['AgroTec']
  },
  {
    id: 'jose',
    name: 'José',
    avatar: 'tiger',
    color: '#FF8C42',          // naranja
    colorAlt: '#FF6A1A',
    pages: ['Bioterra', 'Zoorigen']
  },
  {
    id: 'daisy',
    name: 'Daisy',
    avatar: 'fox',
    color: '#FF4FB6',          // rosa
    colorAlt: '#E0339A',
    pages: ['IMDIIL', 'GlobalVet']
  },
  {
    id: 'daniela',
    name: 'Daniela',
    avatar: 'panther',
    color: '#B47CFF',          // morado
    colorAlt: '#9656FF',
    pages: ['Dermalysse']
  },
  {
    id: 'ani',
    name: 'Ani Reyes',
    avatar: 'falcon',
    color: '#5EEAD4',          // verde celeste
    colorAlt: '#2DD4BF',
    pages: ['Synova']
  },
  {
    id: 'eli',
    name: 'Eli',
    avatar: 'lion',
    color: '#FFAA33',          // amarillo-naranja
    colorAlt: '#FF8800',
    pages: ['Visión Pecuaria', 'Ingeniería Avícola']
  },
  {
    id: 'anni',
    name: 'Anni',
    avatar: 'owl',
    color: '#9D7CFF',          // morado-azul
    colorAlt: '#7C5CE6',
    pages: ['ICADEM', 'IMDAC']
  },
  {
    id: 'carla',
    name: 'Carla',
    avatar: 'dragon',
    color: '#FF6FA8',          // rosa-naranja
    colorAlt: '#FF4787',
    pages: ['Fisiotec', 'Odonteck']
  }
];

// Lookup por ID
export const SELLER_BY_ID = Object.fromEntries(
  SELLERS.map(s => [s.id, s])
);

// Lookup página -> vendedor
export const SELLER_BY_PAGE = (() => {
  const map = {};
  SELLERS.forEach(s => {
    s.pages.forEach(p => { map[p] = s.id; });
  });
  return map;
})();

// Estado inicial: contadores por página y por vendedor
export function buildInitialState() {
  const sellers = {};
  const pages = {};
  SELLERS.forEach(s => {
    sellers[s.id] = 0;
    s.pages.forEach(p => { pages[p] = 0; });
  });
  return { sellers, pages, history: [] };
}
