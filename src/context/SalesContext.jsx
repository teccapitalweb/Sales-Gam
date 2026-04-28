import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { SELLERS, SELLER_BY_PAGE, buildInitialState } from '../data/sellers';

const STORAGE_KEY = 'sales-arena-state-v1';
const EVENT_KEY   = 'sales-arena-event-v1';

const SalesContext = createContext(null);

export function SalesProvider({ children }) {
  const [state, setState] = useState(() => loadState());
  const [lastEvent, setLastEvent] = useState(null);
  const prevTopIdsRef = useRef([]);
  const prevLeaderRef = useRef(null);

  // Persistir cambios en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // ignorar errores de quota
    }
  }, [state]);

  // Sincronización entre pestañas (control panel <-> proyección)
  useEffect(() => {
    function handleStorage(e) {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setState(JSON.parse(e.newValue));
        } catch (err) {
          // ignore
        }
      }
      if (e.key === EVENT_KEY && e.newValue) {
        try {
          setLastEvent(JSON.parse(e.newValue));
        } catch (err) {
          // ignore
        }
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Detectar cambios de líder y top4
  useEffect(() => {
    const ranked = getRanked(state.sellers);
    const top4 = ranked.slice(0, 4).map(r => r.id);
    const leader = ranked[0]?.id;
    const totalSales = Object.values(state.sellers).reduce((a, b) => a + b, 0);

    if (totalSales === 0) {
      prevTopIdsRef.current = top4;
      prevLeaderRef.current = leader;
      return;
    }

    // Nuevo líder
    if (leader && prevLeaderRef.current && leader !== prevLeaderRef.current) {
      broadcastEvent({ type: 'NEW_LEADER', sellerId: leader, ts: Date.now() });
    }

    // Cambios en top 4: nuevos entrantes + movimientos hacia arriba dentro del top
    const prevTop = prevTopIdsRef.current;
    if (prevTop.length === 4) {
      // 1) Recién llegados al top4
      const newcomers = top4.filter(id => !prevTop.includes(id));
      newcomers.forEach(id => {
        broadcastEvent({ type: 'CLIMB', sellerId: id, ts: Date.now() });
      });

      // 2) Quienes ya estaban en el top4 pero subieron de posición
      top4.forEach((id, newIdx) => {
        if (newcomers.includes(id)) return; // ya emitido
        const oldIdx = prevTop.indexOf(id);
        if (oldIdx > -1 && newIdx < oldIdx) {
          broadcastEvent({ type: 'CLIMB', sellerId: id, ts: Date.now() + 1 });
        }
      });
    }

    prevTopIdsRef.current = top4;
    prevLeaderRef.current = leader;
  }, [state.sellers]);

  const addSale = useCallback((page) => {
    const sellerId = SELLER_BY_PAGE[page];
    if (!sellerId) return;

    setState(prev => {
      const sellers = { ...prev.sellers, [sellerId]: (prev.sellers[sellerId] || 0) + 1 };
      const pages   = { ...prev.pages,   [page]:     (prev.pages[page]     || 0) + 1 };
      const history = [...prev.history, { sellerId, page, ts: Date.now() }].slice(-50);
      return { sellers, pages, history };
    });

    const ranked   = getRanked(state.sellers);
    const top4Ids  = ranked.slice(0, 4).map(r => r.id);
    const inTop4   = top4Ids.includes(sellerId);

    broadcastEvent({
      type: inTop4 ? 'SALE_TOP' : 'SALE_OUTSIDER',
      sellerId,
      page,
      ts: Date.now()
    });
  }, [state.sellers]);

  const undoLastSale = useCallback(() => {
    setState(prev => {
      if (!prev.history.length) return prev;
      const history = prev.history.slice();
      const last = history.pop();
      const sellers = { ...prev.sellers, [last.sellerId]: Math.max(0, (prev.sellers[last.sellerId] || 0) - 1) };
      const pages   = { ...prev.pages,   [last.page]:     Math.max(0, (prev.pages[last.page]     || 0) - 1) };
      return { sellers, pages, history };
    });
  }, []);

  const reset = useCallback(() => {
    setState(buildInitialState());
    prevTopIdsRef.current = [];
    prevLeaderRef.current = null;
  }, []);

  function broadcastEvent(ev) {
    setLastEvent(ev);
    try {
      // Disparar storage event en otras pestañas
      localStorage.setItem(EVENT_KEY, JSON.stringify(ev));
    } catch (e) {
      // ignore
    }
  }

  return (
    <SalesContext.Provider value={{
      state,
      lastEvent,
      addSale,
      undoLastSale,
      reset,
      ranked: getRanked(state.sellers)
    }}>
      {children}
    </SalesContext.Provider>
  );
}

export function useSales() {
  const ctx = useContext(SalesContext);
  if (!ctx) throw new Error('useSales must be used inside <SalesProvider>');
  return ctx;
}

// =====================================================================
// Helpers
// =====================================================================
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildInitialState();
    const parsed = JSON.parse(raw);
    // Validar estructura
    if (!parsed.sellers || !parsed.pages) return buildInitialState();
    return parsed;
  } catch (e) {
    return buildInitialState();
  }
}

function getRanked(sellersMap) {
  return SELLERS
    .map(s => ({ ...s, total: sellersMap[s.id] || 0 }))
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.name.localeCompare(b.name);
    });
}
