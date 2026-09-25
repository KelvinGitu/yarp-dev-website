// The boxed last call at the bottom of a page: a question, a line, and the
// buttons that answer it.
export default function CtaBand({ title, text, id, children }) {
  return (
    <section className="cta-band" id={id}>
      <h2 className="page-h2">{title}</h2>
      {text && <p className="page-text">{text}</p>}
      <div className="store-actions">{children}</div>
    </section>
  );
}
