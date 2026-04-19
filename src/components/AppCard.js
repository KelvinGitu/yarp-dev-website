import { useState } from 'react';
import Link from 'next/link';

function AppIcon({ slug, name }) {
  const [error, setError] = useState(false);
  if (error) return <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', color: 'var(--gold)' }}>{name.charAt(0)}</span>;
  return <img src={`/assets/icons/${slug}.png`} alt={name} onError={() => setError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
}

export default function AppCard({ app }) {
  const previewFeatures = app.features.slice(0, 3);

  return (
    <div className="app-card">
      <div className="app-card-top">
        <div className="app-icon">
          <AppIcon slug={app.slug} name={app.name} />
        </div>
        <div className="app-meta">
          <div className="app-name">{app.name}</div>
          <div className="app-badges">
            {app.status === 'live' && <span className="badge badge-play">Play Store</span>}
            {app.webUrl && <span className="badge badge-web">Web</span>}
          </div>
        </div>
      </div>

      <p className="app-tagline">{app.tagline}</p>

      <div className="app-features">
        {previewFeatures.map((f) => (
          <span key={f} className="feature-chip">{f}</span>
        ))}
      </div>

      <div className="app-card-footer">
        <div className="app-stack">
          <div className="stack-dot" title={app.stack[0]} />
          <div className="stack-dot" title={app.stack[1]} />
          <div className="stack-dot" title={app.stack[2]} />
        </div>
        <Link href={`/apps/${app.slug}`} className="app-link">
          View app <span>→</span>
        </Link>
      </div>
    </div>
  );
}
