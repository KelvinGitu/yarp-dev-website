import { apps } from '@/data/apps';
import { products } from '@/data/products';

// Where each kind of email goes. Help with an app is SUPPORT_EMAIL, in
// products.js, since the store and the licence emails use it too.
export const SALES_EMAIL = 'sales@yarpdevelopers.com'; // work: "have an app in mind?"
export const FEEDBACK_EMAIL = 'feedback@yarpdevelopers.com'; // ideas and feature requests

// The studio's numbers, for the proof row on Home and About. Counted from the
// data files, so they're right as long as apps.js and products.js are.
export function studioStats() {
  return [
    { label: 'Apps on Google Play', value: apps.filter((a) => a.status === 'live').length },
    { label: 'Releases shipped', value: apps.reduce((sum, a) => sum + a.builds, 0) },
    { label: 'Desktop apps', value: products.length },
  ];
}
