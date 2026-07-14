import { Link } from 'react-router-dom';

import { useCart } from './CartContext.jsx';

export default function CartBadge({ className = '', onClick }) {
  const { totalQuantity } = useCart();

  return (
    <Link
      className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-cyan-100 bg-white/80 text-cyan-800 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 ${className}`}
      to="/bookings/create"
      aria-label={`Cart with ${totalQuantity} ticket${totalQuantity === 1 ? '' : 's'}`}
      onClick={onClick}
    >
      <span className="material-symbols-outlined" aria-hidden="true">shopping_cart</span>
      {totalQuantity > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-teal-600 px-1.5 py-0.5 text-center text-[11px] font-black leading-4 text-white shadow-sm">
          {totalQuantity}
        </span>
      ) : null}
    </Link>
  );
}
