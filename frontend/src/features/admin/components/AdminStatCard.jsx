export default function AdminStatCard({ icon, label, value, tone = 'primary' }) {
  const toneClass = {
    primary: 'border-primary text-primary bg-primary/10',
    secondary: 'border-secondary text-secondary bg-secondary/10',
    tertiary: 'border-tertiary text-tertiary bg-tertiary/10',
    error: 'border-error text-error bg-error/10',
  }[tone] || 'border-primary text-primary bg-primary/10';

  const [borderClass, ...iconClasses] = toneClass.split(' ');

  return (
    <div className={`glass-card rounded-lg border-l-4 p-unit-lg shadow-sm ${borderClass}`}>
      <div className="mb-unit-md flex items-start justify-between">
        <span className={`material-symbols-outlined rounded-lg p-unit-sm ${iconClasses.join(' ')}`}>{icon}</span>
      </div>
      <h3 className="font-label-lg text-label-lg text-on-surface-variant">{label}</h3>
      <p className="mt-unit-xs font-headline-md text-headline-md text-on-surface">{value}</p>
    </div>
  );
}
