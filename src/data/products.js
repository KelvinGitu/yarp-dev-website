// The desktop apps in /store, one entry per product.
//
// Most are `free: true`: no price, no licence key, and the page offers the
// download (and the browser version) instead of a Buy button. The others have
// a `price`, which is display only: Stripe charges whatever the Price behind
// STRIPE_PRICE_<PRODUCT> says (see functions/products.js and STORE_SETUP.md).
// Change one, change the other. Prices are in euros only.
//
// Each feature is a short `title` and a sentence of `text`; the product page
// shows them as cards, so keep titles to a few words.
//
// `web`, when set, is where the app also runs in a browser (built from the
// app's own repo by web/build.py into public/).
// Phone visitors are sent there instead of to the Windows download. With it
// come `webKeeps` (a sentence: what the browser stores), `webOffline` (what still works
// in airplane mode) and, optionally, `webNote` (anything that works
// differently there), for the store's Questions.
//
// Downloads are the installers on the public yarp-downloads repo's latest
// release. They're uploaded under a version-less name so these links never
// change.
//
// The product page reads as one argument, top to bottom, and each of these
// optional fields is one section of it (a section with no data isn't shown):
//   `headline`  the h1: what the buyer gets, not the product's name
//   `problems`  { title, items: [{ title, text }] }: what's in the buyer's way
//   `steps`     { title, items: [{ title, text }] }: how the app gets them there
//   `showcase`  [{ label, title, text, shots: ['2.webp', …] }]: screenshots
//               grouped under a claim; the files are ones listed in `shots`
//   `included`  the price card's checklist; the feature titles if absent
//   `fromDev`   a short note from the developer, in their own words
//   `finalCta`  the question over the last pair of buttons
// No invented reviews, "was" prices or deadlines: say what's true, plainly.

export const DOWNLOADS = 'https://github.com/KelvinGitu/yarp-downloads/releases/latest/download';

export const SUPPORT_EMAIL = 'support@yarpdevelopers.com';

// A paid app's free-to-licensed line, as the store describes it: `tryShort`
// under the Download button, `tryLong` in "How buying works", `licenseFaq` in
// Questions. Keep in step with the app (StoryForge's core/explore.py and
// desktop/config.py's EXPLORE_DAYS).

