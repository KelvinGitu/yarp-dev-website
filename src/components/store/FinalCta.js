import BuyButton from '@/components/BuyButton';
import CtaBand from '@/components/CtaBand';
import { Price } from '@/components/Region';
import TryButton from '@/components/store/TryButton';

// The last thing on the page: the question, the price, and the same two buttons.
export default function FinalCta({ product, onPhone }) {
  return (
    <CtaBand
      id="store-final"
      title={product.finalCta ?? `Ready to try ${product.name}?`}
      text={<><Price product={product} />, paid once. Or try it free first.</>}
    >
      <BuyButton item={product} className="store-btn-primary" />
      <TryButton product={product} onPhone={onPhone} />
    </CtaBand>
  );
}
