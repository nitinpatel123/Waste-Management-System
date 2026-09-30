import { initials } from '../utils';

export default function Avatar({ name, size = 36, className = '' }) {
  return (
    <span
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.38) }}
      className={`rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 text-[#03110c] font-bold flex items-center justify-center shrink-0 select-none ${className}`}
    >
      {initials(name)}
    </span>
  );
}
