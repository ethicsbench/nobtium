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
  console.log("🧠 nobtium AI Safety Monitoring System");
  console.log("🌟 Committed to Human Dignity, Privacy, and Beneficial AI");
  console.log("🚀 Preserving creativity, protecting when needed");
  console.log("📖 Built on ethical principles - see ETHICAL_MANIFESTO.md");
  console.log("π  Built for human-AI cooperation\n");
  const fp = process.argv[2];
  const data = loadAgentRegistry(fp);
  console.log(JSON.stringify(data, null, 2));
}

module.exports = { loadAgentRegistry };
