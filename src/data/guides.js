// Practical guides, one entry per article at /guides/<slug>. Newest first.
//
// `body` is a list of blocks, rendered in order: { h2 }, { p }, { ul: [...] }
// or { ol: [...] }. Text is plain; no markup inside the strings.
// `product` is the slug of the store app the guide relates to (products.js),
// or `app` the slug of a mobile app (apps.js); the article ends with a short
// pointer to it. Each guide has to be useful to
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
  {
    slug: 'story-bible-for-your-novel',
    title: 'How to keep track of characters and worldbuilding in a long novel',
    description:
      'By chapter twenty it’s easy to forget a character’s eye colour or the year the war ended. How to build a story bible that keeps your novel consistent without turning into a second book.',
    date: '2026-10-12',
    product: 'storyforger',
    body: [
      { p: 'Somewhere around the middle of a first draft, most novelists hit the same wall. A character’s eyes were green in chapter three and brown in chapter nineteen. The journey that took two days now takes five. A minor character has two different surnames. None of these is hard to fix on its own, but each one pulls a reader out of the story, and finding them all in a 90,000-word manuscript is miserable work.' },
      { p: 'The tool writers use to prevent this is a story bible: a single reference that holds the facts of your book. Television writers’ rooms have used them for decades, and they work just as well for one person writing a novel. This guide covers what to put in one, how to keep it useful, and how not to let it swallow your writing time.' },

      { h2: 'What a story bible is (and isn’t)' },
      { p: 'A story bible is a record of facts you have already decided, so you can check them instead of remembering them. It is not your outline, and it is not a place to write backstory for its own sake. The test for anything you put in it: will I need to look this up while writing or revising? If not, it can stay in your head or in a separate notes file.' },

      { h2: 'The sections most novels need' },
      { ul: [
        'Characters. Name and any nicknames, age, appearance, where they live, what they want, what they’re hiding, how they speak, and the chapter they first appear in. Keep the physical details short and specific: “grey streak over left eyebrow” is more useful than a paragraph.',
        'Places. Every location that appears more than once: what it looks like, how far it is from the others, and who lives or works there. Distances and travel times cause more continuity errors than almost anything else.',
        'Timeline. The order of events, with dates or at least days, including things that happened before the book begins. Ages, seasons and pregnancies all depend on it.',
        'World rules. For fantasy and science fiction especially: how the magic or technology works, what it costs, and what it cannot do. Readers forgive almost anything except a rule broken to get the plot out of a corner.',
        'Terminology. Invented words, titles, place names and their spelling, plus any real-world jargon your characters use. This is where you settle “Lord Commander” versus “Lord-Commander” once.',
        'Plot threads. Each promise you make the reader, such as a mystery, a debt or a prophecy, and the chapter where it is set up and paid off.',
      ] },

      { h2: 'Build it as you write, not before' },
      { p: 'It is tempting to spend weeks building a world before writing a word. Some writers love that, and for them it’s part of the fun. But if the goal is a finished book, the most reliable approach is to add facts to the bible the moment you invent them in the draft. Give a character a scar on page 40? Spend thirty seconds noting it. Over a whole draft those thirty seconds add up to a complete reference, built from what is actually on the page rather than what you once planned.' },
      { p: 'A useful habit is a short “bible pass” at the end of each writing session: skim what you wrote today and add any new names, places or rules. It takes five minutes and doubles as a reminder of where you left off.' },

      { h2: 'Keep entries short and easy to find' },
      { ul: [
        'One entry per character, place or rule, with the name as the heading, so you can find it in seconds.',
        'Facts, not prose. Bullet points beat paragraphs when you are checking a detail mid-sentence.',
        'Note the chapter where each fact first appears. When something changes in revision, you know where to look.',
        'Mark undecided details as undecided, for example “age: 30s?”, rather than inventing them too early.',
      ] },

      { h2: 'Use it when you revise' },
      { p: 'A story bible pays off most in revision. Before each revision pass, read the entries for the characters and places in the chapters you are working on. When you change a fact, such as moving the wedding from spring to autumn, update the bible first, then search the manuscript for every mention. A timeline is especially valuable here: lay out the events in order and the impossible gaps and overlaps become obvious.' },
      { p: 'If you work with an editor or beta readers, the bible also answers their questions. “How old is she here?” becomes a ten-second lookup instead of an evening of rereading.' },

      { h2: 'Where to keep it' },
      { p: 'The best tool is the one you will actually open while writing. Some writers use a notebook, a spreadsheet with one tab per section, or a document with headings. The important things are that it is quick to search and lives close to the manuscript, because a bible you have to go looking for is a bible you stop updating.' },
      { p: 'Writing software can keep the two together. StoryForger, our writing studio for Windows and the browser, has a story bible built in, with characters, locations, plot points, world rules, terminology and a timeline kept with the book they belong to, next to a chapter editor and sticky-note planning boards. Whatever you use, keep a backup: a story bible represents months of decisions.' },

      { h2: 'The short version' },
      { p: 'Write facts down the moment you invent them, keep each entry short, organise it so you can find anything in seconds, and read the relevant entries before you revise. A story bible won’t write the book for you, but it will stop the book contradicting itself.' },
    ],
  },
  {
    slug: 'track-customer-credit-small-shop',
    title: 'How to track customer credit and debts in a small shop',
    description:
      'Selling on credit keeps regular customers coming back, but unrecorded debts quietly eat a shop’s profit. A simple system for recording who owes what, collecting it, and knowing your real numbers.',
    date: '2026-10-12',
    app: 'shopflow',
    body: [
      { p: 'In many neighbourhood shops, credit is part of everyday business. A regular customer takes bread and milk on Monday and pays on Friday when wages come in. A supplier drops off stock and is paid at the end of the month. It builds loyalty, and it is often the only way customers can buy at all. But it is also where small shops lose the most money without noticing: a debt that wasn’t written down, a balance nobody remembers, or stock counted as sold when the cash never arrived.' },
      { p: 'This guide covers a simple system for recording credit, collecting it politely, and understanding what it does to your real profit, whether you use a notebook or an app.' },

      { h2: 'Why credit sales need their own record' },
      { p: 'If you only record cash in the till, a credit sale disappears twice: the stock leaves the shelf, and no money arrives. Your stock count says you sold it; your cash says you didn’t. Over a month those gaps make it impossible to tell whether the business is actually making money or just moving stock.' },
      { p: 'Treat each credit sale as two facts: a sale, which happened today, and a debt, which stays open until it is paid. Supplier credit is the mirror image: stock you received today, and money you owe until you pay it.' },

      { h2: 'What to record for every credit sale' },
      { ul: [
        'The customer’s name and a phone number, so there is never a question of which “Mama John” it was.',
        'The date.',
        'What they took, and the total. Item-level detail settles arguments later.',
        'Any amount paid now, and the balance remaining.',
        'When they promised to pay.',
      ] },
      { p: 'When a payment comes in, record it against that customer with the date and amount, and update the balance. Many shops let a customer pay part of a debt at a time, so the running balance matters more than any single entry.' },

      { h2: 'Set limits before you need them' },
      { p: 'Decide in advance how much credit each customer can have, and for how long. A simple rule, such as no new credit while an old balance is more than two weeks overdue, is easier to apply than a decision made at the counter with the customer waiting. New customers can start with a small limit that rises as they pay reliably. Write the rule down, so staff apply it the same way you would.' },

      { h2: 'Collecting without losing the customer' },
      { ol: [
        'Review the list of open debts every week, oldest first.',
        'Remind customers before a debt is late, not after. A friendly message the day before payday works better than a demand a month later.',
        'Be specific: “Your balance is 1,250 for the items on the 3rd” is easier to act on than “you owe money”.',
        'Offer a way to pay part now if the full amount is hard.',
        'Pause credit, rather than ending the relationship, for customers who fall far behind, and say clearly what will restore it.',
      ] },

      { h2: 'Don’t forget what you owe' },
      { p: 'Supplier credit needs the same care. Record each delivery you haven’t paid for, the amount and the due date. Paying suppliers on time protects your price and your access to stock; paying early when you don’t need to can leave you short of cash for the week. A list of what you owe, sorted by due date, makes that decision easy.' },

      { h2: 'Know your real numbers' },
      { p: 'At the end of each month, look at three figures together: what you sold (cash and credit), the cash you actually collected, and the total customers still owe you. If the amount owed keeps growing month after month, the shop is lending more than it is earning, however busy it feels. Compare your profit with and without the uncollected debts, and you will see how much credit is really costing you.' },

      { h2: 'Notebook or app?' },
      { p: 'A dedicated credit book works if you are disciplined about it: one page per customer, every sale and payment, and a weekly review. Its weaknesses are that it can’t add up totals for you, it can be lost or damaged, and it doesn’t connect to your stock.' },
      { p: 'An app removes the arithmetic. ShopFlow, our business management app for Android, was built for small shops that sell on credit: customer debts and supplier credits are records in their own right, alongside inventory, sales, purchases and analytics, so stock, revenue and profit are counted with credit in mind. Whichever you use, the habit matters more than the tool: record every credit sale at the moment it happens.' },
    ],
  },
  {
    slug: 'get-better-at-word-puzzles',
    title: 'How to get better at crossword-style word puzzles',
    description:
      'Solving word clues is a skill you can practise. The techniques experienced solvers use, from reading clues for their part of speech to using letter patterns and coming back later.',
    date: '2026-10-12',
    app: 'three-clues',
    body: [
      { p: 'Crosswords and other clue-based word puzzles can seem like a test of vocabulary, but most of what makes a good solver is technique. Experienced solvers don’t know vastly more words than everyone else; they read clues more carefully, use every letter they already have, and know when to move on. Here are the habits that make the biggest difference.' },

      { h2: 'Read the clue for its grammar' },
      { p: 'A clue and its answer can usually swap places in a sentence. If the clue is a plural, the answer is almost always plural. If it’s a verb in the past tense, so is the answer. “Ran quickly” suggests DASHED or RACED, not DASH. Checking tense, number and part of speech rules out many wrong guesses before you write anything in.' },

      { h2: 'Use the letter count and the letters you have' },
      { p: 'The length of the answer is a clue in itself. Before guessing, count the squares and note any letters already filled in from crossing words. English has strong patterns: a word ending in a blank followed by G is often -ING, a Q is almost always followed by U, and many answers end in -ED, -ER, -LY or -S. Write in the parts you’re sure of, even a single suffix, and the crossing answers often fall into place.' },

      { h2: 'Start with what’s easy' },
      { p: 'Don’t solve in order. Scan all the clues first and fill in the ones you know immediately, especially short answers and fill-in-the-blank clues. Each answer gives you letters for its neighbours, so the puzzle gets easier as it fills. Getting stuck on clue one while easier clues sit unsolved is the most common beginner mistake.' },

      { h2: 'When several clues point at one answer' },
      { p: 'Some puzzles give you more than one clue for the same answer. Treat each clue as a filter rather than a separate question. List what the first clue might mean, then check each candidate against the second and third. The answer is the word that fits all of them. Often one clue is general, “a kind of tree”, and another is specific, “it gives syrup”, and together they leave only one possibility: MAPLE.' },

      { h2: 'Learn the regulars' },
      { p: 'Puzzle makers reuse words that fit grids well: short words with many vowels, and common letters. After a few weeks of regular solving you start recognising them. Keep a short list of answers that surprised you; reviewing it now and then builds the vocabulary that puzzles actually use, rather than the dictionary as a whole.' },

      { h2: 'Walk away and come back' },
      { p: 'When you are stuck, a break genuinely helps. Your brain keeps working on the problem, and when you return, an answer that seemed impossible is often obvious. If the puzzle is timed, skip the clue and come back to it after you’ve filled in more letters.' },

      { h2: 'Use hints to learn, not to finish' },
      { p: 'Revealing a letter isn’t cheating if it teaches you something. When you reveal an answer, go back and work out why it fits each clue. That’s how you learn the way puzzle makers think, and it is the fastest route to needing fewer hints next time.' },

      { h2: 'Practise a little, often' },
      { ul: [
        'Ten minutes a day beats an hour once a week. Pattern recognition improves with frequent, short practice.',
        'Choose puzzles slightly above your comfort level, and step back down when you stop enjoying them.',
        'Solve with someone else sometimes. You’ll pick up their way of reading clues.',
        'Read widely. Puzzles reward general knowledge across many subjects, a little at a time.',
      ] },

      { h2: 'Somewhere to practise' },
      { p: 'Any daily crossword in a newspaper or app is good practice. Our own game, Three Clues for Android, is built around the multiple-clue idea above: three clues, one answer to find, across 100 levels in five difficulty zones. It starts gently and ramps up, which suits the “slightly above your comfort level” approach, and it has timed challenges once you’re ready to work on speed.' },
    ],
  },
  {
    slug: 'host-a-trivia-night',
    title: 'How to host a trivia night your friends will actually enjoy',
    description:
      'Good trivia is about pacing, fair questions and a bit of drama, not just hard facts. How to plan rounds, write questions, keep score and run a quiz in person or online.',
    date: '2026-10-12',
    app: 'sleevr',
    body: [
      { p: 'A trivia night is one of the easiest ways to get a group of people laughing and arguing in the best way. It also goes wrong in predictable ways: questions so hard nobody scores, one know-it-all team running away with it, or a host lost in their own notes while the room gets bored. With a bit of planning, all of that is avoidable. Here’s how to run one, whether it’s five friends at home or a room full of colleagues.' },

      { h2: 'Plan the shape of the evening' },
      { p: 'Most good quizzes run between 60 and 90 minutes, including breaks. A reliable structure is five or six rounds of eight to ten questions each, with a short break in the middle for drinks and score updates. Teams of three to five people work best: big enough to pool knowledge, small enough that everyone gets a say.' },
      { ul: [
        'Mix general knowledge rounds with themed ones, such as music, geography, film or local history.',
        'Include at least one round that isn’t pure recall: a picture round, a music intro round, or “name the flag”.',
        'Save a fun or chaotic round for the end, when energy dips.',
      ] },

      { h2: 'Write questions people can get right' },
      { p: 'The best trivia questions feel gettable. Aim for most teams to get about half to two-thirds of the questions right. If nobody knows the answer, the question just creates silence; if everyone knows it, it creates no tension.' },
      { ul: [
        'Make answers unambiguous. “What is the largest desert?” causes an argument about Antarctica; “What is the largest hot desert?” doesn’t.',
        'Check every fact against two reliable sources. Popular trivia “facts” are often wrong.',
        'Avoid questions that need an exact number unless you accept a range.',
        'Spread topics so no single person or interest dominates.',
        'Write a few “groaners”: questions where the answer is obvious once you hear it. They get the best reactions.',
      ] },

      { h2: 'Multiple choice or open answers?' },
      { p: 'Multiple-choice questions are faster, friendlier for newcomers and easier to mark, which makes them good for mixed groups and online play. Open answers are harder and more satisfying for experienced players, but you need to decide in advance how strict to be with spelling and partial answers. Many quizzes mix the two: multiple choice early on, open answers in later rounds.' },

      { h2: 'Keep score fairly and visibly' },
      { p: 'Swap answer sheets between teams for marking, or mark them yourself during the next round. Announce scores between rounds; a visible scoreboard keeps everyone invested even when they are behind. A joker, where each team chooses one round to score double, gives trailing teams a way back and adds strategy.' },
      { p: 'Have a tiebreaker ready: a single question with a numeric answer, where the closest guess wins, ends ties quickly and fairly.' },

      { h2: 'Running it on the night' },
      { ol: [
        'Explain the rules once, clearly: no phones, how answers are marked, and what the prizes are.',
        'Read each question twice, and keep a steady pace. Long pauses kill the energy.',
        'Repeat all the questions at the end of each round before collecting answers.',
        'Read the answers out with a bit of theatre. The reveal is half the fun.',
        'Keep your own notes in one place, with the answers next to the questions.',
      ] },

      { h2: 'Running it online' },
      { p: 'For remote groups, a video call works if you share the questions on screen and collect answers through a shared form or the chat. Expect everything to take longer than in person, so cut a round. Trivia apps with live multiplayer remove the admin entirely: everyone answers on their own phone, timing is automatic, and the scoreboard updates itself.' },
      { p: 'Our own trivia game, Sleevr, is one option for that. It runs on Android and in the browser, with timed multiple-choice questions across categories, modes like Trivia Trails and Guess the Country, and real-time leaderboards, so a group can play against each other without anyone marking answer sheets.' },

      { h2: 'The short version' },
      { p: 'Keep it to about 90 minutes, write questions most teams can get, check every answer, mix up the rounds, and keep the scoreboard visible. The aim isn’t to prove who knows the most; it’s an evening everyone wants to repeat.' },
    ],
  },
  {
    slug: 'one-line-a-day-journal',
    title: 'How to keep a daily journal you’ll actually stick to',
    description:
      'Most journals are abandoned within weeks because they ask too much. How a one-line-a-day habit, small prompts and noticing ordinary moments make journaling easy to keep up.',
    date: '2026-10-12',
    app: 'days-end',
    body: [
      { p: 'Lots of people start a journal in January and stop by February. The usual reason isn’t lack of interest; it’s that the journal asks too much. A blank page every night, with the feeling that each entry should be thoughtful and complete, turns a pleasant habit into homework. The fix is to make each entry so small that skipping it feels silly.' },
      { p: 'This guide covers how to build a journaling habit that lasts, starting with one line a day.' },

      { h2: 'Start with one line' },
      { p: 'Commit to writing a single sentence about your day. Not the most important thing, not a reflection on your goals: just something that happened. “Made coffee and burned my tongue.” “Saw a double rainbow from the bus.” “Skipped the gym and didn’t feel guilty.” On a good day you can write more, but the promise is only one line.' },
      { p: 'One line takes under a minute, so there is never a reason to skip it. And after a year you have 365 small snapshots of your life, which is more than most people ever record.' },

      { h2: 'Attach it to something you already do' },
      { p: 'Habits stick best when they are linked to an existing routine. Write your line right after brushing your teeth at night, while the kettle boils in the morning, or as soon as you sit down on the bus home. Keep the journal, or the app, exactly where that moment happens.' },

      { h2: 'Notice the ordinary' },
      { p: 'A common worry is “nothing happened today”. Something always did; it just wasn’t dramatic. Ordinary moments are the ones you forget fastest and the ones that are most interesting to read back: what you ate, who you talked to, what the weather was like, a song stuck in your head. A good journal is mostly ordinary days.' },
      { p: 'If you are stuck, use a prompt:' },
      { ul: [
        'What made you smile today?',
        'What did you eat that you’d eat again?',
        'Who did you talk to that you don’t usually?',
        'What did you do for the first time, or the last time?',
        'What would you tell a friend about today in one sentence?',
      ] },

      { h2: 'Don’t break the chain, but don’t panic if you do' },
      { p: 'A visible streak, such as crosses on a calendar or a counter in an app, is a surprisingly strong motivator. But missing a day isn’t failure. The rule many people find helpful is “never miss twice”: if you skip a day, make sure you write the next one, even if it’s just “busy day, slept well”. You can also fill in yesterday’s line from memory; that still counts.' },

      { h2: 'Read it back' },
      { p: 'Part of what keeps people journaling is the reward of reading old entries. Once a month, scroll back through what you wrote. Patterns appear: the weeks you were happiest, the people who show up most, the things that consistently ruin your mood. Some people use a five-year journal, which puts the same date from each year on one page, so every entry comes with a reminder of where you were a year ago.' },

      { h2: 'Paper or phone?' },
      { p: 'Paper is calm, private and pleasant to hold, and handwriting slows you down in a good way. Your phone is always with you, which makes the one-line habit almost frictionless, and it can remind you at the same time each day. Choose the one you will actually have to hand at your journaling moment.' },
      { p: 'If you like the idea of logging small moments but want something lighter and more social than a private diary, our app Day’s End takes a different angle. You log everyday moments, like making coffee, skipping the gym or seeing a rainbow, and see how many people around the world did the same thing today. It’s a reminder that your ordinary day is shared with a lot of other people, and it can be a gentle way into the daily-noticing habit.' },

      { h2: 'The short version' },
      { p: 'Make the daily commitment tiny, tie it to a routine you already have, write about ordinary things, never miss twice, and read it back now and then. A journal you keep for a year in one-line entries beats a beautiful one you abandon in a month.' },
    ],
  },
  {
    slug: 'api-key-in-your-app-google-cloud-suspension',
    title: 'Google suspended my project over an API key in my app. Here’s how to avoid it',
    description:
      'In May 2026 Google Cloud suspended the project behind our trivia game, and the cause was an unrestricted API key inside the app. What went wrong, how we got reinstated, and how to keep keys out of your own builds.',
    date: '2026-10-12',
    app: 'sleevr',
    body: [
      { p: 'In May 2026, Google Cloud suspended the project behind Sleevr, our multiplayer trivia game. Everything on that project stopped working until it was sorted out. I’d like to say it was bad luck, but the cause was mine: a Gemini API key was compiled into every copy of the app we had shipped, with no application restrictions on it. Anyone who unpacked the APK could have pulled the key out and used it.' },
      { p: 'The project was reinstated a week later. This guide is what I learned, written for anyone shipping a mobile app that talks to a paid API.' },

      { h2: 'What went wrong' },
      { p: 'A mobile app is not a safe place for a secret. When you build an Android app, everything in it, including strings, config files and constants, ends up in the APK that users download. Tools to unpack an APK and read those strings are free and take minutes to use. Obfuscation makes it slower, not impossible.' },
      { p: 'Our key was an API key for Gemini, Google’s AI API, which is billed per request. It sat in the app with no restrictions saying which app or which APIs it could be used for. From Google’s side, a key like that is a risk to the project whether or not anyone has misused it yet, and keys found in public places get abused for exactly that reason.' },

      { h2: 'What I did to get reinstated' },
      { ol: [
        'Audited every key on the project, not just the one that caused the problem. There were four. For each, I listed where it was used and what it needed to call.',
        'Rotated them: created new keys, shipped the app changes that used them, and deleted the old ones, so the leaked key stopped working everywhere.',
        'Restricted every new key to the APIs it actually calls and to our app, so a copied key would be useless elsewhere.',
        'Scrubbed the keys from the repository history. Deleting a key from the current code isn’t enough while it’s still in old commits.',
        'Wrote up the whole thing for the appeal: what was exposed, how, what had been changed, and how it would be prevented. A clear, honest account is what the review needs to see.',
      ] },

      { h2: 'How to avoid it in your own app' },
      { p: 'The fixes are not complicated, and almost all of them take minutes. The hard part is doing them before you ship rather than after.' },

      { h2: '1. Keep paid API keys out of the app entirely' },
      { p: 'The safest key is one the app never contains. Instead of calling a paid API directly from the phone, have the app call your own backend, such as a Cloud Function, and let the backend call the API with a key kept in a secret manager. Your backend can then check who is asking, limit how often, and refuse anything unexpected. For AI APIs this also lets you change prompts and models without shipping an update.' },

      { h2: '2. Restrict every key that does ship' },
      { p: 'Some keys have to be in the app, such as the Firebase config or a Maps key. Google’s documentation is clear that the Firebase config isn’t a secret in itself, but every key should still be restricted in the Google Cloud console:' },
      { ul: [
        'Application restrictions: for Android, limit the key to your package name and your signing certificate’s SHA-1 fingerprint. For the web, limit it to your domains.',
        'API restrictions: allow only the APIs that key needs. A Maps key has no business calling Gemini.',
        'Remember that application restrictions on Android keys can be spoofed by a determined attacker, which is why paid APIs belong behind your backend rather than relying on restrictions alone.',
      ] },

      { h2: '3. Add App Check and budgets' },
      { p: 'Firebase App Check lets your backend and Firebase services reject requests that don’t come from your genuine app on a genuine device. Pair it with billing budgets and alerts in Google Cloud, so a sudden spike in usage emails you the same day instead of showing up at the end of the month. Quotas on individual APIs put a hard ceiling on how much a leaked key could cost.' },

      { h2: '4. Keep keys out of your repository' },
      { ul: [
        'Store keys in environment files or a secret manager that are excluded from version control, and add the filenames to .gitignore before you create them.',
        'Turn on secret scanning in your Git host. GitHub can block a push that contains a recognisable key.',
        'If a key is ever committed, treat it as leaked: rotate it first, then clean the history with a tool such as git filter-repo.',
      ] },

      { h2: '5. Audit before every release' },
      { p: 'Once per release, run through the list: which keys exist on the project, where each is used, what each is allowed to do, and whether any appear in the built app. Unpack your own APK and search it for “key” and “AIza”, the prefix Google API keys start with. If you can find a secret in a minute, so can anyone else.' },

      { h2: 'If it happens to you' },
      { p: 'Don’t panic, and don’t appeal immediately with a one-line request. Fix the problem completely first: rotate, restrict, remove from history and check every other key on the project. Then write an appeal that explains what happened, what you changed and how you’ll prevent it. In our case that got the project back within a week. The suspension was painful, but the project is now in better shape than it was before, and every app we build starts with these rules.' },
    ],
  },
  {
    slug: 'panic-button-that-works-with-bad-signal',
    title: 'How to build a panic button that still works with bad signal',
    description:
      'Security guards work nights at sites with weak signal, and a panic button that fails once is worse than none. How we designed the alert in the LISABEM guard app to get through anyway.',
    date: '2026-10-12',
    app: 'lisabem',
    body: [
      { p: 'LISABEM is a Kenyan security company, and we built the app their guards and managers use: shift sign-in at the site, live location while on duty, incident reports, and a one-tap panic button. Most of the app could tolerate the occasional failure. The panic button could not.' },
      { p: 'Guards work nights at sites where the mobile signal is weak or drops out entirely. A panic button that works in the office and fails at 2 a.m. on a remote site is worse than having none, because the guard believes help is coming. This guide explains how we designed the alert to get through anyway, and the principles apply to any app where one message absolutely has to arrive.' },

      { h2: 'Start from the failure, not the happy path' },
      { p: 'The obvious design is simple: tap the button, send a request to the server, the server notifies the managers. On a good connection that works every time. The question that shapes the real design is what happens when it doesn’t: the request times out, the phone is between towers, the data connection is up but nothing gets through.' },
      { p: 'So we listed the ways it could fail and made sure each one had an answer: no data connection, a slow connection that takes too long, the app being closed or the phone restarted before the alert is sent, and the alert arriving while every manager is asleep.' },

      { h2: '1. Save the alert on the phone first' },
      { p: 'The moment the guard taps the button, the alert is written to a queue on the phone before anything is sent. That means the alert exists even if the network is down, and it survives the app being closed. From then on, the phone keeps retrying the write until the server accepts it. Firebase’s offline persistence handles much of this, but the important decision is architectural: the alert is recorded locally first and delivered later, not sent once and hoped for.' },

      { h2: '2. Don’t wait forever for the server' },
      { p: 'Retrying in the background guarantees the alert arrives eventually, but eventually isn’t good enough in an emergency. So the phone also starts a timer. If the server hasn’t confirmed the alert within eight seconds, the phone stops waiting and texts the managers directly by SMS. SMS often gets through when mobile data won’t, because it needs far less from the network.' },
      { p: 'The background retry keeps running after the text is sent. Whichever channel succeeds first, the alert ends up recorded on the server too, with the guard’s location and time, so the incident appears in the dashboard and the reports.' },

      { h2: '3. Make sure someone actually notices' },
      { p: 'Delivering the alert isn’t the end of the job; someone has to see it. When the server receives a panic alert, every manager gets a push notification and an alarm that keeps ringing until someone acknowledges it. A normal notification at 2 a.m. is easy to sleep through or swipe away. An alarm that won’t stop until a person responds turns “delivered” into “handled”.' },

      { h2: 'Lessons for any must-arrive message' },
      { ul: [
        'Write it down locally before you try to send it. A message that only exists in a network request is one dropped connection away from being lost.',
        'Retry until confirmed, and make the server safe to receive the same alert twice, so retries and a second channel can’t create duplicate incidents.',
        'Have a second channel with different failure modes, and a deadline for switching to it. A few seconds is the right scale for an emergency.',
        'Require acknowledgement from a person, and escalate until you get it.',
        'Check the platform rules early. Sending an SMS silently from an app needs a permission that Google Play restricts to a few kinds of apps, and iOS always asks the user to tap Send. Those rules shape how a fallback can work.',
      ] },

      { h2: 'Test it where it will be used' },
      { p: 'An office with good wifi tells you almost nothing about a guard post at night. Test with airplane mode, with data off but calls and SMS on, with a weak signal, after a restart, and with the app closed. Test on the cheaper phones the guards actually carry, since aggressive battery savers on some Android phones stop apps working in the background. And test the whole chain: tap the button, then time how long it takes until a manager’s alarm rings.' },

      { h2: 'The short version' },
      { p: 'For anything safety-critical, assume the network will fail at the worst moment. Save the alert on the device, retry until confirmed, fall back to SMS after a short deadline, and keep alerting a human until one responds. The button should feel simple to the person pressing it, because all of that is happening behind it.' },
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
