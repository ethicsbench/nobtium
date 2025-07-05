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

module.exports = { chooseStrategy };
