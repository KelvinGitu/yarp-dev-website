import Head from 'next/head';
import Link from 'next/link';
import { apps } from '@/data/apps';

export default function NotFound() {
  return (
    <>
      <Head>
        <title>Page not found · Yarp Developers</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="notfound">
        <p className="notfound-code">404</p>
        <h1 className="notfound-title">This page doesn&apos;t exist.</h1>
        <p className="notfound-body">
          The link may be out of date, or the page may have moved. Everything that is
          here is listed below.
        </p>

        <nav className="notfound-links" aria-label="Apps">
          {apps.map((app) => (
            <Link key={app.slug} href={`/apps/${app.slug}`}>
              {app.name}
            </Link>
          ))}
        </nav>

        <div className="notfound-actions">
          <Link href="/" className="detail-btn-legal">← Home</Link>
          <Link href="/support" className="detail-btn-legal">Support</Link>
        </div>
      </div>
    </>
  );
}
