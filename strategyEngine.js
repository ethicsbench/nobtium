'use strict';


function chooseStrategy(classification) {
  switch (classification) {
    case 'anomaly':
      return 'strict';
    case 'warning':
      return 'medium';
    case 'normal':
      return 'basic';
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

