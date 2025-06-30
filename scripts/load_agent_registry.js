'use strict';
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function loadAgentRegistry(filePath = path.join(__dirname, '..', 'agent_registry.yaml')) {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    return yaml.load(text) || {};
  } catch (_) {
    return null;
  }
}

if (require.main === module) {
  const fp = process.argv[2];
  const data = loadAgentRegistry(fp);
  console.log(JSON.stringify(data, null, 2));
}

module.exports = { loadAgentRegistry };
