import { motion, useMotionValue, animate } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * Barra horizontal animada con:
 *  - relleno fluido al cambiar el valor
 *  - shimmer constante encima
 *  - número en rolling
 */
export default function AnimatedBar({ value, max, color, colorAlt, height = 40, accent = 'currentColor' }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height,
        background: 'rgba(0, 0, 0, 0.55)',
        borderRadius: 999,
        overflow: 'hidden',
        border: `1px solid ${color}40`,
        boxShadow: `inset 0 2px 8px rgba(0,0,0,0.5)`
      }}
    >
      {/* Relleno principal */}
      <motion.div
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        style={{
          position: 'absolute',
          inset: 0,
          right: 'auto',
          background: `linear-gradient(90deg, ${colorAlt} 0%, ${color} 50%, ${colorAlt} 100%)`,
          backgroundSize: '200% 100%',
          animation: 'shimmer 2.5s linear infinite',
          borderRadius: 999,
          boxShadow: `0 0 20px ${color}, 0 0 40px ${color}80`
        }}
      />
      {/* Highlight superior */}
      <motion.div
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        style={{
          position: 'absolute',
          top: 2,
          left: 2,
          height: '40%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.4), transparent)',
          borderRadius: 999,
          pointerEvents: 'none'
        }}
      />
      {/* Marcas verticales decorativas */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(90deg, transparent 0, transparent 38px, rgba(255,255,255,0.06) 38px, rgba(255,255,255,0.06) 40px)',
        pointerEvents: 'none'
      }}/>
      {/* Número grande */}
      <RollingNumber
        value={value}
        color={color}
        height={height}
      />
    </div>
  );
}

function RollingNumber({ value, color, height }) {
  const mv = useMotionValue(value);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 0.6,
      ease: 'easeOut',
      onUpdate: v => setDisplay(Math.round(v))
    });
    return controls.stop;
  }, [value]);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingRight: 16,
      fontFamily: 'Orbitron, sans-serif',
      fontWeight: 900,
      fontSize: height * 0.55,
      color: '#fff',
      textShadow: `0 0 10px ${color}, 0 2px 4px rgba(0,0,0,0.8)`,
      letterSpacing: '0.05em',
      pointerEvents: 'none'
    }}>
      {display}
    </div>
  );
}