export const products = [
  {
    slug: 'pdfsign',
    name: 'pdfsign',
    tagline: 'Fill, sign and mark up PDFs without uploading them anywhere.',
    free: true,
    version: '1.1.0',
    download: `${DOWNLOADS}/pdfsign-setup.exe`,
    web: '/pdfsign',
    webKeeps: 'Your saved signatures and profile are kept in that browser, so clearing your browsing data deletes them.',
    webOffline: 'open, sign and download PDFs',
    size: '21 MB',
    headline: 'Sign contracts and fill in forms without uploading them anywhere.',
    problems: {
      title: 'The trouble with signing a PDF',
      items: [
        { title: 'Your papers on a stranger’s server', text: 'Most signing websites upload the document to sign it: your contract, your address, your ID number.' },
        { title: 'The print, sign and scan shuffle', text: 'The alternative is a printer, a pen and a scanner, and a crooked grey copy at the end.' },
      ],
    },
    steps: {
      title: 'Signed in three steps',
      items: [
        { title: 'Open the PDF', text: 'Drag it in. It opens on your computer, not on a website.' },
        { title: 'Fill in and sign', text: 'Type into the form, place your signature, add the date and your initials.' },
        { title: 'Save it', text: 'The signed copy is saved next to the original, ready to send.' },
      ],
    },
    finalCta: 'Ready to sign your next document?',
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
    tagline: 'Write your resume once, set it in eleven styles, and export a clean PDF.',
    free: true,
    version: '1.2.0',
    download: `${DOWNLOADS}/ResumeMaker-setup.exe`,
    web: '/resume-maker',
    webKeeps: 'Your resumes are kept in that browser, so clearing your browsing data deletes them.',
    webOffline: 'edit your resumes and save them as PDFs',
    webNote: 'On a phone, Save PDF opens its print window: choose Save as PDF, check the paper size, and save.',
    size: '20 MB',
    headline: 'A resume that looks the part, made on your own computer.',
    problems: {
      title: 'Why a resume is harder than it should be',
      items: [
        { title: 'Fighting the word processor', text: 'Nudge one line and the whole layout slides onto a second page.' },
        { title: 'Your details, uploaded', text: 'Most online builders keep your address, phone number and whole work history on their servers.' },
      ],
    },
    steps: {
      title: 'From blank page to PDF',
      items: [
        { title: 'Type it once', text: 'Fill in your experience, education and skills on the left; the page updates on the right.' },
        { title: 'Pick a design', text: 'Switch between eleven templates any time. Your words stay put.' },
        { title: 'Export a PDF', text: 'Fitted to one page, with real text recruiters can search.' },
      ],
    },
    showcase: [
      {
        label: 'Design',
        title: 'Eleven designs, one click apart',
        text: 'From a plain layout that applicant tracking systems read cleanly to a bold colour sidebar, in your own colour, text size and paper size.',
        shots: ['2.webp'],
      },
    ],
    finalCta: 'Ready for your next application?',
    description:
      "A resume holds your address, your phone number and your whole work history. Resume Maker keeps it on your " +
      'computer: edit on the left, watch the page update on the right, switch between eleven designs, and export a ' +
      'PDF that fits on one page. Keep a version per kind of job you apply for.',
    shots: [
      { file: '1.webp', alt: 'Resume Maker editing a resume, shown in the Column template with a teal sidebar' },
      { file: '2.webp', alt: 'Resume Maker’s Design tab, showing the same resume in Classic, Modern, Column and Timeline templates' },
    ],
    features: [
      { title: 'Eleven templates', text: 'From a plain one that applicant tracking systems read cleanly to a bold colour sidebar.' },
      { title: 'Live preview', text: 'The page updates as you type, in your own colour, text size and paper size (A4 or US Letter).' },
      { title: 'Fit to one page', text: 'Type and spacing shrink together until it fits.' },
      { title: 'A version per job', text: 'Keep several versions and duplicate one to tailor it for a new application.' },
      { title: 'Your sections, your order', text: 'Add certifications, volunteering, awards or a section of your own; rename, reorder or hide any of them, with undo for every change.' },
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
    version: '1.4.0',
    download: `${DOWNLOADS}/StoryForge-setup.exe`,
    size: '37 MB',
    tryShort: 'Free to explore, no licence needed at first',
    tryLong: "Creating your first project starts a short window to try every feature and write a little. After that your writing stays yours to read, edit and export; a licence key lets you keep adding.",
    licenseFaq: "Creating your first project starts a short window (about 15 minutes) to explore every feature, across every profile on the computer. After that, your writing stays exactly as it is — readable, editable and exportable — but a licence key is needed to start a new project or add to what you have.",
    whereIsLicence: 'the Explore button at the top right, or Settings → Licence & data',
    headline: 'Finish your novel, and keep every word of it on your own computer.',
    problems: {
      title: 'Three things stall most novels',
      items: [
        { title: 'Losing track of your world', text: 'By chapter twenty, it’s hard to remember her eye colour, the year the war ended or what the magic costs. Readers remember.' },
        { title: 'Losing momentum', text: 'A novel is written a few hundred words at a time, and a week away is enough to lose the thread.' },
        { title: 'A draft on someone else’s server', text: 'Online writing tools keep your manuscript on their computers, under their terms, for as long as they stay in business.' },
      ],
    },
    steps: {
      title: 'From first idea to finished manuscript',
      items: [
        { title: 'Plan', text: 'Sketch the plot with outlines, brainstorm maps and sticky notes, or start from a story-structure template.' },
        { title: 'Write', text: 'Chapter by chapter, in a quiet editor that saves as you type and keeps every version.' },
        { title: 'Keep it straight', text: 'Characters, places, world rules and the timeline go in the story bible, ready whenever you need to check.' },
        { title: 'Export', text: 'Send it out as a Word document, a typeset PDF, an EPUB or in standard manuscript format.' },
      ],
    },
    showcase: [
      {
        label: 'Write',
        title: 'A page built for writing',
        text: 'Autosave, version history, focus mode, and a split view with the outline beside your chapter. Write on a light, dark or sepia page.',
        shots: ['6.webp', '12.webp', '13.webp'],
      },
      {
        label: 'Remember',
        title: 'A story bible that remembers for you',
        text: 'Characters, locations, plot points, world rules, terminology and a timeline, kept with the book they belong to.',
        shots: ['4.webp'],
      },
      {
        label: 'Plan',
        title: 'Plan it your way',
        text: 'Outlines, brainstorm maps and colour-coded sticky-note boards, and a chapter list that tracks the manuscript toward its word target.',
        shots: ['5.webp', '18.webp', '3.webp'],
      },
      {
        label: 'Keep going',
        title: 'Keep the habit',
        text: 'Set a daily word goal and keep the streak going. The calendar shows a year of writing at a glance.',
        shots: ['2.webp', '11.webp'],
      },
      {
        label: 'Export',
        title: 'Ready to send',
        text: 'A typeset PDF with chapter openers and running headers, standard manuscript format for agents and magazines, clean essays, and EPUBs with a cover made for you.',
        shots: ['7.webp', '8.webp', '9.webp', '10.webp'],
      },
      {
        label: 'Make it yours',
        title: 'In your language, in your light',
        text: 'The whole interface in English, French or Dutch, and each book exported in its own language. Light, dark, or follow Windows.',
        shots: ['14.webp', '15.webp', '16.webp', '17.webp'],
      },
    ],
    included: [
      'A chapter editor with autosave and version history',
      'A story bible for characters, places and world rules',
      'Outlines, brainstorm maps and sticky-note boards',
      'Daily word goals, streaks and progress charts',
      'Export to Word, PDF, EPUB and Markdown',
      'A profile for each writer on the computer',
      'Light, dark and sepia; English, French and Dutch',
    ],
    finalCta: 'Ready to start your novel?',
    description:
      'Your draft is the most personal thing you own. StoryForge keeps it on your computer: write chapter by ' +
      'chapter with version history, keep characters, places and the rules of your world in a story bible, plan ' +
      'with outlines and sticky notes, and export a manuscript as Word, PDF, EPUB or Markdown. Several people can ' +
      'share one computer, each with their own profile.',
    shots: [
      { file: '1.webp', alt: 'StoryForge’s chapter editor with a draft open, the word count and save status in the top bar' },
      { file: '2.webp', alt: 'The dashboard: today’s word goal met, a 28-day writing streak and five projects' },
      { file: '3.webp', alt: 'A project’s chapter list with manuscript progress toward a word-count target' },
      { file: '4.webp', alt: 'The story bible, with character cards for a novel’s cast' },
      { file: '5.webp', alt: 'A sticky-note board with colour-coded notes for planning scenes and reveals' },
      { file: '6.webp', alt: 'Split view: the chapter editor beside a live outline of the manuscript' },
      { file: '7.webp', alt: 'A novel exported as a typeset PDF: a chapter opener with its label and title beside a justified page with a running header' },
      { file: '8.webp', alt: 'A short story exported in standard manuscript format: double-spaced Courier, word count and a name, title and page header' },
      { file: '9.webp', alt: 'An essay and a novel exported in the Clean style, with a title block, headings, references and page numbers' },
      { file: '10.webp', alt: 'EPUB covers StoryForge generates for a novel, a short story and an essay' },
      { file: '11.webp', alt: 'The dashboard in the dark theme: a 28-day writing streak, a year of writing on the calendar and five projects' },
      { file: '12.webp', alt: 'A novel chapter open in the chapter editor, in the dark theme' },
      { file: '13.webp', alt: 'The same chapter on the sepia writing page: warm, paper-coloured and easy on the eyes' },
      { file: '14.webp', alt: 'Settings: the interface language, the Light, Dark or Follow Windows theme, and a sepia writing page' },
      { file: '15.webp', alt: 'The dashboard in French' },
      { file: '16.webp', alt: 'A French novel in the chapter editor, with the whole interface in French' },
      { file: '17.webp', alt: 'A novel’s chapter list with progress toward its word target, in Dutch and the dark theme' },
      { file: '18.webp', alt: 'The sticky-note board in the dark theme, with a group of notes for act two' },
    ],
    features: [
      { title: 'A focused chapter editor', text: 'Autosave, focus mode, split view and version history.' },
      { title: 'A story bible', text: 'Characters, locations, plot points, world rules, terminology and a timeline.' },
      { title: 'Plan it your way', text: 'Outlines, brainstorm maps, sticky-note boards and story-structure templates.' },
      { title: 'Keep the habit', text: 'Daily word goals, streaks and progress charts.' },
      { title: 'Export anywhere', text: 'Word, PDF, EPUB and Markdown, typeset and ready to send.' },
      { title: 'One computer, several writers', text: 'A profile for each person, with an optional password.' },
      { title: 'Light, dark or sepia', text: 'A light or dark theme, or follow Windows, and a sepia page for long sessions.' },
      { title: 'In English, French and Dutch', text: 'The whole interface, and each book’s exports in its own language.' },
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
    free: true,
    version: '1.1.0',
    download: `${DOWNLOADS}/InkLifter-setup.exe`,
    web: '/ink-lifter',
    webKeeps: 'Nothing is kept in that browser: your photos exist only until you close the page or save them.',
    webOffline: 'open photos, clean them up and save them',
    webNote: 'On a phone, Share sends the result straight to WhatsApp, email or anywhere else.',
    size: '19 MB',
    headline: 'Turn a phone photo of your signature into a clean, transparent PNG.',
    problems: {
      title: 'Why a photo of ink never looks right',
      items: [
        { title: 'Grey paper, not white', text: 'Phone cameras turn white paper grey, and a desk lamp throws shadows across it.' },
        { title: 'Cut-outs that break the strokes', text: 'Background removers are made for people and products, so thin pen lines break up or vanish.' },
        { title: 'Your signature, uploaded', text: 'Most online tools do the work on their servers, with a copy of your signature.' },
      ],
    },
    steps: {
      title: 'Photo to PNG in three steps',
      items: [
        { title: 'Snap it', text: 'Take a photo of the signature, stamp or sketch, and drop it in or paste it.' },
        { title: 'Lift it', text: 'The paper, shadows and specks go; the ink stays, soft edges and all. Adjust the strength and colour if you like.' },
        { title: 'Use it', text: 'Save a transparent PNG or WebP, or copy it straight into a document.' },
      ],
    },
    finalCta: 'Ready to lift your first signature?',
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

export const productBySlug = (slug) => products.find((p) => p.slug === slug) ?? null;
