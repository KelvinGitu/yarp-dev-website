import Link from 'next/link';
import { useRouter } from 'next/router';

// The site's own sections, in nav order. `match` says which routes count as
// being in that section, so its link is marked as the current page.
const SECTIONS = [
  { href: '/', label: 'Home', className: 'nav-home', match: (p) => p === '/' || p.startsWith('/apps/') },
  { href: '/store', label: 'Store', match: (p) => p.startsWith('/store') },
  { href: '/guides', label: 'Guides', match: (p) => p.startsWith('/guides') },
];

// One shell for every page, homepage included: a fixed navbar (Home, Store,
// Guides, About) over a single scrolling column, so the site reads as a studio
// with a product front and center rather than a personal portfolio with a sidebar bio.
export default function Layout({ children, className = '' }) {
  const { pathname } = useRouter();
  const navLink = ({ href, label, className: linkClass = '', match = (p) => p === href }) => {
    const current = match(pathname);
    return (
      <Link
        key={href}
        href={href}
        className={`${linkClass} ${current ? 'nav-current' : ''}`.trim() || undefined}
        aria-current={current ? 'page' : undefined}
      >
        {label}
      </Link>
    );
  };

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
            {SECTIONS.map(navLink)}
            {navLink({ href: '/about', label: 'About' })}
          </nav>
        </div>
      </header>

      <main className="main-content">{children}</main>

      <footer className="footer">
        <div className="footer-content">
          <p suppressHydrationWarning>© {new Date().getFullYear()} Yarp Developers</p>
          <nav className="footer-links">
            <Link href="/guides">Guides</Link>
            <Link href="/support">Support</Link>
            <Link href="/privacy">Privacy</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
