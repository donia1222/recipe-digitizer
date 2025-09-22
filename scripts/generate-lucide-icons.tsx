import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChefHat } from 'lucide-react';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Generar el SVG con el icono de Lucide
function generateSVG(size: number) {
  const iconSize = size * 0.6; // El icono ocupa el 60% del canvas
  const padding = (size - iconSize) / 2;

  const svg = renderToStaticMarkup(
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
    >
      {/* Fondo azul con bordes redondeados */}
      <rect
        width={size}
        height={size}
        fill="#3B82F6"
        rx={size * 0.15}
      />

      {/* Icono de ChefHat centrado */}
      <g transform={`translate(${padding}, ${padding})`}>
        <ChefHat
          size={iconSize}
          color="white"
          strokeWidth={2}
        />
      </g>
    </svg>
  );

  return `<?xml version="1.0" encoding="UTF-8"?>${svg}`;
}

async function generateIcons() {
  // Generar cada tamaño de icono
  for (const size of sizes) {
    const svg = generateSVG(size);
    const buffer = Buffer.from(svg);

    await sharp(buffer)
      .png()
      .toFile(path.join(process.cwd(), `public/icon-${size}x${size}.png`));

    console.log(`Generated icon-${size}x${size}.png`);
  }

  // Generar Apple touch icon
  const appleSvg = generateSVG(180);
  await sharp(Buffer.from(appleSvg))
    .png()
    .toFile(path.join(process.cwd(), 'public/apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // Generar favicons
  const favicon32Svg = generateSVG(32);
  await sharp(Buffer.from(favicon32Svg))
    .png()
    .toFile(path.join(process.cwd(), 'public/favicon-32x32.png'));

  const favicon16Svg = generateSVG(16);
  await sharp(Buffer.from(favicon16Svg))
    .png()
    .toFile(path.join(process.cwd(), 'public/favicon-16x16.png'));

  console.log('Generated favicon files');
}

generateIcons().catch(console.error);