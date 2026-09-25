import Head from 'next/head';
import Link from 'next/link';
import { apps } from '@/data/apps';
import AppIcon from '@/components/AppIcon';
import SectionHead from '@/components/SectionHead';
import { MailIcon, PlayIcon } from '@/components/icons';
import { SUPPORT_EMAIL, products } from '@/data/products';
import { FEEDBACK_EMAIL } from '@/data/studio';

const mailAbout = (name) => `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`${name} support request`)}`;

// One app's card: its name, an email already addressed to us about it, and
// the links people come to support looking for.
function SupportCard({ slug, name, sub, children }) {
  return (
    <li className="support-app">
      <div className="support-app-head">
        <div className="project-icon">
          <AppIcon slug={slug} name={name} />
        </div>
        <div className="support-app-text">
          <h3>{name}</h3>
          <p className="support-package">{sub}</p>
        </div>
      </div>
      <a className="support-app-mail" href={mailAbout(name)}>Email about {name}</a>
      <div className="support-app-links">{children}</div>
    </li>
  );
}

export default function Support() {
  return (
    <>
      <Head>
        <title>Support · Yarp Developers</title>
        <meta name="description" content="Help and support for Yarp Developers apps." />
      </Head>

      <div className="page support">
        <header className="page-hero">
          <p className="detail-section-title">Support</p>
          <h1 className="page-title">How can we help?</h1>
          <p className="page-lede">
            Something broken, a billing question, or a privacy request — email us and
            we&apos;ll get back to you. Say which app you&apos;re using and what happened.
          </p>
          <div className="store-actions">
            <a className="store-btn store-btn-primary" href={`mailto:${SUPPORT_EMAIL}`}>
              <MailIcon />
              <span className="store-btn-main">{SUPPORT_EMAIL}</span>
            </a>
          </div>
        </header>

        <section className="detail-section">
          <SectionHead eyebrow="Quick answers" title="Before you write" />
          <div className="store-faq">
            <details>
              <summary>I lost my licence key.</summary>
              <p>
                Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> from the address you bought with, and
                we’ll send it again.
              </p>
            </details>
            <details>
              <summary>Can I get a refund on a desktop app?</summary>
              <p>
                Yes. If it doesn’t work for you, email us within 30 days of buying and we’ll refund you in full. See
                the <Link href="/store/terms">licence terms</Link>.
              </p>
            </details>
            <details>
              <summary>I have an idea, or a feature I’d like to see.</summary>
              <p>
                We’d love to hear it: write to <a href={`mailto:${FEEDBACK_EMAIL}`}>{FEEDBACK_EMAIL}</a>. Say which
                app it’s for.
              </p>
            </details>
            <details>
              <summary>I have a privacy or data request.</summary>
              <p>
                Email us and say which app it’s about. Each app’s privacy policy, linked below, explains what it
                collects.
              </p>
            </details>
          </div>
        </section>

        <section className="detail-section">
          <SectionHead eyebrow="Mobile apps" title="Help with an app from Google Play" />
          <ul className="support-list">
            {apps.map((app) => (
              <SupportCard key={app.slug} slug={app.slug} name={app.name} sub={app.packageId}>
                <Link href={`/privacy/${app.packageId}`}>Privacy Policy</Link>
                <Link href={`/terms/${app.packageId}`}>Terms of Service</Link>
                {app.playUrl && (
                  <a href={app.playUrl} target="_blank" rel="noopener noreferrer">
                    <span className="support-play-icon"><PlayIcon /></span>
                    Google Play
                  </a>
                )}
              </SupportCard>
            ))}
          </ul>
        </section>

        <section className="detail-section">
          <SectionHead eyebrow="Desktop apps" title="Help with a desktop app" />
          <ul className="support-list">
            {products.map((p) => (
              <SupportCard key={p.slug} slug={p.slug} name={p.name} sub={`v${p.version}`}>
                <Link href={`/store/${p.slug}`}>Download and questions</Link>
                <Link href="/store/privacy">Privacy</Link>
                <Link href="/store/terms">Licence terms</Link>
              </SupportCard>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
