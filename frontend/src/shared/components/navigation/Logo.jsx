export default function Logo({ variant = 'default', className = '' }) {
  const isFooter = variant === 'footer';

  return (
    <a
      className={[
        'group inline-flex items-center gap-2 font-bold tracking-tight transition-colors',
        isFooter ? 'text-cyan-200 hover:text-white' : 'text-cyan-800 hover:text-teal-700',
        className,
      ].join(' ')}
      href="#"
      aria-label="AquaPulse home"
    >
      <span
        className={[
          'flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-transform group-hover:scale-105',
          isFooter
            ? 'bg-cyan-300/15 text-cyan-200 ring-1 ring-white/15'
            : 'bg-gradient-to-br from-cyan-400 to-teal-700 text-white shadow-cyan-700/20',
        ].join(' ')}
        aria-hidden="true"
      >
        <svg className="h-6 w-6" viewBox="0 0 32 32" fill="none" role="img">
          <path
            d="M5 17.2c3.1-4.8 6.7-7.2 10.8-7.2 4.2 0 7.8 2.4 11.2 7.2-2.3-.9-4.4-.7-6.5.5-1.8 1-3.3 1.5-4.6 1.5-1.4 0-2.9-.5-4.6-1.5-2-1.2-4.1-1.4-6.3-.5Z"
            fill="currentColor"
            opacity="0.95"
          />
          <path
            d="M6.5 21.8c1.9-.8 3.8-.7 5.8.4 1.5.8 2.7 1.2 3.7 1.2 1 0 2.2-.4 3.7-1.2 2-1.1 3.9-1.2 5.8-.4-1.9 2.1-4 3.2-6.3 3.2-1.1 0-2.2-.3-3.2-.9-1 .6-2.1.9-3.2.9-2.3 0-4.4-1.1-6.3-3.2Z"
            fill="currentColor"
            opacity="0.72"
          />
        </svg>
      </span>
      <span className="text-xl sm:text-2xl">AquaPulse</span>
    </a>
  );
}
