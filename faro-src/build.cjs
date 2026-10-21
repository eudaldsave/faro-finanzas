// Faro Finanzas — composes static pages from partials.
// Usage: node build.cjs [outDir]   (default: ../faro)
//
// Each page in pages/ starts with a meta comment:
//   <!--meta title="..." desc="..." section="glosario" scripts="home.js" -->
// and may use {{> name}} for any file in partials/ and {{root}} (relative path to the site root).
//
// Course lessons (curso/<id>.html) are not published as pages: /api/leccion serves them to signed-in
// students. They are validated here so a broken lesson or quiz fails the build (and the deploy).
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
    html.replace(/\{\{> ([\w-]+)\}\}/g, (_, name) => {
      if (!(name in partials)) throw new Error(`${rel}: unknown partial {{> ${name}}}`);
      return partials[name];
    }),
    scripts,
    '</body>\n</html>\n',
  ].join('\n').replaceAll('{{root}}', root);

  const dest = path.join(out, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, page);
  count += 1;
}

// Lessons: every lesson in the temario has a file, a valid quiz and working site links
const temario = JSON.parse(fs.readFileSync(path.join(src, 'assets', 'temario.json'), 'utf8'));
let lessons = 0;
for (const lesson of temario.modules.flatMap((m) => m.lessons || [])) {
  const rel = `curso/${lesson.id}.html`;
  const file = path.join(src, rel);
  if (!fs.existsSync(file)) throw new Error(`${rel}: listed in temario.json but missing`);
  const html = fs.readFileSync(file, 'utf8');
  const quizMatch = html.match(/<!--quiz([\s\S]*?)-->/);
  if (!quizMatch) throw new Error(`${rel}: missing <!--quiz [...] --> block`);
  let quiz;
  try { quiz = JSON.parse(quizMatch[1]); } catch (err) { throw new Error(`${rel}: quiz is not valid JSON (${err.message})`); }
  if (!Array.isArray(quiz) || quiz.length === 0) throw new Error(`${rel}: quiz must be a non-empty array`);
  quiz.forEach((q, i) => {
    const valid = typeof q.q === 'string' && Array.isArray(q.options) && q.options.length >= 2
      && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length && typeof q.why === 'string';
    if (!valid) throw new Error(`${rel}: quiz question ${i + 1} needs q, options, answer (index) and why`);
  });
  for (const [, href] of html.matchAll(/href="(\/[^"#?]*)/g)) {
    if (!fs.existsSync(path.join(out, href))) throw new Error(`${rel}: broken link ${href}`);
  }
  lessons += 1;
}

console.log(`Built ${count} pages into ${out}; ${lessons} lessons checked`);
