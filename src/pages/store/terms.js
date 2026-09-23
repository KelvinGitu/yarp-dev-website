import PolicyPage from '@/components/PolicyPage';
import { SUPPORT_EMAIL } from '@/data/products';

// Licence terms for the desktop apps. Review before launch, ideally with
// someone who knows Belgian and EU consumer law; this is a starting point,
// not legal advice.
const paragraphs = [
  '1. The licence',
  'Buying pdfsign, Resume Maker, StoryForge or Ink Lifter gets you a personal licence key for that app; a bundle key covers all four. You may install and use the app on computers you own or use yourself. A licence for a business covers one person. Please don’t share or publish your key.',
  'The licence doesn’t expire, and the app keeps working without contacting us. It covers the version you bought and every update we publish for that app, free, for as long as we make it.',
  '2. Trying before you buy',
  'Every download works before you pay. pdfsign and Resume Maker: opening, filling in and editing are always free; saving or exporting a PDF needs a licence key. Ink Lifter: opening and previewing are always free; saving, copying or exporting an image needs a licence key. StoryForge: creating your first project on a computer starts a short window (about 15 minutes) in which everything works; after that, a key is needed to start another project or add to what you have, and everything you wrote stays readable, editable and exportable.',
  'Prices in Kenya are set in Kenyan shillings and paid with M-Pesa or Airtel Money through Paystack. Everywhere else, prices are in euros and paid through Stripe. The key you get is the same either way.',
  '3. Refunds',
  'If the app doesn’t work for you, email us within 30 days of buying and we’ll refund you in full. This doesn’t affect any rights you have under the law where you live.',
  '4. No warranty',
  'The apps are provided as they are. We work hard to make them reliable, but we can’t promise they’ll be free of errors. Check important documents before you send or sign them. To the extent the law allows, we’re not liable for indirect losses, and our liability is limited to what you paid.',
  '5. Your documents',
  'Your files and your writing remain yours. The apps don’t send them anywhere, and we never have access to them, so keeping backups is up to you (StoryForge keeps daily copies on your computer to help).',
  '6. Third-party components',
  'The apps include open-source components under their own licences (among them pdf.js and pdf-lib in pdfsign; Django and React in StoryForge; and the fonts listed in each app), and use Microsoft Edge WebView2, which is part of Windows.',
  '7. Contact',
  `Yarp Developers, Belgium. ${SUPPORT_EMAIL}`,
];

export default function StoreTerms() {
  return <PolicyPage title="Licence terms: the Yarp desktop apps" paragraphs={paragraphs} lastUpdated="September 23, 2026" />;
}
