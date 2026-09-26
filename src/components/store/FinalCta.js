import BuyButton from '@/components/BuyButton';
import CtaBand from '@/components/CtaBand';
import GetButtons from '@/components/store/GetButtons';
import TryButton from '@/components/store/TryButton';

// The last thing on the page: the question, the price, and the same two buttons.
export default function FinalCta({ product, onPhone }) {
  return (
    <CtaBand
      id="store-final"
      title={product.finalCta ?? `Ready to try ${product.name}?`}
      text={product.free ? 'Free, with nothing to unlock.' : `${product.price}, paid once. Or try it free first.`}
    >
      {product.free ? (
        <GetButtons product={product} onPhone={onPhone} />
      ) : (
        <>
          <BuyButton item={product} className="store-btn-primary" />
          <TryButton product={product} onPhone={onPhone} />
        </>
      )}
    </CtaBand>
  );
}
