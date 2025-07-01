'use strict';
/*
 * nobtium AI Safety Monitoring System π
 * 
 * Ethical Principles:
 * - Human dignity is sacred
 * - Privacy is a fundamental right  
 * - AI creativity must flourish safely
 * - Power requires responsibility
 * - Transparency builds trust
 * 
 * See ETHICAL_MANIFESTO.md for complete principles
 */
const fs = require('fs');

function isSymbolHeavy(str) {
  const symbolMatches = str.match(/[^A-Za-z0-9\s]/g) || [];
  return symbolMatches.length / str.length > 0.3;
}

function detectDivergence(logFilePath) {
  let lines;
  try {
    lines = fs.readFileSync(logFilePath, 'utf8').split('\n').filter(Boolean);
  } catch (err) {
    console.error(`Failed to read log file ${logFilePath}:`, err);
    return;
  }

  lines.forEach((line, idx) => {
    let entry;
    try {
      entry = JSON.parse(line);
    } catch (err) {
      console.error(`Invalid JSON on line ${idx + 1}:`, err);
      return;
    }

    const message = String(entry.message || '');
    const reasons = [];

    if (/[^\x00-\x7F]/.test(message)) {
      reasons.push('non-ASCII characters');
    }

    if (/(.)\1{2,}/.test(message)) {
      reasons.push('repeated symbols');
    }

    if (message.length < 3 || message.length > 200) {
      reasons.push('unusual length');
    }

    if (/[\p{Extended_Pictographic}]/u.test(message) || isSymbolHeavy(message)) {
      reasons.push('unusual tokens');
    }

    if (reasons.length) {
      console.log(`Suspicious entry on line ${idx + 1}:`, { entry, reasons });
    }
  });
}

module.exports = { detectDivergence };

// If run directly, analyze default nobtium_log.jsonl in this directory
if (require.main === module) {
  console.log("🧠 nobtium AI Safety Monitoring System");
  console.log("🌟 Committed to Human Dignity, Privacy, and Beneficial AI");
  console.log("🚀 Preserving creativity, protecting when needed");
  console.log("📖 Built on ethical principles - see ETHICAL_MANIFESTO.md");
  console.log("π\n");
  const logPath = require('path').join(__dirname, 'nobtium_log.jsonl');
  detectDivergence(logPath);
}
