// A few big numbers, each with what it counts. Only ever real ones, read from
// the data files (apps.js, products.js), never typed in by hand.
export default function StatRow({ stats }) {
  return (
    <dl className="stat-row">
      {stats.map((s) => (
        <div key={s.label} className="stat">
          <dt className="stat-label">{s.label}</dt>
          <dd className="stat-value">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
