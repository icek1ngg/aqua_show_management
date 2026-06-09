import AdminHeader from './AdminHeader.jsx';
import AdminSidebar from './AdminSidebar.jsx';

export default function AdminLayout({
  children,
  className = 'min-h-screen',
  contentClassName = 'p-unit-lg',
  headerActions,
  headerDescription,
  headerTitle,
}) {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <AdminSidebar />
      <main className={`ml-sidebar-width ${className}`}>
        {headerTitle && <AdminHeader title={headerTitle} description={headerDescription} actions={headerActions} />}
        <div className={contentClassName}>{children}</div>
      </main>
    </div>
  );
}
