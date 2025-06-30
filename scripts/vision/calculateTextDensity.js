'use strict';
const sharp = require('sharp');
const Tesseract = require('tesseract.js');

async function calculateTextDensity(imageBuffer) {
  if (!imageBuffer) return 0;
  const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng');
  const clean = text.replace(/\s/g, '');
  const charCount = clean.length;
  const { width, height } = await sharp(imageBuffer).metadata();
  const area = width * height;
  if (area === 0) return 0;
  return (charCount / area) * 100;
}

module.exports = { calculateTextDensity };
