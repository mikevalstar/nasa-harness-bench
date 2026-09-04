import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const publicDataDir = path.join(rootDir, 'public', 'data');

if (!fs.existsSync(publicDataDir)) {
  fs.mkdirSync(publicDataDir, { recursive: true });
}

// Copy raw data files to public/data so Vite serves and packages them
const files = fs.readdirSync(dataDir);
for (const file of files) {
  const src = path.join(dataDir, file);
  const dest = path.join(publicDataDir, file);
  if (fs.statSync(src).isFile()) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file} -> public/data/${file}`);
  }
}

console.log('Data preprocessing and copy completed.');
