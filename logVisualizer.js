'use strict';
const chalk = require('chalk');
const { generateReport } = require('./reportGenerator');

function printReport(patternResults, options = {}) {
  if (!patternResults || typeof patternResults !== 'object') {
    console.log(chalk.red('Invalid pattern results'));
    return;
  }

  const { flags: filterFlags, detailed = false } = options;

  // Filter results by flag type if requested
  const filtered = {};
  Object.keys(patternResults).forEach(threadId => {
    const flags = Array.isArray(patternResults[threadId]) ? patternResults[threadId] : [];
    const usableFlags = Array.isArray(filterFlags) && filterFlags.length
      ? flags.filter(f => filterFlags.includes(f))
      : flags;
    if (usableFlags.length > 0) {
      filtered[threadId] = usableFlags;
    }
  });

  if (Object.keys(filtered).length === 0) {
    console.log(chalk.green('No flagged threads.'));
    return;
  }

  const colorMap = {
    repetition: chalk.yellow,
    'intent-shift': chalk.red,
    'rapid-fire': chalk.cyan,
  };

  if (detailed) {
    const baseReport = generateReport(filtered);
    baseReport.split('\n').forEach(line => {
      if (!line.trim()) return;
      const match = line.match(/Thread (.+?) flagged for: (.+)/);
      if (!match) {
        console.log(line);
        return;
      }
      const threadId = match[1];
      const flags = match[2].split(',').map(f => f.trim());
      const coloredFlags = flags.map(f => {
        const color = colorMap[f] || chalk.magenta;
        return color(f);
      }).join(', ');
      console.log(`Thread ${chalk.bold(threadId)} flagged for: ${coloredFlags}`);
    });
  } else {
    const counts = {};
    Object.values(filtered).forEach(flags => {
      flags.forEach(f => {
        counts[f] = (counts[f] || 0) + 1;
      });
    });
    Object.keys(counts).forEach(flag => {
      const color = colorMap[flag] || chalk.magenta;
      console.log(color(`${flag}: ${counts[flag]} thread(s)`));
    });
  }
}

module.exports = { printReport };
