import { ShieldIcon } from '@/components/icons';

// The refund promise (store terms, section 3), given a section of its own
// instead of sitting at the bottom of the questions.
export default function Guarantee({ product }) {
  return (
    <section className="store-guarantee">
      <span className="store-guarantee-icon"><ShieldIcon /></span>
      <div>
        <h2 className="store-guarantee-title">30-day refund</h2>
        <p className="store-guarantee-text">
          If {product.name} doesn’t work for you, email us within 30 days of buying and we’ll refund you in full.
          And because it’s free to try, you can check it for yourself before you pay anything.
        </p>
      </div>
    </section>
  );
}
