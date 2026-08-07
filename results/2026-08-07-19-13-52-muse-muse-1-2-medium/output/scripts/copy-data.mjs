import { cpSync, mkdirSync } from 'fs'
mkdirSync('dist/data', { recursive: true })
cpSync('data', 'dist/data', { recursive: true })
console.log('copied data/ -> dist/data/')
