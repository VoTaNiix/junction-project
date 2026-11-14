// Regenerates src/main/resources/seed.json from js/seed.js so the Scala server and the
// browser's offline mode start from exactly the same synthetic data.
// Run after editing js/seed.js:  node scripts/export-seed.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { buildSeed } = await import(pathToFileURL(join(root, 'js', 'seed.js')).href);
const out = join(root, 'src', 'main', 'resources', 'seed.json');
writeFileSync(out, JSON.stringify(buildSeed(), null, 2) + '\n', 'utf8');
console.log(`Wrote ${out}`);
