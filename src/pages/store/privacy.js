import PolicyPage from '@/components/PolicyPage';
import { SUPPORT_EMAIL } from '@/data/products';

// Plain-language privacy policy for the desktop apps and the store that sells
// them. Review before launch; this is a starting point, not legal advice.
const paragraphs = [
  '1. The apps collect nothing',
  'pdfsign and Resume Maker run entirely on your computer. The documents you open, the signatures you draw, the resumes you write and the PDFs you save stay on your computer. The apps have no accounts, no analytics, no crash reporting and no advertising, and they make no connections to the internet: to us, or to anyone else.',
  'Your licence key is checked on your computer against a public key built into the app. Checking it doesn’t contact us.',
  'Phone Signing (pdfsign)',
  'If you choose to sign on your phone, pdfsign briefly opens a connection on your local network, the one your wifi provides, so your phone can reach your computer directly. The signature goes from your phone to your computer and nowhere else. The connection closes when the code is no longer on screen.',
  'Links You Click',
  'The “Buy a licence” link in each app opens this website in your normal web browser. That happens only when you click it.',
  '2. Buying a licence',
  'When you buy, you pay on a checkout page run by Stripe, which handles your card details under its own privacy policy (https://stripe.com/privacy). We never see or store your card number.',
  'From Stripe we receive your email address, your name if you give one, your country, what you bought, and the amount. We use them to create your licence key, email it to you, keep a record of the sale, handle refunds and support, and meet our tax and accounting obligations.',
  'Your licence key is emailed to you through Resend (https://resend.com/legal/privacy-policy). Order records are kept in Google Firebase, hosted in the EU.',
  'We keep order records for as long as tax law requires (currently up to ten years in Belgium), then delete them. We don’t sell or share your details with anyone else, and we don’t send marketing email.',
  '3. This website',
  'This website is hosted on Google Firebase Hosting, which keeps standard server logs. It sets no cookies of its own and runs no analytics.',
  '4. Your rights',
  'You can ask to see, correct or delete the personal data we hold about you from a purchase, and you can complain to your data protection authority. Some records must be kept for tax purposes even if you ask us to delete them.',
  `5. Contact`,
  `Questions about privacy: ${SUPPORT_EMAIL}.`,
];

export default function StorePrivacy() {
  return <PolicyPage title="Privacy: pdfsign, Resume Maker and the store" paragraphs={paragraphs} lastUpdated="September 22, 2026" />;
}
