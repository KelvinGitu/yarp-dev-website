import PolicyPage from '@/components/PolicyPage';
import { SUPPORT_EMAIL } from '@/data/products';

// Privacy policy for the website itself, chiefly the Google ads on the guides.
// The desktop apps and the store have their own (store/privacy.js), and each
// Google Play app has one at /privacy/<package>. Not legal advice.
const paragraphs = [
  '1. What this covers',
  'This policy covers the website at yarpdevelopers.com, run by Yarp Developers (Kelvin Gitu and Patrick Kimani). Our apps have their own policies: the desktop apps and the store at yarpdevelopers.com/store/privacy, and each Google Play app on its page under yarpdevelopers.com/support.',
  '2. What the website collects',
  'The website is hosted on Google Firebase Hosting, which keeps standard server logs: your IP address, your browser, the page you asked for and the time. They are used to keep the site running and secure. The website has no accounts, runs no analytics, and the pages other than the guides set no cookies.',
  '3. Advertising on the guides',
  'The guides at yarpdevelopers.com/guides show ads served by Google AdSense. The store, the product pages, checkout and the rest of the site carry no ads.',
  'Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this website or other websites. Google’s use of advertising cookies enables it and its partners to serve ads to you based on your visits to this site and/or other sites on the internet. You can read how Google uses information from sites that use its services at https://policies.google.com/technologies/partner-sites.',
  'You can opt out of personalised advertising in Google’s Ads Settings at https://www.google.com/settings/ads, or opt out of some third-party vendors’ use of cookies for personalised advertising at https://www.aboutads.info/choices. You can also block or delete cookies in your browser settings.',
  '4. Your consent',
  'If you visit from the European Economic Area, the United Kingdom or Switzerland, the guides ask for your consent, through Google’s consent message, before cookies are used for personalised ads. If you don’t consent, Google may still show non-personalised ads, which use cookies only for things like frequency capping, fraud prevention and measuring ads.',
  '5. Links from our ads',
  'If you arrive through one of our own ads, the link carries a short tag naming the ad. Your browser remembers that tag for a week, and if you buy, it is saved with your order so we know which ad worked. It is never sent to the ad network or anyone else.',
  '6. Your rights',
  'You can ask to see, correct or delete personal data we hold about you, and you can complain to your data protection authority. For data held by Google about the ads you see, use the controls in your Google account or the links above.',
  '7. Contact',
  `Questions about privacy: ${SUPPORT_EMAIL}.`,
];

export default function SitePrivacy() {
  return <PolicyPage title="Privacy: this website" paragraphs={paragraphs} lastUpdated="October 12, 2026" />;
}
