export default function ManagerStatCard({ icon, label, value, tone = 'primary', helper, note }) {
  const toneClass = {
    primary: 'border-primary text-primary bg-primary/10',
    secondary: 'border-secondary text-secondary bg-secondary/10',
    tertiary: 'border-tertiary text-tertiary bg-tertiary/10',
    neutral: 'border-outline text-on-surface bg-surface-container-high',
    error: 'border-error text-error bg-error/10',
  }[tone] || 'border-primary text-primary bg-primary/10';

  const [borderClass, ...iconClasses] = toneClass.split(' ');

  return (
    <div className={`glass-card rounded-lg border-l-4 p-unit-lg shadow-sm ${borderClass}`}>
      <div className="mb-unit-md flex items-start justify-between gap-unit-md">
        {icon && <span className={`material-symbols-outlined rounded-lg p-unit-sm ${iconClasses.join(' ')}`}>{icon}</span>}
        {note && <span className="text-label-md font-bold text-on-surface-variant">{note}</span>}
      </div>
      <p className="font-label-lg text-label-lg uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-unit-xs font-headline-lg text-headline-lg text-on-surface">{value}</p>
      {helper && <p className="mt-unit-xs text-label-md text-on-surface-variant">{helper}</p>}
    </div>
  );
}
