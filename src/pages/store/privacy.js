import PolicyPage from '@/components/PolicyPage';
import { SUPPORT_EMAIL } from '@/data/products';

// Plain-language privacy policy for the desktop apps and the store that sells
// them. Review before launch; this is a starting point, not legal advice.
const paragraphs = [
  '1. The apps collect nothing',
  'pdfsign, Resume Maker, StoryForge and Ink Lifter run entirely on your computer. The documents you open, the signatures you draw, the resumes and stories you write and the files you save stay on your computer. The apps have no accounts, no analytics, no crash reporting and no advertising, and they make no connections to the internet: to us, or to anyone else.',
  'StoryForge’s licence key is checked on your computer against a public key built into the app. Checking it doesn’t contact us. The other apps are free and have no key.',
  'Profiles (StoryForge)',
  'StoryForge profiles are a name and, if you choose, a password, stored on your computer. A password is kept only as a one-way hash.',
  'Phone Signing (pdfsign)',
  'If you choose to sign on your phone, pdfsign briefly opens a connection on your local network, the one your wifi provides, so your phone can reach your computer directly. The signature goes from your phone to your computer and nowhere else. The connection closes when the code is no longer on screen.',
  'In Your Browser (pdfsign, Resume Maker and Ink Lifter)',
  'pdfsign, Resume Maker and Ink Lifter also run in a web browser, at yarpdevelopers.com/pdfsign, yarpdevelopers.com/resume-maker and yarpdevelopers.com/ink-lifter. This website delivers the app to your browser, and after that everything happens on your phone or computer: the PDFs you open, the resumes you write, the photos you clean up and the files you save are handled by your browser and are never uploaded, to us or anyone else. Resume Maker makes its PDF with your browser’s own print window; Ink Lifter can hand a finished image to your phone’s share sheet, which sends it only where you choose. Your saved signatures and profile (pdfsign) and your resumes (Resume Maker) are kept in your browser’s own storage on that device, and clearing your browsing data deletes them. Ink Lifter keeps your photos only while the page is open. The browser versions have no analytics and no trackers.',
  'Links You Click',
  'The “Buy a licence” link in StoryForge opens this website in your normal web browser. That happens only when you click it.',
  '2. Buying StoryForge',
  'When you buy, you pay on a checkout page run by Stripe, which handles your card details under its own privacy policy (https://stripe.com/privacy). We never see or store your card number.',
  'From Stripe we receive your email address, your name if you give one, your country, what you bought, and the amount. We use them to create your licence key, email it to you, keep a record of the sale, handle refunds and support, and meet our tax and accounting obligations.',
  'Your licence key is emailed to you through Resend (https://resend.com/legal/privacy-policy). Order records are kept in Google Firebase, hosted in the EU.',
  'We keep order records for as long as tax law requires (currently up to ten years in Belgium), then delete them. We don’t sell or share your details with anyone else, and we don’t send marketing email.',
  '3. This website',
  'This website is hosted on Google Firebase Hosting, which keeps standard server logs. It sets no cookies of its own and runs no analytics, and there are no advertising pixels or trackers on it.',
  'If you arrive through one of our ads, the link carries a short tag naming the ad. Your browser remembers that tag for a week, and if you buy, it is saved with your order so we know which ad worked. It is never sent to the ad network or anyone else.',
  '4. Your rights',
  'You can ask to see, correct or delete the personal data we hold about you from a purchase, and you can complain to your data protection authority. Some records must be kept for tax purposes even if you ask us to delete them.',
  `5. Contact`,
  `Questions about privacy: ${SUPPORT_EMAIL}.`,
];

export default function StorePrivacy() {
  return <PolicyPage title="Privacy: the Yarp desktop apps and the store" paragraphs={paragraphs} lastUpdated="September 26, 2026" />;
}
