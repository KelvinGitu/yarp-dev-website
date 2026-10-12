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
          content="Practical guides to signing PDFs, writing resumes and novels, running a small shop, word puzzles, trivia nights and journaling, from the people who build the Yarp apps."
        />
        <link rel="canonical" href="https://yarpdevelopers.com/guides" />
      </Head>

      <div className="page guides">
        <header className="page-hero">
          <p className="detail-section-title">Guides</p>
          <h1 className="page-title">Practical guides to the everyday things our apps help with.</h1>
          <p className="page-lede">
            Signing documents, writing a resume or a novel, running a small shop, getting better at word puzzles,
            hosting a quiz, keeping a journal. Each guide works whichever tool you use.
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
