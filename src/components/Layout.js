import Link from 'next/link';

// One shell for every page, homepage included: a fixed navbar (Home, Store, About)
// over a single scrolling column, so the site reads as a studio with a product
// front and center rather than a personal portfolio with a sidebar bio.
export default function Layout({ children, className = '' }) {
  return (
    <div className={`layout-container ${className}`}>
      <header className="navbar">
        <div className="nav-content">
          <Link href="/" className="logo">
            <div className="logo-mark">YD</div>
            <div className="logo-label">
              <span className="logo-name">Yarp Developers</span>
              <span className="logo-sub">Mobile &amp; desktop apps</span>
            </div>
          </Link>
          <nav className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/store" className="nav-cta">Store</Link>
            <Link href="/about">About</Link>
          </nav>
        </div>
      </header>

      <main className="main-content">{children}</main>

      <footer className="footer">
        <div className="footer-content">
          <p suppressHydrationWarning>© {new Date().getFullYear()} Yarp Developers</p>
          <Link href="/support">Support</Link>
        </div>
      </footer>
    </div>
  );
}
