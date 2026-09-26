import BuyButton from '@/components/BuyButton';
import { CheckIcon } from '@/components/icons';
import GetButtons from '@/components/store/GetButtons';

// One price, what it buys, and the button: the page's single place to decide.
// `item` is a products.js entry; `items` the checklist (strings or nodes). A
// free app gets the same card, reading Free, with its download buttons.
export default function PriceCard({ item, title, items, buyLabel, id, onPhone }) {
  return (
    <div className="price-card" id={id}>
      <p className="price-card-title">{title}</p>
      <p className="price-card-amount">{item.free ? 'Free' : item.price}</p>
      <p className="price-card-terms">
        {item.free
          ? 'No licence key, no account, no ads. Nothing is locked.'
          : 'Paid once. No subscription, and it never expires.'}
      </p>
      <ul className="price-card-list">
        {items.map((line, i) => (
          <li key={i}><CheckIcon />{line}</li>
        ))}
      </ul>
      {item.free ? (
        <div className="price-card-get"><GetButtons product={item} onPhone={onPhone} /></div>
      ) : (
        <>
          <BuyButton item={item} label={buyLabel} className="store-btn-primary" />
          <p className="price-card-note">Your key arrives by email a moment later · Card payment through Stripe</p>
        </>
      )}
    </div>
  );
}
