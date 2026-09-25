import SectionHead from '@/components/SectionHead';

// What's in the buyer's way, named, before the app is offered as the answer.
export default function ProblemCards({ problems }) {
  return (
    <section className="detail-section">
      <SectionHead eyebrow="The problem" title={problems.title} />
      <ul className="store-problems">
        {problems.items.map((p) => (
          <li key={p.title} className="store-problem">
            <h3 className="card-title">{p.title}</h3>
            <p className="card-text">{p.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
