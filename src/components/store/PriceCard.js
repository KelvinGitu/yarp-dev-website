import BuyButton from '@/components/BuyButton';
import { Price, useRegion } from '@/components/Region';
import { CheckIcon } from '@/components/icons';
import { REGIONS } from '@/data/regions';

// One price, what it buys, and the button: the page's single place to decide.
// `item` is a products.js entry or the bundle; `items` the checklist (strings
// or nodes). The sticky bar links here (#buy), so the Paystack email form only
// ever opens in one spot.
export default function PriceCard({ item, title, items, buyLabel, id }) {
  const { region } = useRegion();
  const local = REGIONS[region];

  return (
    <div className="price-card" id={id}>
      <p className="price-card-title">{title}</p>
      <p className="price-card-amount"><Price product={item} /></p>
      <p className="price-card-terms">Paid once. No subscription, and it never expires.</p>
      <ul className="price-card-list">
        {items.map((line, i) => (
          <li key={i}><CheckIcon />{line}</li>
        ))}
      </ul>
      <BuyButton item={item} label={buyLabel} className="store-btn-primary" />
      <p className="price-card-note">
        Your key arrives by email a moment later · {local ? `${local.payWith} through Paystack` : 'Card payment through Stripe'}
      </p>
    </div>
  );
}
