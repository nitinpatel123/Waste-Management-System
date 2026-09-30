import { useEffect, useState } from 'react';
import { animate } from 'framer-motion';

export default function CountUp({ to = 0, suffix = '' }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const c = animate(0, to, { duration: 1.2, onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [to]);
  return <>{v}{suffix}</>;
}
