export default function ManagerHeader({ title, description, actions }) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-outline-variant/20 bg-surface/70 px-unit-lg py-unit-sm shadow-sm backdrop-blur-md">
      <div>
        <h2 className="font-headline-md text-headline-md font-extrabold text-primary">{title}</h2>
        {description && <div className="hidden text-body-sm text-on-surface-variant lg:block">{description}</div>}
      </div>
      {actions && <div className="flex items-center gap-unit-md">{actions}</div>}
    </header>
  );
}
