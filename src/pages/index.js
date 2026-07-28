import Head from 'next/head';
import Link from 'next/link';
import { apps } from '@/data/apps';
import ProjectCard from '@/components/ProjectCard';

const techGroups = [
  { label: 'Mobile', items: ['Flutter', 'Dart', 'Riverpod', 'Go Router', 'Hive'] },
  { label: 'Backend', items: ['Firebase', 'Firestore', 'Cloud Functions', 'Cloud Monitoring'] },
  { label: 'AI', items: ['Google Gemini', 'Vertex AI'] },
  { label: 'Revenue', items: ['RevenueCat', 'AdMob', 'in_app_purchase'] },
  { label: 'Web & CI', items: ['Next.js', 'Firebase Hosting', 'GitHub Actions', 'Codemagic'] },
];

const totalBuilds = apps.reduce((sum, app) => sum + app.builds, 0);

export default function Home() {
  return (
    <>
      <Head>
        <title>Kelvin Gitu — Mobile &amp; Web Developer</title>
        <meta
          name="description"
          content="Flutter developer in Kenya. Five apps live on Google Play — built, shipped, and operated end to end."
        />
      </Head>

      <section id="about" className="section">
        <h2 className="section-label">About</h2>
        <div className="lede">
          <p>
            I&apos;m a Flutter developer in Kenya. I have five apps live on Google Play, and
            I built all of them alone — the interface, the Firestore schema behind it, the
            Cloud Functions, the subscription plumbing, and the store listing that gets
            rejected and resubmitted.
          </p>
          <p>
            My degree is in mechatronic engineering, which mostly taught me that shipping is
            the hard part. Writing a feature takes an afternoon. Keeping it running for real
            users, on someone else&apos;s billing account, under someone else&apos;s review
            policy, is the actual work — and it&apos;s the part these projects are really
            about. That&apos;s {totalBuilds} releases so far.
          </p>
        </div>
      </section>

      <section id="projects" className="section">
        <h2 className="section-label">Projects</h2>
        <div className="projects">
          {apps.map((app) => (
            <ProjectCard key={app.slug} app={app} />
          ))}
        </div>
      </section>

      <section id="stack" className="section">
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
            Available for mobile and web work. Reach me at{' '}
            <a href="mailto:gitukelvin01@gmail.com">gitukelvin01@gmail.com</a>.
          </p>
          <p className="contact-secondary">
            Using one of the apps and something is broken? That goes to{' '}
            <Link href="/support">support</Link> instead.
          </p>
        </div>
      </section>
    </>
  );
}
