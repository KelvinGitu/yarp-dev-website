// Practical guides, one entry per article at /guides/<slug>. Newest first.
//
// `body` is a list of blocks, rendered in order: { h2 }, { p }, { ul: [...] }
// or { ol: [...] }. Text is plain; no markup inside the strings.
// `product` is the slug of the store app the guide relates to (products.js);
// the article ends with a short pointer to it. Each guide has to be useful to
// someone who never installs that app: the advice first, the app as one option.
// `date` is ISO (YYYY-MM-DD), the day it was published.

export const guides = [
  {
    slug: 'sign-a-pdf-without-uploading-it',
    title: 'How to sign a PDF without uploading it anywhere',
    description:
      'Most signing websites upload your contract to their servers first. Here is how to fill in and sign a PDF on your own computer or phone, and what to check before you send it back.',
    date: '2026-10-12',
    product: 'pdfsign',
    body: [
      { p: 'Someone emails you a rental agreement, an employment contract or a school form and asks you to “just sign and send it back”. The quickest route most people find is a free signing website: drop the PDF in, draw a squiggle, download the result. It works, but it means a copy of the document, with your name, address, ID number and signature on it, now sits on a server you know nothing about.' },
      { p: 'You rarely need to do that. Every modern computer and phone can sign a PDF without the file leaving the device. This guide covers the options, the difference between the kinds of signature, and a short checklist for before you hit send.' },

      { h2: 'Why uploading is worth avoiding' },
      { p: 'An online PDF tool has to receive your file to work on it. Reputable services delete files after a few hours, but you are taking their word for it, and the documents people sign are exactly the ones that are worth stealing: leases with addresses, contracts with salaries, forms with tax and passport numbers. A drawn signature saved on a stranger’s server is also a reusable image of your signature.' },
      { p: 'There are good reasons to use a full e-signature service such as DocuSign: when the other side requires it, or when you need an audit trail showing who signed what and when. For the everyday “sign this and email it back” case, signing locally is simpler and keeps the document yours.' },

      { h2: 'Option 1: Adobe Acrobat Reader (Windows and Mac)' },
      { p: 'The free Acrobat Reader has a Fill & Sign tool. Open the PDF, choose Fill & Sign, then Sign yourself, and either type your name, draw a signature with the mouse or trackpad, or use a picture of your signature. Place it on the line and save.' },
      { p: 'One thing to watch: if you are signed in to an Adobe account, Reader may offer to save to Adobe’s cloud storage. Choose to save on your computer instead if you want the file to stay local.' },

      { h2: 'Option 2: Preview on a Mac' },
      { p: 'Preview, the PDF viewer built into macOS, can sign without any extra software. Open the PDF, show the Markup toolbar, click the signature button and create a signature by writing on the trackpad or by holding a signature written on white paper up to the camera. Preview remembers it, so next time you just click and place it. Text boxes in the same toolbar let you fill in forms that don’t have fillable fields.' },

      { h2: 'Option 3: Your phone' },
      { p: 'On an iPhone or iPad, open the PDF from Files or from a Mail attachment, tap the Markup button, then the plus button, and choose Add Signature. Draw it with your finger, place it and tap Done. The signed file is saved back where it came from.' },
      { p: 'On Android it depends on the phone. Some manufacturers’ file viewers have a signing tool, and Google Drive’s PDF viewer can fill in forms and add a signature to files stored in Drive. If the PDF is something you’d rather not keep in the cloud, use a signing app that works offline.' },

      { h2: 'Option 4: A dedicated offline app' },
      { p: 'If you sign documents often, a desktop app made for the job saves time: a saved signature you can reuse, your initials on every page in one click, snippets for your address and ID number, and form fields that jump you to the next empty one. Our own app, pdfsign, is one of these. It’s free, runs on Windows or in your browser, and never uploads the file. Whichever tool you choose, check that it says plainly where your documents go.' },

      { h2: 'Drawn, typed or a photo: which signature to use' },
      { p: 'For most everyday documents, any of these is fine. In the EU, the US and many other places, the law accepts a simple electronic signature, which includes a typed name or a drawn or scanned signature placed on a PDF, as long as it shows you meant to sign. What matters is that you can show it was you and that you agreed.' },
      { ul: [
        'A drawn signature looks most like your real one. Draw it slowly on a trackpad or a phone; a mouse makes shaky lines.',
        'A typed signature in a handwriting font is neat and perfectly valid for many documents, but some people on the other side expect something that looks hand-drawn.',
        'A photo of your real signature looks the most natural. Clean it up first so the paper background is transparent; a grey rectangle around the signature looks pasted on.',
      ] },
      { p: 'Some documents need more than a simple signature: property deeds, some financial and government forms, and anything that asks for a qualified or certified digital signature. If the document says so, follow its instructions; no drawing tool can stand in for those.' },

      { h2: 'Filling in the rest of the form' },
      { p: 'Many PDFs have fillable fields: click into them and type. If yours doesn’t, add text boxes over the blank lines. A few tips that make the result look clean:' },
      { ul: [
        'Match the size of the text to the printed form; most tools let you change the font size.',
        'Write dates the way the form asks for them, and initial pages if the contract has an initials box on each one.',
        'Use “white out” or a filled white rectangle to cover an instruction or an old value, rather than writing over it.',
      ] },

      { h2: 'Before you send it back' },
      { ol: [
        'Scroll through every page. It’s easy to miss a second signature line or an initials box on page 4.',
        'Lock or flatten the form if you can. Fillable fields stay editable unless you lock them, which means the next person could change your answers. Many tools have an option to lock or flatten fields; printing to PDF also flattens everything into the page.',
        'Save the signed copy under a new name, such as “lease-signed.pdf”, so you keep the original too.',
        'Open the saved file once more, in a different viewer if you have one, to make sure the signature and text came through.',
        'Send it the way you were asked to, and keep a copy for your records.',
      ] },

      { h2: 'The short version' },
      { p: 'You don’t need to upload a contract to sign it. Acrobat Reader, Preview, your phone’s markup tools or an offline app can all do it on the device in a couple of minutes. Pick the signature style the document calls for, check every page, lock the fields, and keep a copy.' },
    ],
  },
  {
    slug: 'signature-photo-to-transparent-png',
    title: 'How to turn a photo of your signature into a transparent PNG',
    description:
      'A clean signature image with no background, from a phone photo. How to take the photo, how to remove the paper by hand in a free editor, and how to save it so it drops neatly into any document.',
    date: '2026-10-12',
    product: 'ink-lifter',
    body: [
      { p: 'A transparent PNG of your signature is handy to have. Drop it into a Word document, a PDF, an invoice template or an email footer and it sits on the page like ink, with no white box around it. Getting there from a phone photo is harder than it sounds, though: the paper comes out grey, a lamp throws a shadow across one corner, and background-removal tools tend to chew up the thin pen strokes.' },
      { p: 'This guide covers how to take a photo that’s easy to clean, how to remove the background by hand with free software, and the settings that give you a crisp result.' },

      { h2: 'Step 1: Take a photo that’s easy to clean' },
      { p: 'Most of the work is done before you open any software. A good photo can be cleaned up in a minute; a bad one never looks quite right.' },
      { ul: [
        'Use plain white paper, without lines or a grid. Lines are the hardest thing to remove later.',
        'Sign with a dark pen, black or dark blue, and a slightly thicker tip than usual. A felt-tip or gel pen photographs better than a thin ballpoint.',
        'Shoot in even daylight, near a window but not in direct sun. Turn the flash off; it makes a bright spot in the middle and dark corners.',
        'Hold the phone flat and directly above the paper, so the signature isn’t skewed, and keep your own shadow out of the frame.',
        'Get close enough that the signature fills most of the photo. More pixels on the ink means smoother edges.',
        'Sign several times and photograph the best one.',
      ] },

      { h2: 'Why one-click background removers struggle' },
      { p: 'Most background removers are trained to cut out people, pets and products: large solid shapes against a background. A signature is the opposite, thin strokes with lots of paper between them. The tools often break the lines, leave a halo of grey around them, or keep blotches of shadow they think are part of the subject. Many of them also work by uploading your photo to a server, which is not where you want a picture of your signature.' },
      { p: 'Removing the paper yourself takes a little longer, but you control the result and the photo stays on your device.' },

      { h2: 'Step 2: Remove the paper in GIMP (free, Windows, Mac and Linux)' },
      { ol: [
        'Open the photo in GIMP and crop it roughly around the signature with the crop tool.',
        'Go to Colors, then Desaturate, if you want plain black ink. Skip this if you want to keep blue ink blue.',
        'Go to Colors, then Levels. Drag the right-hand (white) slider left until the paper turns pure white, including the shadowy corners. Drag the left-hand (black) slider right a little until the strokes are solid. Stop before the edges of the strokes turn jagged.',
        'Go to Layer, then Transparency, then Add Alpha Channel.',
        'Go to Colors, then Color to Alpha, and keep white as the colour. The white paper becomes transparent, and the soft edges of the strokes become partly transparent, which is what makes them look like real ink.',
        'Go to Image, then Crop to Content, to trim the empty space. Add a small margin back with Image, then Canvas Size, if you want one.',
        'Export with File, then Export As, and give the file a .png name.',
      ] },
      { p: 'The same idea works in other editors: raise the contrast until the paper is white, then turn white into transparency. In Photoshop that’s Levels followed by Select, Color Range on the white and deleting it, or the Blend If sliders. Photopea, a free browser-based editor, has the same tools as Photoshop and runs on your own device.' },

      { h2: 'Step 3: Check it on different backgrounds' },
      { p: 'A signature that looks fine on a white page can show a grey fringe on a coloured one. Before you use it, place it on a dark background and a coloured one too (in GIMP, add a filled layer underneath and turn it off again before exporting). If you see a halo, go back to Levels and push the white slider a bit further, or run Color to Alpha once more.' },
      { p: 'Also check the size. For documents, a signature about 600 to 1,200 pixels wide is plenty: big enough to stay sharp when printed, small enough not to bloat the file.' },

      { h2: 'PNG or WebP?' },
      { p: 'Both formats keep transparency. PNG works everywhere: Word, Google Docs, PDF editors, email signatures and older software. WebP files are smaller and fine on the web, but some desktop programs still can’t open them. If you’re not sure, use PNG. Avoid JPG: it has no transparency, so the background comes back as white.' },

      { h2: 'If you do this often' },
      { p: 'Doing it by hand is fine for one signature. For stamps, several signatures, or handwriting with faint pencil, a tool built for ink saves a lot of slider-pushing. Ink Lifter, our free app for Windows and the browser, judges each stroke against the paper around it, so shadows and uneven light disappear while soft edges stay. It can also recolour the ink, remove dust specks and crop to the ink automatically. Like the GIMP method, it does everything on your device.' },

      { h2: 'Keep it safe' },
      { p: 'A clean signature image is easy to misuse, so treat it like a key. Keep it in a private folder rather than on your desktop or in a shared drive, don’t post it publicly, and only add it to documents you actually mean to sign. If a document is important, flatten or lock the PDF after placing it, so the image can’t simply be copied off the page.' },
    ],
  },
  {
    slug: 'resume-that-applicant-tracking-systems-can-read',
    title: 'How to write a resume that applicant tracking systems can read',
    description:
      'Many applications are read by software before a person sees them. What applicant tracking systems do with your resume, the layouts that trip them up, and a quick test you can run yourself.',
    date: '2026-10-12',
    product: 'resume-maker',
    body: [
      { p: 'When you apply for a job online, your resume often goes into an applicant tracking system (ATS) before anyone reads it. The ATS pulls the text out of your file, splits it into fields such as name, job titles, dates and skills, and lets the recruiter search and filter applicants. If the software can’t read your resume properly, your experience might show up scrambled, in the wrong fields, or not at all.' },
      { p: 'The good news is that you don’t need to game anything. A resume that’s easy for software to read is also easy for a busy person to read. This guide covers what trips these systems up, and a quick test you can run on your own file.' },

      { h2: 'What the software actually does' },
      { p: 'An ATS doesn’t look at your resume the way a person does. It extracts the text in reading order, then guesses which parts are which, mostly from headings and patterns: a line that looks like a date range next to a line that looks like a job title is probably a position. Recruiters then search that extracted text for skills, titles and keywords from the job ad.' },
      { p: 'Two things follow. First, anything that isn’t real text, such as a logo, an icon, or words inside an image, is invisible to the system. Second, anything that scrambles the reading order, such as complicated tables or text boxes, can mix your sections together.' },

      { h2: 'Layouts that cause trouble' },
      { ul: [
        'Text inside images. A skills graphic, a chart of your languages or a scanned resume is a picture, not text. The system sees nothing.',
        'Tables and text boxes. They look tidy, but some parsers read them cell by cell or skip them entirely. Lay your content out with plain paragraphs and tabs instead.',
        'Contact details in the page header or footer. Some systems ignore headers and footers, so your email and phone number may vanish. Put them in the main body, at the top.',
        'Icons instead of words. A phone icon next to a number is fine for people, but write “Phone” or just the number so it can be recognised.',
        'Unusual section names. “Where I’ve been” is charming, but “Work experience” is what the software looks for.',
        'Multi-column layouts. Modern systems handle simple two-column designs better than they used to, but a single column is still the safest choice for the main content.',
      ] },

      { h2: 'Structure that works' },
      { p: 'Use the sections recruiters expect, with ordinary names: Contact details, Summary (optional), Work experience, Education and Skills, plus Certifications, Projects or Volunteering if they help. For each job, give the title, the employer, the location and the dates in a consistent format, such as “March 2022 – June 2025”, then a few bullet points.' },
      { p: 'Write bullet points that say what you did and what came of it: “Cut monthly reporting time from two days to three hours by automating the export” tells both the software and the reader far more than “Responsible for reporting”.' },

      { h2: 'Keywords without stuffing' },
      { p: 'Recruiters search for the skills and titles in their job ad, so use the same words where they’re true for you. If the ad says “project management” and you wrote “ran projects”, add the exact phrase. Where a term has an abbreviation, include both forms at least once, for example “search engine optimisation (SEO)”.' },
      { p: 'Don’t paste the job description in white text or repeat keywords dozens of times. Recruiters see the extracted text, so hidden tricks show up immediately, and they read as dishonest.' },

      { h2: 'PDF or Word?' },
      { p: 'Most current systems read both a PDF and a .docx file well, as long as the PDF contains real text. A PDF keeps your layout exactly as you designed it, which is why most people prefer it. If the job posting asks for a particular format, send that format; some older systems still prefer Word.' },
      { p: 'The PDF must be made from text, not scanned or exported as an image. You can check by trying to select a word in it: if you can highlight individual words, it’s text.' },

      { h2: 'How long should it be?' },
      { p: 'One page is the norm for students and people with less than about ten years’ experience, and it forces you to keep only what matters. Two pages are fine for longer careers. The ATS doesn’t care about length, but the recruiter skimming the result does, so put the most relevant experience first.' },

      { h2: 'A test you can run in a minute' },
      { ol: [
        'Open your resume PDF and select all the text (Ctrl+A or Cmd+A).',
        'Copy it and paste it into a plain text editor such as Notepad or TextEdit.',
        'Read what comes out. Is your name at the top? Are your contact details there? Does each job’s title, employer and dates appear together, in order?',
        'If sections are jumbled, text is missing, or words run together, a parser will likely struggle too. Simplify the layout where it went wrong and test again.',
      ] },

      { h2: 'Keep a version for each kind of job' },
      { p: 'One resume for every application is rarely the best one. Keep a master copy with everything, then a version for each kind of role you apply for, with the most relevant experience and skills moved up and the wording matched to those job ads. Name the files clearly, such as “Resume – Data analyst.pdf”, so you always send the right one.' },

      { h2: 'Making one' },
      { p: 'Any word processor can produce an ATS-friendly resume if you stick to a single column, real headings and no text boxes. If you’d rather not fight the layout, a resume builder does it for you; just check that it exports real text and doesn’t keep your details on its servers. Our free Resume Maker, for Windows and the browser, has eleven designs including a plain one that applicant tracking systems read cleanly, fits your resume to one page, keeps a version per job, and exports a PDF with real, searchable text, all on your own device.' },
    ],
  },
];

export const guideBySlug = (slug) => guides.find((g) => g.slug === slug) ?? null;

// Rough reading time at 220 words a minute, for the article's meta line.
export function readingMinutes(guide) {
  const words = guide.body
    .flatMap((block) => block.p ?? block.h2 ?? block.ul ?? block.ol ?? [])
    .join(' ')
    .split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

// "2026-10-12" → "12 October 2026", fixed to UTC so the build and the browser agree.
export const formatDate = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
