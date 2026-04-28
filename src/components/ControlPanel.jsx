import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useSales } from '../context/SalesContext';
import { SELLERS, SELLER_BY_ID } from '../data/sellers';
import Avatar from './Avatar';

// Lista plana de páginas con su vendedor — agrupadas para visualización
const ALL_PAGES = SELLERS.flatMap(s =>
  s.pages.map(page => ({ page, sellerId: s.id, color: s.color, colorAlt: s.colorAlt }))
);

export default function ControlPanel() {
  const { state, addSale, undoLastSale, reset, ranked } = useSales();
  const [confirmReset, setConfirmReset] = useState(false);

  const totalSales = Object.values(state.sellers).reduce((a, b) => a + b, 0);

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      padding: '24px 32px 64px',
      maxWidth: 1400,
      margin: '0 auto',
      zIndex: 2
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        paddingBottom: 18,
        borderBottom: '1px solid rgba(180, 124, 255, 0.2)'
      }}>
        <div>
          <div style={{
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: 11,
            letterSpacing: '0.4em',
            color: 'rgba(180, 124, 255, 0.8)',
            marginBottom: 4
          }}>
            ◆ PANEL DE CONTROL ◆
          </div>
          <h1 style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: 28,
            background: 'linear-gradient(90deg, #FFD93D, #FF8C42, #FF4FB6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '0.06em'
          }}>
            REGISTRO DE VENTAS
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/" style={btnGhostStyle}>
            ◀ VER ARENA
          </Link>
          <button onClick={undoLastSale} style={btnGhostStyle} title="Deshacer última venta">
            ↩ DESHACER
          </button>
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)} style={btnDangerStyle}>
              ⟳ RESET
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => { reset(); setConfirmReset(false); }}
                style={{ ...btnDangerStyle, background: '#FF4FB6', color: '#0a0118' }}
              >
                ✓ CONFIRMAR
              </button>
              <button onClick={() => setConfirmReset(false)} style={btnGhostStyle}>
                ✕
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Stats rápidas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
        marginBottom: 24
      }}>
        <StatCard label="Ventas hoy"   value={totalSales}                   color="#5EEAD4"/>
        <StatCard label="Líder actual" value={ranked[0]?.total > 0 ? ranked[0].name : '—'} color="#FFD93D"/>
        <StatCard label="Vendedores"   value={SELLERS.length}                color="#B47CFF"/>
        <StatCard label="Páginas"      value={ALL_PAGES.length}              color="#FF4FB6"/>
      </div>

      {/* Grid de páginas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16
      }}>
        {ALL_PAGES.map((p) => (
          <PageButton
            key={p.page}
            page={p.page}
            sellerId={p.sellerId}
            count={state.pages[p.page] || 0}
            sellerTotal={state.sellers[p.sellerId] || 0}
            onClick={() => addSale(p.page)}
          />
        ))}
      </div>

      {/* Tabla resumen */}
      <SummaryTable state={state} ranked={ranked}/>
    </div>
  );
}

// ===========================================================
// PageButton — botón principal del panel
// ===========================================================
function PageButton({ page, sellerId, count, sellerTotal, onClick }) {
  const seller = SELLER_BY_ID[sellerId];

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -3, scale: 1.015 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      style={{
        position: 'relative',
        background: `linear-gradient(135deg, rgba(20, 8, 40, 0.9), rgba(35, 15, 65, 0.9))`,
        border: `2px solid ${seller.color}50`,
        borderRadius: 14,
        padding: '16px 18px',
        cursor: 'pointer',
        textAlign: 'left',
        overflow: 'hidden',
        boxShadow: `0 4px 24px rgba(0,0,0,0.3)`,
        transition: 'border-color 0.2s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = seller.color}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = `${seller.color}50`}
    >
      {/* Glow lateral */}
      <div style={{
        position: 'absolute',
        top: 0, bottom: 0, left: 0,
        width: 4,
        background: `linear-gradient(180deg, ${seller.color}, ${seller.colorAlt})`,
        boxShadow: `0 0 16px ${seller.color}`
      }}/>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avatar
          kind={seller.avatar}
          color={seller.color}
          colorAlt={seller.colorAlt}
          size={56}
          animated={false}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Nombre del vendedor */}
          <div style={{
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: 11,
            color: seller.color,
            letterSpacing: '0.2em',
            marginBottom: 2
          }}>
            ▸ {seller.name.toUpperCase()}
          </div>

          {/* Página */}
          <div style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: 18,
            fontWeight: 900,
            color: '#fff',
            letterSpacing: '0.03em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {page}
          </div>

          {/* Contadores */}
          <div style={{
            display: 'flex',
            gap: 12,
            marginTop: 6,
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: 11,
            color: 'rgba(255,255,255,0.55)'
          }}>
            <span>página: <span style={{ color: '#fff', fontWeight: 700 }}>{count}</span></span>
            <span>vendedor: <span style={{ color: seller.color, fontWeight: 700 }}>{sellerTotal}</span></span>
          </div>
        </div>

        {/* Botón "+1" visual */}
        <div style={{
          background: `linear-gradient(135deg, ${seller.color}, ${seller.colorAlt})`,
          color: '#0a0118',
          width: 50,
          height: 50,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Orbitron, sans-serif',
          fontWeight: 900,
          fontSize: 22,
          boxShadow: `0 4px 16px ${seller.color}80`,
          flexShrink: 0
        }}>
          +1
        </div>
      </div>
    </motion.button>
  );
}

