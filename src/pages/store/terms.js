import PolicyPage from '@/components/PolicyPage';
import { SUPPORT_EMAIL } from '@/data/products';

// Terms for the desktop apps: the free ones, and StoryForge's licence. Review before launch, ideally with
// someone who knows Belgian and EU consumer law; this is a starting point,
// not legal advice.
const paragraphs = [
  '1. The free apps',
  'pdfsign, Resume Maker and Ink Lifter are free. You may install and use them, on your computer or in your browser, for any purpose, with no licence key and nothing locked. You may not sell them or pass them off as your own.',
  '2. The StoryForge licence',
  'Buying StoryForge gets you a personal licence key. You may install and use it on computers you own or use yourself. A licence for a business covers one person. Please don’t share or publish your key. A bundle key bought before the bundle was withdrawn works as a StoryForge key.',
  'The licence doesn’t expire, and the app keeps working without contacting us. It covers the version you bought and every update we publish for StoryForge, free, for as long as we make it.',
  'StoryForge works before you pay: creating your first project on a computer starts a short window (about 15 minutes) in which everything works; after that, a key is needed to start another project or add to what you have, and everything you wrote stays readable, editable and exportable.',
  'Prices are in euros, paid through Stripe.',
  '3. Refunds',
  'If StoryForge doesn’t work for you, email us within 30 days of buying and we’ll refund you in full. The same goes for any app bought in the 30 days before it became free. This doesn’t affect any rights you have under the law where you live.',
  '4. No warranty',
  'The apps are provided as they are. We work hard to make them reliable, but we can’t promise they’ll be free of errors. Check important documents before you send or sign them. To the extent the law allows, we’re not liable for indirect losses, and our liability is limited to what you paid, if anything.',
  '5. Your documents',
  'Your files and your writing remain yours. The apps don’t send them anywhere, and we never have access to them, so keeping backups is up to you (StoryForge keeps daily copies on your computer to help).',
  '6. Third-party components',
  'The apps include open-source components under their own licences (among them pdf.js and pdf-lib in pdfsign; Django and React in StoryForge; and the fonts listed in each app), and use Microsoft Edge WebView2, which is part of Windows.',
  '7. Contact',
  `Yarp Developers, Belgium. ${SUPPORT_EMAIL}`,
];

export default function StoreTerms() {
  return <PolicyPage title="Terms: the Yarp desktop apps" paragraphs={paragraphs} lastUpdated="September 26, 2026" />;
}
