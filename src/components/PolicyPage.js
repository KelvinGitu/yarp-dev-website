import Head from 'next/head';

export default function PolicyPage({ title, paragraphs, lastUpdated }) {
  return (
    <>
      <Head>
        <title>{title} - Yarp Developers</title>
      </Head>
      <div className="prose">
        <h1>{title}</h1>
        {lastUpdated && <span className="date">Last Updated: {lastUpdated}</span>}
        
        <div className="policy-content">
          {paragraphs.map((p, idx) => {
            // Very simple heuristic to render sections dynamically
            if (p.match(/^[0-9]+\.\s/)) {
              return <h2 key={idx}>{p}</h2>;
            }
            if (p.length < 50 && !p.includes('.')) {
              return <h3 key={idx} style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>{p}</h3>;
            }
            return <p key={idx} style={{ whiteSpace: 'pre-wrap' }}>{p}</p>;
          })}
        </div>
      </div>
    </>
  );
}
