import Head from 'next/head';
import Link from 'next/link';
import { apps } from '@/data/apps';
import { useRouter } from 'next/router';

export default function AppDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const app = apps.find(a => a.slug === slug);

  if (!app) return <div className="prose"><p>App not found.</p></div>;

  const iconPath = `/assets/icons/${app.slug}.png`;

  return (
    <>
      <Head>
        <title>{app.name} - Yarp Developers</title>
      </Head>
      <div className="prose">
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '2rem' }}>
          <div className="app-icon" style={{ width: 120, height: 120, borderRadius: 24, fontSize: '3rem' }}>
            <img src={iconPath} alt={app.name} onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = app.name.charAt(0);
            }} />
          </div>
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>{app.name}</h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>{app.tagline}</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              {app.status === 'live' && <span className="badge live">Play Store</span>}
              {app.webUrl && <span className="badge web">Web App</span>}
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem', background: 'var(--bg-card)', borderRadius: '16px', marginBottom: '2rem' }}>
          <p>{app.description}</p>
        </div>

        <h2>Features</h2>
        <ul>
          {app.features.map((feature, i) => <li key={i}>{feature}</li>)}
        </ul>

        <h2>Tech Stack</h2>
        <div className="tech-stack" style={{ justifyContent: 'flex-start', marginBottom: '2rem' }}>
          {app.stack.map(tech => <span key={tech} className="tech-item" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>{tech}</span>)}
        </div>

        <h2>Legal & Links</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {app.playUrl && app.status === 'live' && (
            <a href={app.playUrl} target="_blank" rel="noopener noreferrer" className="btn">
              Get on Google Play
            </a>
          )}
          {app.webUrl && (
            <Link href={app.webUrl} className="btn secondary">
              Launch Web App
            </Link>
          )}
          <Link href={`/privacy/${app.packageId}`} className="btn secondary">Privacy Policy</Link>
          <Link href={`/terms/${app.packageId}`} className="btn secondary">Terms of Service</Link>
        </div>
        
        {app.webUrl && (app.hasPurchases || app.hasAds) && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', fontSize: '0.9rem' }}>
            <strong>Note for Web Users:</strong> In-app purchases and certain features are optimized for the mobile application. To buy credits or upgrade, please open the app on your phone.
          </div>
        )}
        {app.hasMic && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '8px', fontSize: '0.9rem' }}>
            <strong>Note:</strong> This app requires microphone access and is primarily designed for mobile devices.
          </div>
        )}
      </div>
    </>
  );
}

export async function getStaticPaths() {
  const paths = apps.map(app => ({
    params: { slug: app.slug }
  }));
  return { paths, fallback: false };
}

export async function getStaticProps() {
  return { props: {} };
}
