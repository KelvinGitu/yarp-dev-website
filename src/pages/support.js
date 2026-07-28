import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { apps } from '@/data/apps';
import { MailIcon, PlayIcon } from '@/components/icons';

const SUPPORT_EMAIL = 'yarpsports@gmail.com';

function AppIcon({ slug, name }) {
  const [error, setError] = useState(false);
  if (error) return <span className="project-icon-fallback">{name.charAt(0)}</span>;
  return <img src={`/assets/icons/${slug}.png`} alt="" onError={() => setError(true)} />;
}

export default function Support() {
  return (
    <>
      <Head>
        <title>Support · Yarp Developers</title>
        <meta name="description" content="Help and support for Yarp Developers apps." />
      </Head>

      <div className="support">
        <header className="support-head">
          <h1>Support</h1>
          <p>
            Something broken, a billing question, or a privacy request — email us and
            we&apos;ll get back to you. Say which app you&apos;re using and what happened.
          </p>
          <a className="support-email" href={`mailto:${SUPPORT_EMAIL}`}>
            <span className="support-email-icon"><MailIcon /></span>
            {SUPPORT_EMAIL}
          </a>
        </header>

        <h2 className="section-label support-section-label">Per app</h2>

        <ul className="support-list">
          {apps.map((app) => (
            <li key={app.slug} className="support-app">
              <div className="support-app-head">
                <div className="project-icon">
                  <AppIcon slug={app.slug} name={app.name} />
                </div>
                <div className="support-app-text">
                  <h3>{app.name}</h3>
                  <p className="support-package">{app.packageId}</p>
                </div>
                <a
                  className="support-app-mail"
                  href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`${app.name} support request`)}`}
                >
                  Email about {app.name}
                </a>
              </div>

              <div className="support-app-links">
                <Link href={`/privacy/${app.packageId}`}>Privacy Policy</Link>
                <Link href={`/terms/${app.packageId}`}>Terms of Service</Link>
                {app.playUrl && (
                  <a href={app.playUrl} target="_blank" rel="noopener noreferrer">
                    <span className="support-play-icon"><PlayIcon /></span>
                    Google Play
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
