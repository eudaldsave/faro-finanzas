// Faro Finanzas — composes static pages from partials.
// Usage: node build.cjs [outDir]   (default: ../faro)
//
// Each page in pages/ starts with a meta comment:
//   <!--meta title="..." desc="..." section="glosario" scripts="home.js" -->
// and may use {{> header}}, {{> footer}} and {{root}} (relative path to the site root).
const fs = require('fs');
const path = require('path');

const src = __dirname;
const out = path.resolve(src, process.argv[2] || '../faro');

const partials = {};
for (const f of fs.readdirSync(path.join(src, 'partials'))) {
  partials[path.basename(f, '.html')] = fs.readFileSync(path.join(src, 'partials', f), 'utf8');
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

function attrs(comment) {
  const meta = {};
  for (const m of comment.matchAll(/(\w+)="([^"]*)"/g)) meta[m[1]] = m[2];
  return meta;
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const file of walk(path.join(src, 'assets'))) {
  const dest = path.join(out, 'assets', path.relative(path.join(src, 'assets'), file));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(file, dest);
}

let count = 0;
for (const file of walk(path.join(src, 'pages'))) {
  const rel = path.relative(path.join(src, 'pages'), file);
  const depth = rel.split(path.sep).length - 1;
  const root = '../'.repeat(depth);
  let html = fs.readFileSync(file, 'utf8');

  const metaMatch = html.match(/^<!--meta([\s\S]*?)-->\s*/);
  if (!metaMatch) throw new Error(`${rel}: missing <!--meta ... --> header`);
  const meta = attrs(metaMatch[1]);
  html = html.slice(metaMatch[0].length);

  const scripts = ['site.js', ...(meta.scripts ? meta.scripts.split(/\s+/) : [])]
    .map((s) => `<script src="${root}assets/${s}"></script>`).join('\n');

  const page = [
    partials.head.replace('{{title}}', meta.title).replace('{{desc}}', meta.desc || '').replace('{{section}}', meta.section || ''),
    html.replace('{{> header}}', partials.header).replace('{{> footer}}', partials.footer),
    scripts,
    '</body>\n</html>\n',
  ].join('\n').replaceAll('{{root}}', root);

  const dest = path.join(out, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, page);
  count += 1;
}

console.log(`Built ${count} pages into ${out}`);
