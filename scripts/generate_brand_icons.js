import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generateIcons() {
  const svgPath = path.join(process.cwd(), 'public', 'brand', 'logo', 'hasebo-icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // 1. icon-192.png
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(process.cwd(), 'public', 'icon-192.png'));
  console.log('Created public/icon-192.png');

  // 2. icon-512.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(process.cwd(), 'public', 'icon-512.png'));
  console.log('Created public/icon-512.png');

  // 3. brand icons
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(process.cwd(), 'public', 'brand', 'icons', 'hasebo-pwa-192.png'));

  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(process.cwd(), 'public', 'brand', 'icons', 'hasebo-pwa-512.png'));

  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(process.cwd(), 'public', 'brand', 'icons', 'hasebo-maskable.png'));

  await sharp(svgBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.join(process.cwd(), 'public', 'brand', 'icons', 'hasebo-favicon.png'));

  console.log('All brand icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