// ===========================================================
// StatCard
// ===========================================================
function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: 'rgba(20, 8, 40, 0.6)',
      border: `1px solid ${color}40`,
      borderRadius: 10,
      padding: '12px 16px'
    }}>
      <div style={{
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: 10,
        letterSpacing: '0.3em',
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 4
      }}>
        {label.toUpperCase()}
      </div>
      <div style={{
        fontFamily: 'Orbitron, sans-serif',
        fontSize: 22,
        fontWeight: 900,
        color: color,
        textShadow: `0 0 10px ${color}80`
      }}>
        {value}
      </div>
    </div>
  );
}

// ===========================================================
// SummaryTable — abajo, todos los vendedores ordenados
// ===========================================================
function SummaryTable({ state, ranked }) {
  return (
    <div style={{
      marginTop: 32,
      background: 'rgba(20, 8, 40, 0.6)',
      border: '1px solid rgba(180, 124, 255, 0.2)',
      borderRadius: 14,
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '12px 18px',
        borderBottom: '1px solid rgba(180, 124, 255, 0.2)',
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: 12,
        letterSpacing: '0.3em',
        color: 'rgba(180, 124, 255, 0.9)'
      }}>
        ◆ RANKING COMPLETO
      </div>
      <div style={{ padding: '8px 0' }}>
        {ranked.map((s, i) => (
          <div key={s.id} style={{
            display: 'grid',
            gridTemplateColumns: '40px 40px 1fr auto',
            alignItems: 'center',
            gap: 12,
            padding: '8px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            background: i < 4 ? `${s.color}08` : 'transparent'
          }}>
            <span style={{
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: 900,
              color: i < 4 ? s.color : 'rgba(255,255,255,0.3)',
              fontSize: 16
            }}>
              #{i + 1}
            </span>
            <Avatar kind={s.avatar} color={s.color} colorAlt={s.colorAlt} size={28} animated={false} glow={false}/>
            <div>
              <div style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 700, fontSize: 14 }}>
                {s.name}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                {s.pages.join(' · ')}
              </div>
            </div>
            <div style={{
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: 900,
              color: s.color,
              fontSize: 18,
              textShadow: i < 4 ? `0 0 10px ${s.color}` : 'none'
            }}>
              {s.total}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===========================================================
// Estilos compartidos para botones del header
// ===========================================================
const btnGhostStyle = {
  padding: '8px 14px',
  background: 'rgba(20, 8, 40, 0.6)',
  border: '1px solid rgba(180, 124, 255, 0.3)',
  borderRadius: 8,
  fontFamily: 'Orbitron, sans-serif',
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: '0.15em',
  color: 'rgba(255,255,255,0.85)',
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center'
};

const btnDangerStyle = {
  padding: '8px 14px',
  background: 'rgba(255, 79, 182, 0.1)',
  border: '1px solid rgba(255, 79, 182, 0.5)',
  borderRadius: 8,
  fontFamily: 'Orbitron, sans-serif',
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: '0.15em',
  color: '#FF4FB6',
  cursor: 'pointer'
};
