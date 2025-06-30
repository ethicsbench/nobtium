'use strict';
const sharp = require('sharp');

async function calculateEdgeClusterScore(imageBuffer) {
  if (!imageBuffer) return 0;

  const kernel = {
    width: 3,
    height: 3,
    kernel: [
      -1, -1, -1,
      -1, 8, -1,
      -1, -1, -1
    ]
  };

  const { data, info } = await sharp(imageBuffer)
    .grayscale()
    .convolve(kernel)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const cellSizeX = Math.ceil(width / 10);
  const cellSizeY = Math.ceil(height / 10);
  const cells = Array.from({ length: 100 }, () => 0);
  let total = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const val = Math.abs(data[idx]);
      total += val;
      const cellX = Math.floor(x / cellSizeX);
      const cellY = Math.floor(y / cellSizeY);
      const cellIdx = cellY * 10 + cellX;
      cells[cellIdx] += val;
    }
  }
  if (total === 0) return 0;
  const maxCell = Math.max(...cells);
  return maxCell / total;
}

module.exports = { calculateEdgeClusterScore };
