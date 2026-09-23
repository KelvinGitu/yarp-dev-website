// The desktop apps sold in /store. One entry per product, plus the bundle.
//
// `price` is display only: Stripe charges whatever the Price behind
// STRIPE_PRICE_<PRODUCT> says (see functions/products.js and STORE_SETUP.md).
// Change one, change the other. Local prices (Kenya) are in regions.js.
//
// Each feature is a short `title` and a sentence of `text`; the product page
// shows them as cards, so keep titles to a few words.
//
// Downloads are the installers on the public yarp-downloads repo's latest
// release. They're uploaded under a version-less name so these links never
// change; the licence key, not the link, is what unlocks the app.

export const DOWNLOADS = 'https://github.com/KelvinGitu/yarp-downloads/releases/latest/download';

export const SUPPORT_EMAIL = 'yarpdevelopers@gmail.com';

// Each app's free-to-licensed line, as the store describes it: `tryShort`
// under the Download button, `tryLong` in "How it works", `licenseFaq` in
// Questions. Keep in step with each app (app/license.py, or StoryForge's
// core/explore.py and desktop/config.py's EXPLORE_DAYS).

export const products = [
  {
    slug: 'pdfsign',
    name: 'pdfsign',
    tagline: 'Fill, sign and mark up PDFs without uploading them anywhere.',
    price: '€9.99',
    version: '1.0.1',
    download: `${DOWNLOADS}/pdfsign-setup.exe`,
    size: '21 MB',
    tryShort: 'Free to fill and sign; a key unlocks saving',
    tryLong: 'Fill in and sign as many documents as you like. Saving the finished PDF is the only thing that needs a licence key.',
    licenseFaq: 'You can open, fill in and sign documents for as long as you like. Saving a finished PDF needs a licence key.',
    whereIsLicence: 'the key icon at the bottom left, labelled Unlicensed',
    description:
      'Contracts, forms, rental agreements, tax papers: the documents you sign are the ones you least want on ' +
      "someone else's server. pdfsign opens them on your own computer, lets you sign, fill in and tidy them up, and " +
      'saves the result next to the original. Nothing is uploaded, because there is nowhere for it to go.',
    shots: [
      { file: '1.webp', alt: 'pdfsign with a rental agreement open: form fields filled in, a signature placed on the line, and the date beside it' },
    ],
    features: [
      { title: 'Sign any way you like', text: 'Draw it, type it in a handwriting style, upload a photo of your signature, or sign on your phone.' },
      { title: 'Forms, filled fast', text: 'Fill in fillable forms, with a counter that jumps you to the next empty field.' },
      { title: 'Write on any page', text: 'Add text, dates, your name, ticks and crosses, and white out what needs covering.' },
      { title: 'Initial every page', text: 'Put your initials on every page in one click.' },
      { title: 'Rearrange pages', text: 'Reorder, turn, delete and merge pages.' },
      { title: 'Undo and snippets', text: 'Undo for everything, and saved snippets for your address, email and ID number.' },
      { title: 'Lock the answers', text: 'Lock form fields in the saved copy so answers can’t be changed afterwards.' },
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
    price: '€9.99',
    version: '1.0.1',
    download: `${DOWNLOADS}/ResumeMaker-setup.exe`,
    size: '20 MB',
    tryShort: 'Free to edit and preview; a key unlocks exporting',
    tryLong: 'Edit and preview as many resumes as you like. Exporting a PDF is the only thing that needs a licence key.',
    licenseFaq: 'You can edit and preview for as long as you like. Exporting a PDF needs a licence key.',
    whereIsLicence: 'the Unlicensed button at the top right',
    description:
      "A resume holds your address, your phone number and your whole work history. Resume Maker keeps it on your " +
      'computer: edit on the left, watch the page update on the right, switch between seven designs, and export a ' +
      'PDF that fits on one page. Keep a version per kind of job you apply for.',
    shots: [
      { file: '1.webp', alt: 'Resume Maker editing a resume, shown in the Column template with a teal sidebar' },
      { file: '2.webp', alt: 'Resume Maker’s Design tab, showing the same resume in Classic, Modern, Column and Timeline templates' },
    ],
    features: [
      { title: 'Seven templates', text: 'From a plain one that applicant tracking systems read cleanly to a bold colour sidebar.' },
      { title: 'Live preview', text: 'The page updates as you type, in your own colour, text size and paper size (A4 or US Letter).' },
      { title: 'Fit to one page', text: 'Type and spacing shrink together until it fits.' },
      { title: 'A version per job', text: 'Keep several versions and duplicate one to tailor it for a new application.' },
      { title: 'Your sections, your order', text: 'Rename, reorder or hide any section, with undo for every change.' },
      { title: 'PDFs recruiters can search', text: 'Real text, not a picture of it, so it can be searched and copied.' },
    ],
    privacy: [
      'Your resumes are saved on your computer, and the PDF is made there too.',
      'No account, no sign-in, no cloud. It works with the internet unplugged.',
      'Nothing about you or what you write is sent anywhere, ever.',
    ],
  },
  {
    slug: 'storyforge',
    name: 'StoryForge',
    tagline: 'A writing studio for novels and stories, with a story bible that keeps it all straight.',
    price: '€24.99',
    version: '1.2.0',
    download: `${DOWNLOADS}/StoryForge-setup.exe`,
    size: '37 MB',
    tryShort: 'Free to explore, no licence needed at first',
    tryLong: "Creating your first project starts a short window to try every feature and write a little. After that your writing stays yours to read, edit and export; a licence key lets you keep adding.",
    licenseFaq: "Creating your first project starts a short window (about 15 minutes) to explore every feature, across every profile on the computer. After that, your writing stays exactly as it is — readable, editable and exportable — but a licence key is needed to start a new project or add to what you have.",
    whereIsLicence: 'the Explore button at the top right, or Settings → Licence & data',
    description:
      'Your draft is the most personal thing you own. StoryForge keeps it on your computer: write chapter by ' +
      'chapter with version history, keep characters, places and the rules of your world in a story bible, plan ' +
      'with outlines and sticky notes, and export a manuscript as Word, PDF, EPUB or Markdown. Several people can ' +
      'share one computer, each with their own profile.',
    shots: [
      { file: '1.webp', alt: 'StoryForge’s chapter editor with a draft open, the word count and save status in the top bar' },
      { file: '2.webp', alt: 'The dashboard, showing daily word goal, writing streak and a project card' },
      { file: '3.webp', alt: 'A project’s chapter list with manuscript progress toward a word-count target' },
      { file: '4.webp', alt: 'The story bible, with character cards for a cast of two' },
      { file: '5.webp', alt: 'A sticky-note board with colour-coded notes for planning scenes and reveals' },
      { file: '6.webp', alt: 'Split view: the chapter editor beside a live outline of the manuscript' },
      { file: '7.webp', alt: 'A novel exported as a typeset PDF: a chapter opener with its label and title beside a justified page with a running header' },
      { file: '8.webp', alt: 'A short story exported in standard manuscript format: double-spaced Courier, word count and a name, title and page header' },
      { file: '9.webp', alt: 'An essay and a novel exported in the Clean style, with a title block, headings, references and page numbers' },
      { file: '10.webp', alt: 'EPUB covers StoryForge generates for a novel, a short story and an essay' },
    ],
    features: [
      { title: 'A focused chapter editor', text: 'Autosave, focus mode, split view and version history.' },
      { title: 'A story bible', text: 'Characters, locations, plot points, world rules, terminology and a timeline.' },
      { title: 'Plan it your way', text: 'Outlines, brainstorm maps, sticky-note boards and story-structure templates.' },
      { title: 'Keep the habit', text: 'Daily word goals, streaks and progress charts.' },
      { title: 'Export anywhere', text: 'Word, PDF, EPUB and Markdown, typeset and ready to send.' },
      { title: 'One computer, several writers', text: 'A profile for each person, with an optional password.' },
    ],
    privacy: [
      'Everything you write is stored in one file on your computer, backed up daily.',
      'No account, no cloud. It works with the internet unplugged.',
      'Nothing about you or what you write is sent anywhere, ever.',
    ],
  },
  {
    slug: 'ink-lifter',
    name: 'Ink Lifter',
    tagline: 'Lift signatures, stamps and handwriting off a photo of paper, onto a transparent background.',
    price: '€4.99',
    version: '1.0.1',
    download: `${DOWNLOADS}/InkLifter-setup.exe`,
    size: '19 MB',
    tryShort: 'Free to open and preview; a key unlocks saving',
    tryLong: 'Open, clean up and preview as many photos as you like. Saving, copying or exporting an image is the only thing that needs a licence key.',
    licenseFaq: 'You can open, clean up and preview images for as long as you like. Saving, copying or exporting one needs a licence key.',
    whereIsLicence: 'the Unlicensed button at the top right',
    description:
      'Snap your signature, a company stamp or a hand-drawn sketch with your phone, and Ink Lifter turns it into ' +
      'a clean transparent PNG you can drop into a document, a slide or a website. It reads the paper around every ' +
      'stroke, so desk-lamp shadows and grey phone-camera "white" vanish while the ink keeps its soft edges. It all ' +
      'happens on your computer: a photo of your signature is the last thing you should upload to a stranger.',
    shots: [
      { file: '1.webp', alt: 'Ink Lifter comparing a photo of a signature under a desk lamp with the same signature lifted onto a transparent background' },
    ],
    features: [
      { title: 'One photo or a batch', text: 'Drop them in, or paste straight from the clipboard.' },
      { title: 'Shadows disappear', text: 'Each stroke is judged against the paper around it, so shadows and uneven light go.' },
      { title: 'Any ink colour', text: 'Keep the ink’s own colour, or repaint it blue, black or anything else.' },
      { title: 'Faint pencil to heavy marker', text: 'Sensitivity and boldness sliders for every kind of stroke.' },
      { title: 'Clean edges', text: 'Removes dust and specks, and crops to the ink with the margin you choose.' },
      { title: 'See before you save', text: 'Before-and-after compare, and previews on transparency, white, a page or dark.' },
      { title: 'Transparent PNG or WebP', text: 'Save, copy, or export everything to a folder at once.' },
    ],
    privacy: [
      'Your photos are processed on your computer. They are never uploaded.',
      'No account, no sign-in, no cloud. It works with the internet unplugged.',
      'Nothing is kept: images exist only until you close the window or save them.',
    ],
  },
];

// Every app for less. A bundle key unlocks all of them.
export const bundle = {
  slug: 'yarp-bundle',
  name: 'All four apps',
  tagline: 'pdfsign, Resume Maker, StoryForge and Ink Lifter, with one licence key that unlocks them all.',
  price: '€39.99',
};

export const productBySlug = (slug) => products.find((p) => p.slug === slug) ?? null;
