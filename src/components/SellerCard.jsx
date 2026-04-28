import { motion } from 'framer-motion';
import Avatar from './Avatar';
import AnimatedBar from './AnimatedBar';

const RANK_LABELS  = ['CHAMPION', 'CHALLENGER', 'CONTENDER', 'RIVAL'];
const RANK_MEDALS  = ['🏆', '🥈', '🥉', '⚔️'];

export default function SellerCard({ seller, rank, max, isLeader, recentlyClimbed, recentSale }) {
  const rankLabel = RANK_LABELS[rank] || 'TOP';
  const medal     = RANK_MEDALS[rank] || '★';

  // Tamaño escalonado: el #1 más grande, los demás un poco más chicos
  const isFirst = rank === 0;

  return (
    <motion.div
      layout
      layoutId={`seller-${seller.id}`}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      style={{
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(20, 8, 40, 0.85) 0%, rgba(35, 15, 65, 0.75) 100%)',
        borderRadius: 18,
        padding: isFirst ? '24px 28px' : '18px 22px',
        border: `2px solid ${seller.color}55`,
        boxShadow: `0 0 30px ${seller.color}30, inset 0 1px 0 rgba(255,255,255,0.05)`,
        overflow: 'hidden',
        '--accent': seller.color
      }}
      animate={recentSale ? {
        scale: [1, 1.025, 1],
        boxShadow: [
          `0 0 30px ${seller.color}30, inset 0 1px 0 rgba(255,255,255,0.05)`,
          `0 0 80px ${seller.color}, 0 0 120px ${seller.color}80, inset 0 1px 0 rgba(255,255,255,0.05)`,
          `0 0 30px ${seller.color}30, inset 0 1px 0 rgba(255,255,255,0.05)`
        ]
      } : {}}
    >
      {/* Esquinas HUD */}
      <span className="hud-corner tl" style={{ borderColor: seller.color }}/>
      <span className="hud-corner tr" style={{ borderColor: seller.color }}/>
      <span className="hud-corner bl" style={{ borderColor: seller.color }}/>
      <span className="hud-corner br" style={{ borderColor: seller.color }}/>

      {/* Indicador "subió de posición" */}
      {recentlyClimbed && (
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 30 }}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: `linear-gradient(90deg, ${seller.color}, ${seller.colorAlt})`,
            color: '#0a0118',
            padding: '4px 10px',
            borderRadius: 999,
            fontFamily: 'Orbitron, sans-serif',
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: '0.1em',
            boxShadow: `0 0 20px ${seller.color}`,
            zIndex: 5
          }}
        >
          ▲ SUBE
        </motion.div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: isFirst ? 'auto 1fr auto' : 'auto 1fr auto',
        alignItems: 'center',
        gap: isFirst ? 24 : 18
      }}>
        {/* Posición + medalla */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4
        }}>
          <div style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: isFirst ? 64 : 48,
            fontWeight: 900,
            lineHeight: 1,
            background: `linear-gradient(180deg, ${seller.color} 0%, ${seller.colorAlt} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: `drop-shadow(0 0 10px ${seller.color})`
          }}>
            #{rank + 1}
          </div>
          <div style={{
            fontSize: isFirst ? 28 : 20,
            filter: `drop-shadow(0 0 8px ${seller.color})`
          }}>{medal}</div>
        </div>

        {/* Avatar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isFirst ? 24 : 18,
          minWidth: 0
        }}>
          <Avatar
            kind={seller.avatar}
            color={seller.color}
            colorAlt={seller.colorAlt}
            size={isFirst ? 110 : 82}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Nombre */}
            <div style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: isFirst ? 36 : 26,
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '0.04em',
              textShadow: `0 0 14px ${seller.color}`,
              marginBottom: 2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {seller.name}
            </div>

            {/* Rank label */}
            <div style={{
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: isFirst ? 13 : 11,
              color: seller.color,
              letterSpacing: '0.2em',
              marginBottom: 10,
              opacity: 0.9
            }}>
              [ {rankLabel} ] {isLeader && '◆ LEADER ◆'}
            </div>

            {/* Barra */}
            <AnimatedBar
              value={seller.total}
              max={max || 1}
              color={seller.color}
              colorAlt={seller.colorAlt}
              height={isFirst ? 38 : 30}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
