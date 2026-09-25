// Every section of a store page opens the same way: a small label saying what
// kind of section it is, then a heading that says something.
export default function SectionHead({ eyebrow, title, id }) {
  return (
    <>
      {eyebrow && <p className="detail-section-title">{eyebrow}</p>}
      <h2 className="page-h2" id={id}>{title}</h2>
    </>
  );
}
