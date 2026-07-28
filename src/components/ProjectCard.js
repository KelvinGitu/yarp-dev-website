import { useState } from 'react';
import Link from 'next/link';

function AppIcon({ slug, name }) {
  const [error, setError] = useState(false);
  if (error) return <span className="project-icon-fallback">{name.charAt(0)}</span>;
  return <img src={`/assets/icons/${slug}.png`} alt="" onError={() => setError(true)} />;
}

// Apps with no screenshots fall back to their icon on a tinted panel rather than
// leaving a hole in the layout.
function ShotStrip({ app }) {
  if (!app.shots?.length) {
    return (
      <div className="shot-strip shot-strip-empty" aria-hidden="true">
        <div className="shot-empty-mark">
          <AppIcon slug={app.slug} name={app.name} />
        </div>
      </div>
    );
  }

  return (
    <div className={`shot-strip shot-strip-${app.shots.length}`}>
      {app.shots.map((file, i) => (
        <div key={file} className="shot">
          <img
            src={`/assets/shots/${app.slug}/${file}`}
            alt={`${app.name} screen ${i + 1}`}
            width={420}
            height={909}
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}

export default function ProjectCard({ app }) {
  return (
    <article className="project">
      <header className="project-head">
        <div className="project-icon">
          <AppIcon slug={app.slug} name={app.name} />
        </div>
        <div className="project-head-text">
          <h3 className="project-name">{app.name}</h3>
          <p className="project-tagline">{app.tagline}</p>
        </div>
        <p className="release" title={`${app.packageId} — version ${app.version}, build ${app.builds}`}>
          <span className="release-version">v{app.version}</span>
          <span className="release-builds">{app.builds} builds</span>
        </p>
      </header>

      <ShotStrip app={app} />

      <ul className="project-stack">
        {app.stack.map((tech) => (
          <li key={tech}>{tech}</li>
        ))}
      </ul>

      {app.note && (
        <div className="project-note">
          <span className="project-note-kind">{app.note.kind}</span>
          <p>{app.note.text}</p>
        </div>
      )}

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
          Details <span aria-hidden="true">→</span>
        </Link>
      </footer>
    </article>
  );
}
