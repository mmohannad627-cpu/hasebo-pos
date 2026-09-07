import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { ZipArchive } = require('archiver');

const output = fs.createWriteStream(path.join(process.cwd(), 'public', 'hasebo-pos-source.zip'));
const archive = new ZipArchive({
  zlib: { level: 9 }
});

output.on('close', function() {
  console.log(`ZIP created successfully: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
});

archive.on('error', function(err) {
  console.error('Archive error:', err);
  process.exit(1);
});

archive.pipe(output);

// Append files from project root
archive.glob('**/*', {
  cwd: process.cwd(),
  ignore: [
    'node_modules/**',
    'dist/**',
    '.git/**',
    'public/hasebo-pos-source.zip',
    '.tmp/**'
  ],
  dot: true
});

archive.finalize();
