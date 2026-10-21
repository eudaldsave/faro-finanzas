// Checks that every internal href/src in the built site points to an existing file (and #anchor when static).
// Usage: node check-links.cjs [siteDir]   (default: ../faro)
const fs = require('fs');
const path = require('path');

const site = path.resolve(__dirname, process.argv[2] || '../faro');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const pages = walk(site).filter((f) => f.endsWith('.html'));
// Anchors created at runtime by scripts (glossary terms) are listed here
const dynamicIds = { 'glosario.html': /^[a-z0-9-]+$/ };

let problems = 0;
for (const page of pages) {
  const html = fs.readFileSync(page, 'utf8');
  for (const m of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const ref = m[1].replace(/&amp;/g, '&');
    if (/^(https?:|mailto:|tel:|data:)/.test(ref) || ref === '#') continue;
    const [file, hash] = ref.split('#');
    const target = file ? path.resolve(path.dirname(page), file.split('?')[0]) : page;
    const rel = path.relative(site, page);
    if (!fs.existsSync(target)) { console.log(`MISSING  ${rel} -> ${ref}`); problems += 1; continue; }
    if (hash && target.endsWith('.html')) {
      const dyn = dynamicIds[path.relative(site, target).replace(/\\/g, '/')];
      const has = fs.readFileSync(target, 'utf8').includes(`id="${hash}"`);
      if (!has && !(dyn && dyn.test(hash))) { console.log(`NO ANCHOR ${rel} -> ${ref}`); problems += 1; }
    }
  }
}
console.log(problems ? `${problems} problem(s) in ${pages.length} pages` : `OK: ${pages.length} pages, all internal links resolve`);
process.exit(problems ? 1 : 0);
