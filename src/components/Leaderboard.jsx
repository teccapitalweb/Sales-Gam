import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useSales } from '../context/SalesContext';
import SellerCard from './SellerCard';
import EventOverlay from './EventOverlay';
import IdleMode from './IdleMode';
import ParticlesBackground from './ParticlesBackground';
import { useIdleDetector } from '../hooks/useIdleDetector';

export default function Leaderboard() {
  const { ranked, lastEvent, state } = useSales();

  // Tiempo real
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Idle detection
  const lastTs = state.history.length ? state.history[state.history.length - 1].ts : 0;
  const isIdle = useIdleDetector(lastTs, 30000);

  // Track de ventas recientes para animar la card que recibió +1
  const [recentSaleSellerId, setRecentSaleSellerId] = useState(null);
  const [climbingIds, setClimbingIds] = useState([]);
  const lastEventTsRef = useRef(0);

  useEffect(() => {
    if (!lastEvent || lastEvent.ts === lastEventTsRef.current) return;
    lastEventTsRef.current = lastEvent.ts;

    if (lastEvent.type === 'SALE_TOP') {
      setRecentSaleSellerId(lastEvent.sellerId);
      setTimeout(() => setRecentSaleSellerId(null), 800);
    }
    if (lastEvent.type === 'CLIMB') {
      setClimbingIds(prev => [...prev, lastEvent.sellerId]);
      setTimeout(() => {
        setClimbingIds(prev => prev.filter(id => id !== lastEvent.sellerId));
      }, 2400);
    }
  }, [lastEvent]);

  const top4 = ranked.slice(0, 4);
  const max  = ranked[0]?.total || 1;

  const totalSales = useMemo(
    () => Object.values(state.sellers).reduce((a, b) => a + b, 0),
    [state.sellers]
  );

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      padding: '32px 48px 48px',
      zIndex: 2
    }}>
      <ParticlesBackground density={isIdle ? 30 : 70} intensity={isIdle ? 0.4 : 1.2}/>

      {/* HEADER HUD */}
      <header style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: 24,
        marginBottom: 36,
        zIndex: 4
      }}>
        {/* Stats izquierda */}
        <HudStat
          label="VENTAS TOTALES"
          value={totalSales}
          color="#5EEAD4"
        />

        {/* Título central */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: 12,
            letterSpacing: '0.5em',
            color: 'rgba(180, 124, 255, 0.8)',
            marginBottom: 6
          }}>
            TEC CAPITAL × IPCI
          </div>
          <h1 style={{
            fontSize: 'clamp(38px, 5vw, 64px)',
            background: 'linear-gradient(90deg, #FFD93D 0%, #FF8C42 25%, #FF4FB6 50%, #B47CFF 75%, #6BC9FF 100%)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '0.08em',
            lineHeight: 1,
            animation: 'shimmer 6s linear infinite',
            filter: 'drop-shadow(0 0 30px rgba(180, 124, 255, 0.6))'
          }}>
            SALES ARENA
          </h1>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 8,
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: 13,
            color: 'rgba(255,255,255,0.6)',
            letterSpacing: '0.3em'
          }}>
            <LiveDot/>
            EN VIVO · TOP 4
          </div>
        </motion.div>

        {/* Reloj derecha */}
        <HudStat
          label="HORA"
          value={now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          color="#FFD93D"
          align="right"
          mono
        />
      </header>

      {/* Botón pequeño al panel */}
      <Link
        to="/control"
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 90,
          padding: '8px 16px',
          background: 'rgba(20, 8, 40, 0.7)',
          border: '1px solid rgba(180, 124, 255, 0.4)',
          borderRadius: 8,
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: 11,
          letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(8px)',
          textDecoration: 'none'
        }}
      >
        ⚙ PANEL
      </Link>

      {/* TOP 4 cards */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        maxWidth: 1280,
        margin: '0 auto',
        position: 'relative',
        zIndex: 3
      }}>
        <AnimatePresence mode="popLayout">
          {top4.map((seller, idx) => (
            <SellerCard
              key={seller.id}
              seller={seller}
              rank={idx}
              max={max}
              isLeader={idx === 0 && seller.total > 0}
              recentlyClimbed={climbingIds.includes(seller.id)}
              recentSale={recentSaleSellerId === seller.id}
            />
          ))}
        </AnimatePresence>

        {ranked.length > 4 && (
          <BenchPreview ranked={ranked.slice(4)} />
        )}
      </div>

      {/* Idle */}
      <AnimatePresence>
        {isIdle && totalSales > 0 && <IdleMode/>}
      </AnimatePresence>

      {/* Eventos */}
      <EventOverlay event={lastEvent}/>
    </div>
  );
}

// ===========================================================
// HudStat
// ===========================================================
function HudStat({ label, value, color, align = 'left', mono = false }) {
  return (
    <div style={{
      textAlign: align,
      fontFamily: mono ? 'Share Tech Mono, monospace' : 'Orbitron, sans-serif'
    }}>
      <div style={{
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: 11,
        letterSpacing: '0.3em',
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 6
      }}>
        ▸ {label}
      </div>
      <div style={{
        fontSize: 32,
        fontWeight: 900,
        color: color,
        textShadow: `0 0 20px ${color}`,
        lineHeight: 1
      }}>
        {value}
      </div>
    </div>
  );
}

// ===========================================================
// LiveDot
// ===========================================================
function LiveDot() {
  return (
    <motion.span
      animate={{ opacity: [1, 0.3, 1], scale: [1, 1.2, 1] }}
      transition={{ duration: 1.4, repeat: Infinity }}
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: 999,
        background: '#FF4FB6',
        boxShadow: '0 0 10px #FF4FB6'
      }}
    />
  );
}

// ===========================================================
// Banca: 5° en adelante (mini preview)
// ===========================================================
function BenchPreview({ ranked }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        marginTop: 12,
        padding: '14px 20px',
        background: 'rgba(20, 8, 40, 0.4)',
        border: '1px dashed rgba(180, 124, 255, 0.25)',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap'
      }}
    >
      <div style={{
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: 11,
        letterSpacing: '0.3em',
        color: 'rgba(255,255,255,0.45)'
      }}>
        ▾ BANCA
      </div>
      {ranked.map((s, i) => (
        <div key={s.id} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 10px',
          background: `${s.color}15`,
          border: `1px solid ${s.color}40`,
          borderRadius: 999,
          fontFamily: 'Orbitron, sans-serif',
          fontSize: 12,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.8)'
        }}>
          <span style={{ color: s.color }}>#{i + 5}</span>
          {s.name}
          <span style={{ color: s.color, fontWeight: 900 }}>{s.total}</span>
        </div>
      ))}
    </motion.div>
  );
}
