import SectionHead from '@/components/SectionHead';

// Screenshots grouped under what they prove, instead of one long gallery.
// One shot runs full width; two sit side by side; three or four put the first
// at full width and the rest in a row beneath it.
export default function Showcase({ product }) {
  const alt = Object.fromEntries(product.shots.map((s) => [s.file, s.alt]));

  return product.showcase.map((block) => {
    const [first, ...rest] = block.shots;
    const pair = block.shots.length === 2;
    const big = pair ? null : first;
    const row = pair ? block.shots : rest;

    return (
      <section key={block.title} className="detail-section store-showcase">
        <SectionHead eyebrow={block.label} title={block.title} />
        <p className="page-text">{block.text}</p>
        <div className="store-showcase-shots">
          {big && <Shot product={product} file={big} alt={alt[big]} />}
          {row.length > 0 && (
            <div className="store-showcase-row">
              {row.map((file) => <Shot key={file} product={product} file={file} alt={alt[file]} />)}
            </div>
          )}
        </div>
      </section>
    );
  });
}

function Shot({ product, file, alt }) {
  return (
    <img src={`/assets/store/${product.slug}/${file}`} alt={alt} width={1440} height={900} loading="lazy" />
  );
}
