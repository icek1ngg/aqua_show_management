export default function ManagerActionBar({ children, className = '' }) {
  return (
    <div className={`mb-unit-lg flex flex-wrap items-center gap-unit-md rounded-lg border border-outline-variant/20 bg-surface-container-low p-unit-md ${className}`}>
      {children}
    </div>
  );
}
