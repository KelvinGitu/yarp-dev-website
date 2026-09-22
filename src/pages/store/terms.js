import PolicyPage from '@/components/PolicyPage';
import { SUPPORT_EMAIL } from '@/data/products';

// Licence terms for the desktop apps. Review before launch, ideally with
// someone who knows Belgian and EU consumer law; this is a starting point,
// not legal advice.
const paragraphs = [
  '1. The licence',
  'Buying pdfsign or Resume Maker gets you a personal licence key for that app; a bundle key covers both. You may install and use the app on computers you own or use yourself. A licence for a business covers one person. Please don’t share or publish your key.',
  'The licence doesn’t expire, and the app keeps working without contacting us. It covers the version you bought and the updates we publish for that major version.',
  '2. The free trial',
  'Every download is a free trial: the app works fully, and the first three PDFs you save are free. After that, saving needs a licence key. Opening and editing keep working.',
  '3. Refunds',
  'If the app doesn’t work for you, email us within 30 days of buying and we’ll refund you in full. This doesn’t affect any rights you have under the law where you live.',
  '4. No warranty',
  'The apps are provided as they are. We work hard to make them reliable, but we can’t promise they’ll be free of errors. Check important documents before you send or sign them. To the extent the law allows, we’re not liable for indirect losses, and our liability is limited to what you paid.',
  '5. Your documents',
  'Your files remain yours. The apps don’t send them anywhere, and we never have access to them.',
  '6. Third-party components',
  'The apps include open-source components (among them pdf.js, pdf-lib, and the fonts listed in each app) under their own licences, and use Microsoft Edge WebView2, which is part of Windows.',
  '7. Contact',
  `Yarp Developers, Belgium. ${SUPPORT_EMAIL}`,
];

export default function StoreTerms() {
  return <PolicyPage title="Licence terms: pdfsign and Resume Maker" paragraphs={paragraphs} lastUpdated="September 22, 2026" />;
}
