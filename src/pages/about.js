import Head from 'next/head';
import Link from 'next/link';
import { apps } from '@/data/apps';
import CtaBand from '@/components/CtaBand';
import SectionHead from '@/components/SectionHead';
import StatRow from '@/components/StatRow';
import { GitHubIcon, MailIcon, PlayIcon, LinkedInIcon, XIcon } from '@/components/icons';
import { SALES_EMAIL, studioStats } from '@/data/studio';

const LINKEDIN_URL = 'https://www.linkedin.com/in/kelvin-gitu-587696152/';
const X_URL = 'https://x.com/GituKelvin';

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

const techGroups = [
  { label: 'Mobile', items: ['Flutter', 'Dart', 'Riverpod', 'Go Router', 'Hive'] },
  { label: 'Backend', items: ['Firebase', 'Firestore', 'Cloud Functions', 'Cloud Monitoring'] },
  { label: 'AI', items: ['Google Gemini', 'Vertex AI'] },
  { label: 'Revenue', items: ['RevenueCat', 'AdMob', 'in_app_purchase'] },
  { label: 'Web & CI', items: ['Next.js', 'Firebase Hosting', 'GitHub Actions', 'Codemagic'] },
];

// A note's first sentence, for the card; the whole story is on the app's page.
const firstSentence = (text) => text.match(/^.*?[.!?](\s|$)/)?.[0].trim() ?? text;

function Socials() {
  return (
    <ul className="socials">
      {SOCIALS.map(({ href, label, Icon }) => (
        <li key={label}>
          <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
            <Icon />
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function About() {
  const totalBuilds = apps.reduce((sum, app) => sum + app.builds, 0);

  return (
    <>
      <Head>
        <title>About · Yarp Developers</title>
        <meta
          name="description"
          content="Yarp Developers is a small studio building mobile and desktop apps end to end."
        />
      </Head>

      <div className="page about">
        <header className="page-hero">
          <p className="detail-section-title">About</p>
          <h1 className="page-title">A small studio that builds apps and keeps them running.</h1>
          <p className="page-lede">
            Yarp Developers is run by Kelvin Gitu: {apps.length}{' '}Flutter apps live on Google Play, and a handful of
            Windows desktop apps in the store. We build every part of them ourselves — interface, Firestore schema,
            Cloud Functions, subscription plumbing, and the store listing that gets rejected and resubmitted until
            it isn&apos;t.
          </p>
          <Socials />
          <StatRow stats={studioStats()} />
        </header>

        <section className="detail-section">
          <SectionHead eyebrow="The story" title="Building is an afternoon. Keeping it alive is the work." />
          <div className="about-story">
            <p>
              Our background is in mechatronic engineering, which taught us less about code than about the
              distance between building something and keeping it alive. A feature is an afternoon&apos;s
              work. Keeping it running for real users, on someone else&apos;s billing account, under someone
              else&apos;s review policy, is the actual work — and it&apos;s what these projects are really
              about. {totalBuilds}{' '}releases so far.
            </p>
            <p className="about-sign">— Kelvin Gitu</p>
          </div>
        </section>

        {/* Proof, from the apps' own engineering notes (apps.js). */}
        <section className="detail-section">
          <SectionHead eyebrow="How we work" title="What keeping it running looks like" />
          <ul className="card-grid card-grid-2">
            {apps.filter((a) => a.note).map((a) => (
              <li key={a.slug} className="card-grid-item note-card">
                <p className="note-card-kind">{a.note.kind} · {a.name}</p>
                <p className="card-text">{firstSentence(a.note.text)}</p>
                <Link href={`/apps/${a.slug}`} className="note-card-link">The whole story →</Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="detail-section">
          <SectionHead eyebrow="Stack" title="What we work with" />
          <ul className="card-grid">
            {techGroups.map((group) => (
              <li key={group.label} className="card-grid-item">
                <h3 className="card-title">{group.label}</h3>
                <p className="card-text">{group.items.join(' · ')}</p>
              </li>
            ))}
          </ul>
        </section>

        <CtaBand title="Work with us" text="Available for mobile and web work.">
          <a href={`mailto:${SALES_EMAIL}`} className="store-btn store-btn-primary">
            <MailIcon />
            <span className="store-btn-main">{SALES_EMAIL}</span>
          </a>
        </CtaBand>
        <p className="page-text about-support">
          Using one of the apps and something is broken? That goes to <Link href="/support">support</Link> instead.
        </p>
      </div>
    </>
  );
}
