import Link from 'next/link';
import AppIcon from '@/components/AppIcon';

// A mobile app on the home page, at a glance: what it is, how far it's come,
// what it's built with, and where to get it. The screenshots and the story
// behind it are on the app's own page.
export default function ProjectCard({ app }) {
  return (
    <article className="project">
      <header className="project-head">
        <div className="project-icon">
          <AppIcon slug={app.slug} name={app.name} />
        </div>
        <div className="project-head-text">
          <h3 className="project-name">
            <Link href={`/apps/${app.slug}`}>{app.name}</Link>
          </h3>
          <p className="project-tagline">{app.tagline}</p>
        </div>
      </header>

      <p className="project-release" title={`${app.packageId} — version ${app.version}, build ${app.builds}`}>
        v{app.version} · {app.builds} builds
      </p>

      <ul className="project-stack">
        {app.stack.map((tech) => (
          <li key={tech}>{tech}</li>
        ))}
      </ul>

      <footer className="project-links">
        {app.playUrl && app.status === 'live' && (
          <a href={app.playUrl} target="_blank" rel="noopener noreferrer">
            Google Play <span aria-hidden="true">↗</span>
          </a>
        )}
        {app.webUrl && (
          <a href={app.webUrl} target="_blank" rel="noopener noreferrer">
            Web app <span aria-hidden="true">↗</span>
          </a>
        )}
        <Link href={`/apps/${app.slug}`}>
          Screens and details <span aria-hidden="true">→</span>
        </Link>
      </footer>
    </article>
  );
}
