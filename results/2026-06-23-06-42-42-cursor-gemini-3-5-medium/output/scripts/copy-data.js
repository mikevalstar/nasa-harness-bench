import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'data');
const destDir = path.join(process.cwd(), 'public', 'data');

console.log('Copying data files from', srcDir, 'to', destDir);

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const filesToCopy = [
  'asteroids.json',
  'close-approaches.json',
  'comets.json',
  'planets.json',
  'provenance.json',
  'sentry.json'
];

for (const file of filesToCopy) {
  const srcPath = path.join(srcDir, file);
  const destPath = path.join(destDir, file);
  if (fs.existsSync(srcPath)) {
    console.log(`Copying ${file}...`);
    fs.copyFileSync(srcPath, destPath);
  } else {
    console.warn(`Warning: Source file ${srcPath} does not exist.`);
  }
}

console.log('Data copying complete.');
