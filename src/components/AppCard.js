import Link from 'next/link';

export default function AppCard({ app }) {
  const iconPath = `/assets/icons/${app.slug}.png`;
  const previewFeatures = app.features.slice(0, 3);

  return (
    <div className="app-card">
      <div className="app-card-top">
        <div className="app-icon">
          <img
            src={iconPath}
            alt={app.name}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `<span style="font-family:var(--font-display);font-weight:800;font-size:1.2rem;color:var(--gold)">${app.name.charAt(0)}</span>`;
            }}
          />
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
