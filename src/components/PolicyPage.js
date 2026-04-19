import Head from 'next/head';

function classifyParagraphs(paragraphs) {
  // Check if document uses numbered sections (e.g. "1. Introduction")
  const hasNumberedSections = paragraphs.some(p => /^\d+\.\s/.test(p));

  return paragraphs.map((text) => {
    // Numbered section heading
    if (/^\d+\.\s/.test(text)) return { type: 'h2', text };

    // Copyright
    if (/^©/.test(text)) return { type: 'copyright', text };

    // Check if this is a label-like heading
    const words = text.split(/\s+/);
    const titleCaseWords = words.filter(
      w => /^[A-Z("']/.test(w) || /^(and|or|to|of|the|in|for|a|an|&)$/i.test(w)
    );
    const isLabel = text.length <= 55
      && words.length <= 8
      && titleCaseWords.length === words.length
      && !text.includes('•')
      && !text.endsWith('.')
      && !text.endsWith(':')
      && !/:\s/.test(text)
      && !/^(We |You |Our |If |By |This |Some |Please )/.test(text)
      && !/^(Provide|Track|Enable|Personalize|Send|Improve|Prevent|Comply|Encryption|Secure|Regular|Access|Automatic)/.test(text);

    if (isLabel) {
      // In documents without numbered sections, these labels ARE the top-level headings
      return { type: hasNumberedSections ? 'h3' : 'h2', text };
    }

    // Bullet text (using •)
    if (text.includes('•')) return { type: 'bullets', text };

    // Regular paragraph
    return { type: 'p', text };
  });
}

function renderBlock(block, idx) {
  if (block.type === 'h2') {
    return <h2 key={idx}>{block.text}</h2>;
  }
  if (block.type === 'h3') {
    return <h3 key={idx}>{block.text}</h3>;
  }
  if (block.type === 'copyright') {
    return <p key={idx} className="policy-copyright">{block.text}</p>;
  }
  if (block.type === 'bullets') {
    const lines = block.text.split('\n');
    const parts = [];
    let currentBullets = [];

    const flushBullets = () => {
      if (currentBullets.length > 0) {
        parts.push({ type: 'ul', items: currentBullets });
        currentBullets = [];
      }
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith('•')) {
        currentBullets.push(trimmed.replace(/^•\s*/, ''));
      } else {
        flushBullets();
        parts.push({ type: 'p', text: trimmed });
      }
    }
    flushBullets();

    return (
      <div key={idx} className="policy-block">
        {parts.map((part, i) =>
          part.type === 'ul' ? (
            <ul key={i}>
              {part.items.map((b, j) => <li key={j}>{b}</li>)}
            </ul>
          ) : (
            <p key={i}>{part.text}</p>
          )
        )}
      </div>
    );
  }

  return <p key={idx}>{block.text}</p>;
}

export default function PolicyPage({ title, paragraphs, lastUpdated }) {
  // Filter out redundant header lines the component already renders
  const filtered = paragraphs.filter((p) => {
    const lower = p.toLowerCase().trim();
    if (lower === 'privacy policy' || lower === 'terms of service' || lower === 'terms and conditions') return false;
    if (lower.startsWith('privacy policy for ') || lower.startsWith('terms of service for ') || lower.startsWith('terms and conditions for ')) return false;
    if (lower.startsWith('last updated:')) return false;
    return true;
  });

  const blocks = classifyParagraphs(filtered);

  return (
    <>
      <Head>
        <title>{title} - Yarp Developers</title>
      </Head>
      <div className="prose">
        <h1>{title}</h1>
        {lastUpdated && <span className="date">Last Updated: {lastUpdated}</span>}
        <div className="policy-content">
          {blocks.map((block, idx) => renderBlock(block, idx))}
        </div>
      </div>
    </>
  );
}
