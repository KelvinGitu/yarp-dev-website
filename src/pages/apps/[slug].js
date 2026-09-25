import Head from 'next/head';
import Link from 'next/link';
import { apps } from '@/data/apps';
import AppIcon from '@/components/AppIcon';
import CtaBand from '@/components/CtaBand';
import SectionHead from '@/components/SectionHead';
import { PlayIcon, GlobeIcon } from '@/components/icons';

// Where to get the app: Google Play when it's live, the web version when there is one.
function GetButtons({ app }) {
  return (
    <>
      {app.playUrl && app.status === 'live' && (
        <a href={app.playUrl} target="_blank" rel="noopener noreferrer" className="store-btn store-btn-primary">
          <PlayIcon />
          <span className="store-btn-main">Get it on Google Play</span>
        </a>
      )}
      {app.webUrl && (
        <a href={app.webUrl} target="_blank" rel="noopener noreferrer" className="store-btn">
          <GlobeIcon />
          <span className="store-btn-main">Open the web app</span>
        </a>
      )}
    </>
  );
}

// The description under the headline. Some descriptions open with the tagline
// (the headline), so that part is dropped rather than said twice.
function lede(app) {
  const tagline = app.tagline.replace(/\.$/, '');
  if (!app.description.startsWith(tagline)) return app.description;
  const rest = app.description.slice(tagline.length).replace(/^[\s.,:;—–-]+/, '');
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

// One mobile app: what it is, its screens, what it does, the engineering story
// behind it, and where to get it.
export default function AppDetail({ app }) {
  if (!app) return <div className="prose"><p>App not found.</p></div>;
  const intro = lede(app);

  return (
    <>
      <Head>
        <title>{app.name} · Yarp Developers</title>
        <meta name="description" content={app.tagline} />
      </Head>

      <div className="page app-detail">
        <header className="page-hero">
          <p className="page-eyebrow">
            <span className="project-icon"><AppIcon slug={app.slug} name={app.name} size={36} /></span>
            <span className="page-eyebrow-name">{app.name}</span>
            <span className="detail-release">v{app.version} · {app.builds} builds</span>
          </p>
          <h1 className="page-title">{app.tagline}</h1>
          {intro && <p className="page-lede">{intro}</p>}
          <div className="store-actions">
            <GetButtons app={app} />
          </div>
        </header>

        {app.shots?.length > 0 && (
          <div className={`shot-strip shot-strip-${app.shots.length}`}>
            {app.shots.map((file, i) => (
              <div key={file} className="shot">
                <img src={`/assets/shots/${app.slug}/${file}`} alt={`${app.name} screen ${i + 1}`} width={420} height={909} />
              </div>
            ))}
          </div>
        )}

        <section className="detail-section">
          <SectionHead eyebrow="Features" title="What it does" />
          <ul className="card-grid">
            {app.features.map((f) => (
              <li key={f} className="card-grid-item">
                <h3 className="card-title">{f}</h3>
              </li>
            ))}
          </ul>
        </section>

        {/* The one engineering story worth telling (apps.js `note`). */}
        {app.note && (
          <section className="store-promise app-note">
            <p className="detail-section-title">Behind it · {app.note.kind}</p>
            <p className="app-note-text">{app.note.text}</p>
          </section>
        )}

        <section className="detail-section">
          <SectionHead eyebrow="Stack" title="Built with" />
          <ul className="project-stack app-stack">
            {app.stack.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>

        {app.webUrl && (app.hasPurchases || app.hasAds) && (
          <div className="detail-note">
            <strong>Note for web users:</strong> In-app purchases and certain features are optimised for the mobile app. To buy credits or upgrade, open the app on your phone.
          </div>
        )}
        {app.hasMic && (
          <div className="detail-note detail-note-warning">
            <strong>Note:</strong> This app requires microphone access and is primarily designed for mobile devices.
          </div>
        )}

        <CtaBand title={`Try ${app.name}`} text={app.webUrl ? 'On Google Play, or right in your browser.' : 'On Google Play.'}>
          <GetButtons app={app} />
        </CtaBand>

        <div className="detail-back">
          <Link href="/#apps" className="detail-back-link">← All apps</Link>
          <span className="store-legal">
            <Link href={`/privacy/${app.packageId}`}>Privacy Policy</Link> · <Link href={`/terms/${app.packageId}`}>Terms of Service</Link>
          </span>
        </div>
      </div>
    </>
  );
}

export async function getStaticPaths() {
  return {
    paths: apps.map((app) => ({ params: { slug: app.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const app = apps.find((a) => a.slug === params.slug) ?? null;
  return { props: { app } };
}
