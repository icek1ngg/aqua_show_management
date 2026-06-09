export default function ManagerTable({ children, className = '' }) {
  return <div className={`overflow-hidden rounded-lg border border-outline-variant/20 bg-surface shadow-sm ${className}`}>{children}</div>;
}
