import { Link } from 'react-router-dom';
import { Recycle } from 'lucide-react';

export default function Logo({ to = '/' }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 font-display font-bold text-lg">
      <span className="icon-tile !w-9 !h-9 !rounded-xl"><Recycle size={18} /></span>
      <span>Clean<span className="text-gradient">City</span></span>
    </Link>
  );
}
