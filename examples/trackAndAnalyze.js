#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { wrap } = require('../sapWrapper');
const { analyzeLogs } = require('../analyzeLogs');

const logPath = path.join(__dirname, '..', 'multi_agent_log.json');

async function example() {
  // start with a clean log file for this demo
  if (fs.existsSync(logPath)) {
    fs.unlinkSync(logPath);
  }
  fs.writeFileSync(logPath, '');

  async function dummyTask(msg) {
    return `echo:${msg}`;
  }

  const trackedTask = wrap(dummyTask);

  await trackedTask('first');
  await trackedTask('second');
  await trackedTask('third');

  console.log('\nAnalysis results:');
  analyzeLogs(logPath, { mode: 'summary' });
}

example().catch(err => {
  console.error('Example failed:', err);
});
