import Footer from '../components/navigation/Footer.jsx';
import Navbar from '../components/navigation/Navbar.jsx';

export default function MainLayout({ children, navbarProps = {}, showNavbar = true }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-cyan-50 via-white to-cyan-50 text-slate-950">
      {showNavbar && <Navbar {...navbarProps} />}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
