// Writes out/sitemap.xml after `next build` (the postbuild script). It walks the
// static export rather than the data files, so every page that ships is listed
// and nothing has to be kept in sync by hand.
import { readdirSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const SITE = 'https://yarpdevelopers.com';
const OUT = 'out';
const SKIP = [/^404\.html$/, /^google[0-9a-f]+\.html$/, /^store\/success\.html$/, /^auth\//];

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '_next' ? [] : htmlFiles(path);
    return entry.name.endsWith('.html') ? [relative(OUT, path).split(sep).join('/')] : [];
  });
}

// index.html → /, pdfsign/index.html → /pdfsign, about.html → /about
const toUrl = (file) => {
  const path = file.replace(/(^|\/)index\.html$/, '').replace(/\.html$/, '');
  return `${SITE}/${path}`.replace(/\/$/, '');
};

const urls = htmlFiles(OUT)
  .filter((file) => !SKIP.some((re) => re.test(file)))
  .map(toUrl)
  .sort();

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map((url) => `  <url><loc>${url}</loc></url>`),
  '</urlset>',
  '',
].join('\n');

writeFileSync(join(OUT, 'sitemap.xml'), xml);
console.log(`sitemap.xml: ${urls.length} URLs`);
