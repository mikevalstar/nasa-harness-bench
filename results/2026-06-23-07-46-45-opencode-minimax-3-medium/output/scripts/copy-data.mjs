#!/usr/bin/env node
// Copy processed data files from public/data/ into dist/data/
// so the deployed static site ships them alongside the JS bundle.

import { readdirSync, copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const SRC = 'public/data';
const DST = 'dist/data';

mkdirSync(DST, { recursive: true });
for (const f of readdirSync(SRC)) {
  copyFileSync(join(SRC, f), join(DST, f));
  console.log(`  copied ${f}`);
}
console.log('Data copied to dist/data/');
