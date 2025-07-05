'use strict';


function chooseStrategy(classification) {
  if (!classification || typeof classification !== 'object') {
    return 'unknown';
  }
  switch (classification.type) {
    case 'quantitative_complexity':
      return 'data_reduction';
    case 'temporal_complexity':
      return 'temporal_transformation';
    case 'conceptual_divergence':
      return 'analogical_bridge';
    case 'fundamental_alienness':
      return 'safe_observation';
    default:
      return 'unknown';
  }
}


function generateStrategy(classifications = []) {
  const counts = classifications.reduce((acc, c) => {
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});
  const recommendation = counts.anomaly > 0
    ? 'Investigate anomalies'
    : 'Logs normal';
  return { counts, recommendation };
}

module.exports = { chooseStrategy, generateStrategy };

