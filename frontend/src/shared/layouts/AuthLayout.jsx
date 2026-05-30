import Footer from '../components/navigation/Footer.jsx';
import Navbar from '../components/navigation/Navbar.jsx';

export default function AuthLayout({ children, navbarProps = {} }) {
  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_right,#ecfeff_0%,#ffffff_45%,#cffafe_100%)] text-slate-950">
      <Navbar {...navbarProps} />
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">{children}</main>
      <Footer compact />
    </div>
  );
}
