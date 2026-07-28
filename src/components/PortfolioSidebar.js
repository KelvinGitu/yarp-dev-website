import { useEffect, useState } from 'react';
import { GitHubIcon, PlayIcon, LinkedInIcon, XIcon } from '@/components/icons';

// Empty string = the link is not rendered.
const LINKEDIN_URL = 'https://www.linkedin.com/in/kelvin-gitu-587696152/';
const X_URL = 'https://x.com/GituKelvin';

const SECTIONS = [
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Projects' },
  { id: 'stack', label: 'Stack' },
];

const SOCIALS = [
  { href: 'https://github.com/KelvinGitu', label: 'GitHub', Icon: GitHubIcon },
  {
    href: 'https://play.google.com/store/apps/developer?id=Yarp+Developers',
    label: 'Google Play',
    Icon: PlayIcon,
  },
  { href: LINKEDIN_URL, label: 'LinkedIn', Icon: LinkedInIcon },
  { href: X_URL, label: 'X', Icon: XIcon },
].filter((s) => s.href);

export default function PortfolioSidebar() {
  const [active, setActive] = useState('about');

  useEffect(() => {
    const nodes = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean);
    if (!nodes.length) return;

    // The observer is only the trigger — the active section is recomputed from
    // live positions each time, so the highlight can't go stale when a section is
    // taller than the viewport or when the page bottoms out mid-section.
    const pick = () => {
      const line = window.innerHeight * 0.3;
      let current = nodes[0];
      for (const node of nodes) {
        if (node.getBoundingClientRect().top <= line) current = node;
      }
      // At the very bottom the last section is active even if it never crosses
      // the line — there is no more scrolling left to bring it up.
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      setActive((atBottom ? nodes[nodes.length - 1] : current).id);
    };

    const observer = new IntersectionObserver(pick, {
      threshold: [0, 0.25, 0.5, 0.75, 1],
    });

    nodes.forEach((n) => observer.observe(n));
    window.addEventListener('scroll', pick, { passive: true });
    pick();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', pick);
    };
  }, []);

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-identity">
          <h1 className="sidebar-name">Kelvin Gitu</h1>
          <p className="sidebar-role">Mobile &amp; Web Developer</p>
          <p className="sidebar-tagline">
            I build and ship mobile apps end to end — interface, backend, billing, and the
            Play Store review that comes after.
          </p>
        </div>

        <nav className="sidebar-nav" aria-label="Sections">
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={`sidebar-nav-link${active === section.id ? ' is-active' : ''}`}
              aria-current={active === section.id ? 'true' : undefined}
            >
              <span className="sidebar-nav-rule" aria-hidden="true" />
              <span className="sidebar-nav-label">{section.label}</span>
            </a>
          ))}
        </nav>
      </div>

      <ul className="sidebar-socials">
        {SOCIALS.map(({ href, label, Icon }) => (
          <li key={label}>
            <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
              <Icon />
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
