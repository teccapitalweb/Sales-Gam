import { useEffect, useRef } from 'react';

/**
 * Background animado con partículas + líneas conectadas (estilo HUD).
 * Usa canvas para performance.
 */
export default function ParticlesBackground({ density = 60, intensity = 1 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const particlesRef = useRef([]);
  const intensityRef = useRef(intensity);

  useEffect(() => { intensityRef.current = intensity; }, [intensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

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
      'rgba(255, 217, 61, 0.9)',   // amarillo
      'rgba(255, 140, 66, 0.9)',   // naranja
      'rgba(107, 201, 255, 0.9)',  // azul
      'rgba(255, 79, 182, 0.9)',   // rosa
      'rgba(94, 234, 212, 0.9)',   // mint
      'rgba(180, 124, 255, 0.9)'   // morado
    ];

    function makeParticle() {
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

    particlesRef.current = Array.from({ length: density }, makeParticle);

    function tick() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const i = intensityRef.current;
      const ps = particlesRef.current;

      // Líneas conectadas
      for (let a = 0; a < ps.length; a++) {
        for (let b = a + 1; b < ps.length; b++) {
          const dx = ps[a].x - ps[b].x;
          const dy = ps[a].y - ps[b].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.15 * i;
            ctx.strokeStyle = `rgba(180, 124, 255, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(ps[a].x, ps[a].y);
            ctx.lineTo(ps[b].x, ps[b].y);
            ctx.stroke();
          }
        }
      }

      // Partículas
      ps.forEach(p => {
        p.x += p.vx * i;
        p.y += p.vy * i;
        p.pulse += 0.04;

        if (p.x < 0) p.x = w; else if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; else if (p.y > h) p.y = 0;

        const pulseSize = p.r + Math.sin(p.pulse) * 0.6;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8 * i;
        ctx.beginPath();
        ctx.arc(p.x, p.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      rafRef.current = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none'
      }}
    />
  );
}
