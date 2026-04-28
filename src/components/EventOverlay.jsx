import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { SELLER_BY_ID } from '../data/sellers';
import Avatar from './Avatar';

/**
 * Overlay que escucha lastEvent del context y dispara animaciones.
 *  - SALE_TOP: micro pop en el área del leaderboard (lo maneja la card)
 *  - SALE_OUTSIDER: muestra burbuja flotante con avatar + confeti
 *  - CLIMB: ya manejado por SellerCard, aquí no añadimos overlay
 *  - NEW_LEADER: banner enorme + confeti
 */
export default function EventOverlay({ event }) {
  const [outsiderEvents, setOutsiderEvents] = useState([]);
  const [leaderEvent, setLeaderEvent] = useState(null);
  const [floatingPlus, setFloatingPlus] = useState([]);
  const lastEventTsRef = useRef(0);

  useEffect(() => {
    if (!event || event.ts === lastEventTsRef.current) return;
    lastEventTsRef.current = event.ts;

    const seller = SELLER_BY_ID[event.sellerId];
    if (!seller) return;

    if (event.type === 'SALE_OUTSIDER') {
      setOutsiderEvents(prev => [...prev, { ...event, key: event.ts }]);
      smallConfetti(seller.color);
      setTimeout(() => {
        setOutsiderEvents(prev => prev.filter(e => e.key !== event.ts));
      }, 3500);
    }

    if (event.type === 'SALE_TOP') {
      // Plus flotante en una posición aleatoria del top
      setFloatingPlus(prev => [...prev, { key: event.ts, color: seller.color, sellerId: seller.id }]);
      setTimeout(() => {
        setFloatingPlus(prev => prev.filter(p => p.key !== event.ts));
      }, 1400);
    }

    if (event.type === 'NEW_LEADER') {
      setLeaderEvent({ ...event, key: event.ts });
      bigConfetti(seller.color, seller.colorAlt);
      setTimeout(() => setLeaderEvent(null), 4000);
    }
  }, [event]);

  return (
    <>
      {/* Burbuja flotante para outsider */}
      <AnimatePresence>
        {outsiderEvents.map((ev, idx) => {
          const seller = SELLER_BY_ID[ev.sellerId];
          return (
            <motion.div
              key={ev.key}
              initial={{ opacity: 0, y: 100, scale: 0.6 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.6 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              style={{
                position: 'fixed',
                bottom: 60 + idx * 110,
                left: 60,
                zIndex: 80,
                background: `linear-gradient(135deg, rgba(20,8,40,0.95), rgba(40,15,80,0.95))`,
                border: `2px solid ${seller.color}`,
                borderRadius: 16,
                padding: '14px 20px 14px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                boxShadow: `0 0 60px ${seller.color}, 0 10px 40px rgba(0,0,0,0.6)`,
                pointerEvents: 'none'
              }}
            >
              <Avatar kind={seller.avatar} color={seller.color} colorAlt={seller.colorAlt} size={56}/>
              <div>
                <div style={{
                  fontFamily: 'Orbitron, sans-serif',
                  fontWeight: 900,
                  fontSize: 18,
                  color: '#fff',
                  textShadow: `0 0 10px ${seller.color}`
                }}>
                  {seller.name}
                </div>
                <div style={{
                  fontFamily: 'Orbitron, sans-serif',
                  fontWeight: 900,
                  fontSize: 28,
                  background: `linear-gradient(90deg, ${seller.color}, ${seller.colorAlt})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 1
                }}>
                  +1 🎉
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Plus flotante para top */}
      <AnimatePresence>
        {floatingPlus.map((p, idx) => (
          <motion.div
            key={p.key}
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 1, 0], y: -120, scale: 1.4 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              right: 60 + (idx % 3) * 80,
              top: '50%',
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: 900,
              fontSize: 56,
              color: p.color,
              textShadow: `0 0 20px ${p.color}, 0 0 40px ${p.color}`,
              zIndex: 70,
              pointerEvents: 'none'
            }}
          >
            +1
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Banner nuevo líder */}
      <AnimatePresence>
        {leaderEvent && (() => {
          const seller = SELLER_BY_ID[leaderEvent.sellerId];
          return (
            <motion.div
              key={leaderEvent.key}
              initial={{ opacity: 0, scale: 0.5, rotateY: -90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.6, rotateY: 90 }}
              transition={{ type: 'spring', stiffness: 150, damping: 20 }}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 100,
                background: `linear-gradient(135deg, ${seller.color}, ${seller.colorAlt})`,
                padding: '4px',
                borderRadius: 24,
                boxShadow: `0 0 120px ${seller.color}, 0 0 200px ${seller.colorAlt}`,
                pointerEvents: 'none'
              }}
            >
              <div style={{
                background: 'rgba(10, 1, 24, 0.95)',
                borderRadius: 22,
                padding: '32px 64px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontFamily: 'Share Tech Mono, monospace',
                  fontSize: 14,
                  color: seller.color,
                  letterSpacing: '0.4em',
                  marginBottom: 12
                }}>
                  ◆ ◆ ◆ NEW LEADER ◆ ◆ ◆
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 24,
                  justifyContent: 'center'
                }}>
                  <Avatar kind={seller.avatar} color={seller.color} colorAlt={seller.colorAlt} size={130}/>
                  <div style={{
                    fontFamily: 'Orbitron, sans-serif',
                    fontSize: 64,
                    fontWeight: 900,
                    background: `linear-gradient(180deg, ${seller.color}, ${seller.colorAlt})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '0.05em',
                    lineHeight: 1
                  }}>
                    {seller.name.toUpperCase()}
                  </div>
                </div>
                <div style={{
                  marginTop: 16,
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#fff',
                  textShadow: `0 0 20px ${seller.color}`,
                  letterSpacing: '0.2em'
                }}>
                  TOMA EL TRONO 👑
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </>
  );
}

// =====================================================================
// Confeti
// =====================================================================
function smallConfetti(color) {
  const c1 = color;
  const c2 = '#FFD93D';
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { x: 0.15, y: 0.85 },
    colors: [c1, c2, '#fff', '#B47CFF'],
    scalar: 0.9
  });
}

function bigConfetti(color1, color2) {
  const duration = 2.5 * 1000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 70,
      origin: { x: 0 },
      colors: [color1, color2, '#fff', '#FFD93D']
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 70,
      origin: { x: 1 },
      colors: [color1, color2, '#fff', '#FFD93D']
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();

  // Burst central
  confetti({
    particleCount: 200,
    spread: 120,
    origin: { x: 0.5, y: 0.5 },
    colors: [color1, color2, '#fff', '#FFD93D', '#5EEAD4'],
    scalar: 1.2,
    startVelocity: 50
  });
}
