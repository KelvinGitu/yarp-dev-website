// The desktop apps sold in /store. One entry per product, plus the bundle.
//
// `price` is display only: Stripe charges whatever the Price behind
// STRIPE_PRICE_<PRODUCT> says (see functions/products.js and STORE_SETUP.md).
// Change one, change the other.
//
// Downloads are the installers on the public yarp-downloads repo's latest
// release. They're uploaded under a version-less name so these links never
// change; the licence key, not the link, is what unlocks the app.

export const DOWNLOADS = 'https://github.com/KelvinGitu/yarp-downloads/releases/latest/download';

export const SUPPORT_EMAIL = 'yarpsports@gmail.com';

export const FREE_EXPORTS = 3;

export const products = [
  {
    slug: 'pdfsign',
    name: 'pdfsign',
    tagline: 'Fill, sign and mark up PDFs without uploading them anywhere.',
    price: '€19',
    version: '1.0.0',
    download: `${DOWNLOADS}/pdfsign-setup.exe`,
    size: '21 MB',
    description:
      'Contracts, forms, rental agreements, tax papers: the documents you sign are the ones you least want on ' +
      "someone else's server. pdfsign opens them on your own computer, lets you sign, fill in and tidy them up, and " +
      'saves the result next to the original. Nothing is uploaded, because there is nowhere for it to go.',
    shots: [
      { file: '1.webp', alt: 'pdfsign with a rental agreement open: form fields filled in, a signature placed on the line, and the date beside it' },
    ],
    features: [
      'Sign by drawing, typing in a handwriting style, uploading a photo of your signature, or signing on your phone',
      'Fill in fillable forms, with a counter that jumps you to the next empty field',
      'Add text, dates, your name, ticks and crosses; white out what needs covering',
      'Put your initials on every page in one click',
      'Reorder, turn, delete and merge pages',
      'Undo for everything, and saved snippets for your address, email and ID number',
      'Lock form fields in the saved copy so answers can’t be changed afterwards',
    ],
    privacy: [
      'Your PDFs are opened and written on your computer. They are never uploaded.',
      'No account, no sign-in, no cloud. It works with the internet unplugged.',
      'Signing on your phone goes over your own wifi, straight to your computer.',
    ],
  },
  {
    slug: 'resume-maker',
    name: 'Resume Maker',
    tagline: 'Write your resume once, set it in seven styles, and export a clean PDF.',
    price: '€15',
    version: '1.0.0',
    download: `${DOWNLOADS}/ResumeMaker-setup.exe`,
    size: '20 MB',
    description:
      "A resume holds your address, your phone number and your whole work history. Resume Maker keeps it on your " +
      'computer: edit on the left, watch the page update on the right, switch between seven designs, and export a ' +
      'PDF that fits on one page. Keep a version per kind of job you apply for.',
    shots: [
      { file: '1.webp', alt: 'Resume Maker editing a resume, shown in the Column template with a teal sidebar' },
      { file: '2.webp', alt: 'Resume Maker’s Design tab, showing the same resume in Classic, Modern, Column and Timeline templates' },
    ],
    features: [
      'Seven templates, from a plain one that applicant tracking systems read cleanly to a bold colour sidebar',
      'Live preview as you type, and your own colour, text size and paper size (A4 or US Letter)',
      'Fit to one page: type and spacing shrink together until it does',
      'Keep several versions and duplicate one to tailor it for a new job',
      'Rename, reorder or hide any section; undo for every change',
      'PDFs with real text, so recruiters can search and copy from them',
    ],
    privacy: [
      'Your resumes are saved on your computer, and the PDF is made there too.',
      'No account, no sign-in, no cloud. It works with the internet unplugged.',
      'Nothing about you or what you write is sent anywhere, ever.',
    ],
  },
];

// Both apps for less. A bundle key unlocks either app.
export const bundle = {
  slug: 'yarp-bundle',
  name: 'Both apps',
  tagline: 'pdfsign and Resume Maker, with one licence key that unlocks both.',
  price: '€29',
};

export const productBySlug = (slug) => products.find((p) => p.slug === slug) ?? null;
