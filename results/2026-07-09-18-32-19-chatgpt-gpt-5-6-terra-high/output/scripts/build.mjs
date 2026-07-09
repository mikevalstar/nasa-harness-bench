import { cp, mkdir, rm } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('src', 'dist', { recursive: true });
await cp('data', 'dist/data', { recursive: true });
console.log('Built static Orbitarium into dist/.');
