const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  const svgBuffer = await fs.readFile(path.join(__dirname, '../public/chef-hat-icon.svg'));

  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, `../public/icon-${size}x${size}.png`));

    console.log(`Generated icon-${size}x${size}.png`);
  }

  // Generate Apple touch icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(__dirname, '../public/apple-touch-icon.png'));

  console.log('Generated apple-touch-icon.png');

  // Generate favicon.ico (multi-size)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, '../public/favicon-32x32.png'));

  await sharp(svgBuffer)
    .resize(16, 16)
    .png()
    .toFile(path.join(__dirname, '../public/favicon-16x16.png'));

  console.log('Generated favicon files');
}

generateIcons().catch(console.error);