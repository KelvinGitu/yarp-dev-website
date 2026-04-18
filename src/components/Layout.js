import Link from 'next/link';

export default function Layout({ children }) {
  return (
    <div className="layout-container">
      <header className="navbar">
        <div className="nav-content">
          <Link href="/">
            <h1 className="logo">Yarp <span>Developers</span></h1>
          </Link>
          <nav className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/support">Support</Link>
          </nav>
        </div>
      </header>

      <main className="main-content">
        {children}
      </main>

      <footer className="footer">
        <div className="footer-content">
          <p>© {new Date().getFullYear()} Yarp Developers. Built by Kelvin Gitu.</p>
          <div className="footer-links">
            <Link href="/support">Support / Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
