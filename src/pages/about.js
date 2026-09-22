import Head from 'next/head';
import Link from 'next/link';
import { apps } from '@/data/apps';
import { GitHubIcon, PlayIcon, LinkedInIcon, XIcon } from '@/components/icons';

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

const totalBuilds = apps.reduce((sum, app) => sum + app.builds, 0);

export default function About() {
  return (
    <>
      <Head>
        <title>About · Yarp Developers</title>
        <meta
          name="description"
          content="Yarp Developers is a small studio building mobile and desktop apps end to end."
        />
      </Head>

      <div className="about">
        <header className="about-head">
          <h1>About</h1>
          <p>
            Yarp Developers is a small studio run by Kelvin Gitu — {apps.length}{' '}
            Flutter apps live on Google Play, and a handful of Windows desktop apps in the store. We build every part of them
            ourselves: interface, Firestore schema, Cloud Functions, subscription plumbing, and the store
            listing that gets rejected and resubmitted until it isn&apos;t.
          </p>
          <p>
            Our background is in mechatronic engineering, which taught us less about code than about the
            distance between building something and keeping it alive. A feature is an afternoon&apos;s
            work. Keeping it running for real users, on someone else&apos;s billing account, under someone
            else&apos;s review policy, is the actual work — and it&apos;s what these projects are really
            about. {totalBuilds}{' '}releases so far.
          </p>

          <ul className="socials">
            {SOCIALS.map(({ href, label, Icon }) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                  <Icon />
                </a>
              </li>
            ))}
          </ul>
        </header>

        <section className="section">
          <h2 className="section-label">Stack</h2>
          <dl className="stack-groups">
            {techGroups.map((group) => (
              <div key={group.label} className="stack-group">
                <dt>{group.label}</dt>
                <dd>{group.items.join(' · ')}</dd>
              </div>
            ))}
          </dl>

          <div className="contact">
            <p>
              Available for mobile and web work. Reach us at{' '}
              <a href="mailto:gitukelvin01@gmail.com">gitukelvin01@gmail.com</a>.
            </p>
            <p className="contact-secondary">
              Using one of the apps and something is broken? That goes to{' '}
              <Link href="/support">support</Link> instead.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
