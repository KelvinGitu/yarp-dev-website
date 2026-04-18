import Link from 'next/link';

export default function Layout({ children }) {
  return (
    <div className="layout-container">
      <header className="navbar">
        <div className="nav-content">
          <Link href="/" className="logo">
            <div className="logo-mark">YD</div>
            <div className="logo-label">
              <span className="logo-name">Yarp Developers</span>
              <span className="logo-sub">Nairobi, Kenya</span>
            </div>
          </Link>
          <nav className="nav-links">
            <Link href="/">Apps</Link>
            <Link href="/support" className="nav-cta">Contact</Link>
          </nav>
        </div>
      </header>

      <main className="main-content">
        {children}
      </main>

      <footer className="footer">
        <div className="footer-content">
          <p>© {new Date().getFullYear()} Yarp Developers · Built by Kelvin Gitu</p>
          <Link href="/support">Support</Link>
        </div>
      </footer>
    </div>
  );
}
