import Link from 'next/link';
import { useRouter } from 'next/router';
import PortfolioSidebar from '@/components/PortfolioSidebar';

// The homepage is the portfolio: sticky sidebar, one scrolling column, no chrome.
// Everything else — app detail, support, privacy, terms — keeps the site shell so
// those pages stay navigable on their own.
export default function Layout({ children, className = '' }) {
  const { pathname } = useRouter();
  const isPortfolio = pathname === '/';

  if (isPortfolio) {
    return (
      <div className={`portfolio ${className}`}>
        <PortfolioSidebar />
        <main className="portfolio-main">{children}</main>
      </div>
    );
  }

  return (
    <div className={`layout-container ${className}`}>
      <header className="navbar">
        <div className="nav-content">
          <Link href="/" className="logo">
            <div className="logo-mark">KG</div>
            <div className="logo-label">
              <span className="logo-name">Kelvin Gitu</span>
              <span className="logo-sub">Yarp Developers</span>
            </div>
          </Link>
          <nav className="nav-links">
            <Link href="/#projects">Projects</Link>
            <Link href="/support" className="nav-cta">Support</Link>
          </nav>
        </div>
      </header>

      <main className="main-content">{children}</main>

      <footer className="footer">
        <div className="footer-content">
          <p suppressHydrationWarning>
            © {new Date().getFullYear()} Yarp Developers · Built by Kelvin Gitu
          </p>
          <Link href="/support">Support</Link>
        </div>
      </footer>
    </div>
  );
}
