import SectionHead from '@/components/SectionHead';

// The answer to the problem, as a few numbered steps.
export default function HowItWorks({ steps }) {
  return (
    <section className="detail-section">
      <SectionHead eyebrow="How it works" title={steps.title} />
      <ol className={`store-howto store-howto-${steps.items.length}`}>
        {steps.items.map((s, i) => (
          <li key={s.title} className="store-howto-step">
            <span className="product-feature-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="card-title">{s.title}</h3>
            <p className="card-text">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
