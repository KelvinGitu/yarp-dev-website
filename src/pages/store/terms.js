import PolicyPage from '@/components/PolicyPage';
import { SUPPORT_EMAIL } from '@/data/products';

// Licence terms for the desktop apps. Review before launch, ideally with
// someone who knows Belgian and EU consumer law; this is a starting point,
// not legal advice.
const paragraphs = [
  '1. The licence',
  'Buying pdfsign, Resume Maker, mediagrab or StoryForge gets you a personal licence key for that app; a bundle key covers all four. You may install and use the app on computers you own or use yourself. A licence for a business covers one person. Please don’t share or publish your key.',
  'The licence doesn’t expire, and the app keeps working without contacting us. It covers the version you bought and the updates we publish for that major version.',
  '2. The free trial',
  'Every download is a free trial, and the app works fully during it. pdfsign and Resume Maker: the first three PDFs you save are free; after that, saving needs a licence key, and opening and editing keep working. mediagrab: the first ten downloaded files are free. StoryForge: one project and 10,000 words on a computer are free; after that a key is needed to add more, and everything you wrote stays readable, editable and exportable.',
  '3. Downloading responsibly (mediagrab)',
  'mediagrab saves media that a website already shows you. Only download what you have the right to keep: your own uploads, material that is openly licensed, or copies the law where you live allows for personal use. Respect the terms of the sites you use. You are responsible for what you download and how you use it.',
  '4. Refunds',
  'If the app doesn’t work for you, email us within 30 days of buying and we’ll refund you in full. This doesn’t affect any rights you have under the law where you live.',
  '5. No warranty',
  'The apps are provided as they are. We work hard to make them reliable, but we can’t promise they’ll be free of errors. Check important documents before you send or sign them. To the extent the law allows, we’re not liable for indirect losses, and our liability is limited to what you paid.',
  '6. Your documents',
  'Your files and your writing remain yours. The apps don’t send them anywhere, and we never have access to them, so keeping backups is up to you (StoryForge keeps daily copies on your computer to help).',
  '7. Third-party components',
  'The apps include open-source components under their own licences (among them pdf.js and pdf-lib in pdfsign; yt-dlp, gallery-dl, an LGPL build of FFmpeg and QuickJS in mediagrab; Django and React in StoryForge; and the fonts listed in each app), and use Microsoft Edge WebView2, which is part of Windows.',
  '8. Contact',
  `Yarp Developers, Belgium. ${SUPPORT_EMAIL}`,
];

export default function StoreTerms() {
  return <PolicyPage title="Licence terms: the Yarp desktop apps" paragraphs={paragraphs} lastUpdated="September 22, 2026" />;
}
