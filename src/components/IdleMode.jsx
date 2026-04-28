import { motion } from 'framer-motion';

const MESSAGES = [
  'ESPERANDO VENTAS',
  'ARENA EN STANDBY',
  'CARGANDO ENERGÍA',
  'LISTOS PARA EL COMBATE'
];

export default function IdleMode() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 5,
        pointerEvents: 'none',
        textAlign: 'center',
        marginTop: 90
      }}
    >
      <div style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '14px 28px',
        background: 'rgba(20, 8, 40, 0.6)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(180, 124, 255, 0.3)',
        borderRadius: 999
      }}>
        <motion.div
          animate={{
            opacity: [0.4, 1, 0.4]
          }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: 14,
            color: 'rgba(180, 124, 255, 0.9)',
            letterSpacing: '0.4em'
          }}
        >
          <PulsingDot/>
          {MESSAGES[0]}
          <PulsingDot delay={0.5}/>
        </motion.div>
      </div>
    </motion.div>
  );
}

function PulsingDot({ delay = 0 }) {
  return (
    <motion.span
      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay }}
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: 999,
        background: 'rgba(180, 124, 255, 1)',
        boxShadow: '0 0 12px rgba(180, 124, 255, 1)'
      }}
    />
  );
}
