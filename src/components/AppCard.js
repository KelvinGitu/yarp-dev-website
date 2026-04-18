import Link from 'next/link';

export default function AppCard({ app }) {
  // Try to load the icon using the slug, with a fallback if none provided
  const iconPath = `/assets/icons/${app.slug}.png`;

  return (
    <div className="app-card">
      <div className="app-header">
        <div className="app-icon">
          <img src={iconPath} alt={app.name} onError={(e) => {
            // Fallback placeholder logic
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML = app.name.charAt(0);
          }} />
        </div>
        <div className="app-info">
          <h3>{app.name}</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {app.status === 'live' && <span className="badge live">Play Store</span>}
            {app.webUrl && <span className="badge web">Web App</span>}
          </div>
        </div>
      </div>
      <p>{app.tagline}</p>
      <div className="card-footer">
        <Link href={`/apps/${app.slug}`} className="btn" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
          Learn More
        </Link>
      </div>
    </div>
  );
}
