import { useEffect, useState } from 'react';

/**
 * Devuelve true cuando han pasado `delay` ms sin que `lastActivityTs` cambie.
 * @param {number} lastActivityTs - timestamp de la última actividad
 * @param {number} delay - milisegundos antes de marcar idle
 */
export function useIdleDetector(lastActivityTs, delay = 30000) {
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    if (!lastActivityTs) {
      // Sin actividad jamás -> idle inmediato
      setIsIdle(true);
      return;
    }

    setIsIdle(false);
    const timer = setTimeout(() => {
      setIsIdle(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [lastActivityTs, delay]);

  return isIdle;
}
