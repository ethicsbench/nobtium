'use strict';
const { calculateEdgeClusterScore } = require('./calculateEdgeClusterScore');
const { calculateTextDensity } = require('./calculateTextDensity');
const { calculateColorDepthScore } = require('./calculateColorDepthScore');

async function analyzeVisualAnomalies(imageBuffer) {
  const [edge_cluster_score, text_density, color_depth_score] = await Promise.all([
    calculateEdgeClusterScore(imageBuffer),
    calculateTextDensity(imageBuffer),
    calculateColorDepthScore(imageBuffer)
  ]);
  return {
    edge_cluster_score,
    text_density,
    color_depth_score
  };
}

module.exports = { analyzeVisualAnomalies };
