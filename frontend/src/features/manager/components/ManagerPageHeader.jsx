export default function ManagerPageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="mb-unit-lg flex flex-wrap items-start justify-between gap-unit-md">
      <div>
        {eyebrow && <p className="mb-unit-xs font-label-md uppercase tracking-wider text-primary">{eyebrow}</p>}
        <h3 className="font-headline-md text-headline-md font-extrabold text-on-surface">{title}</h3>
        {description && <p className="mt-unit-xs max-w-3xl text-body-sm text-on-surface-variant">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-unit-sm">{actions}</div>}
    </div>
  );
}
