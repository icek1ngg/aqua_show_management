import ManagerHeader from './ManagerHeader.jsx';
import ManagerSidebar from './ManagerSidebar.jsx';

export default function ManagerLayout({
  children,
  className = 'flex min-h-screen flex-col',
  contentClassName = 'flex-1 p-unit-lg',
  headerActions,
  headerDescription,
  headerTitle,
}) {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <ManagerSidebar />
      <main className={`ml-sidebar-width ${className}`}>
        {headerTitle && <ManagerHeader title={headerTitle} description={headerDescription} actions={headerActions} />}
        <div className={contentClassName}>{children}</div>
      </main>
    </div>
  );
}
