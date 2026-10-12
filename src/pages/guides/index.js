import Head from 'next/head';
import Link from 'next/link';
import { formatDate, guides, readingMinutes } from '@/data/guides';

export default function Guides() {
  return (
    <>
      <Head>
        <title>Guides · Yarp Developers</title>
        <meta
          name="description"
          content="Practical guides to signing PDFs, cleaning up signatures, writing resumes and keeping your documents private, from the people who build pdfsign, Ink Lifter and Resume Maker."
        />
        <link rel="canonical" href="https://yarpdevelopers.com/guides" />
      </Head>

      <div className="page guides">
        <header className="page-hero">
          <p className="detail-section-title">Guides</p>
          <h1 className="page-title">Getting everyday documents done, privately.</h1>
          <p className="page-lede">
            Step-by-step guides to the paperwork our apps were built for: signing PDFs, cleaning up a signature,
            writing a resume. Each one works whichever tool you use.
          </p>
        </header>

        <ul className="guide-list">
          {guides.map((g) => (
            <li key={g.slug} className="card-grid-item guide-card">
              <p className="note-card-kind">
                {formatDate(g.date)} · {readingMinutes(g)} min read
              </p>
              <h2 className="card-title">
                <Link href={`/guides/${g.slug}`}>{g.title}</Link>
              </h2>
              <p className="card-text">{g.description}</p>
              <Link href={`/guides/${g.slug}`} className="note-card-link">Read the guide →</Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
