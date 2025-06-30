'use strict';
const sharp = require('sharp');

async function calculateColorDepthScore(imageBuffer) {
  if (!imageBuffer) return 0;
  const { data, info } = await sharp(imageBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const totalPixels = width * height;
  if (totalPixels === 0) return 0;

  const sample = Math.min(totalPixels, 10000);
  const step = Math.floor(totalPixels / sample);
  const colors = new Set();

  for (let i = 0; i < sample; i++) {
    const idx = i * step * channels;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    colors.add(`${r},${g},${b}`);
  }

  const diversity = colors.size / sample;
  return 1 - diversity;
}

module.exports = { calculateColorDepthScore };
