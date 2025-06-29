'use strict';
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

function getSummaryPath() {
  return process.env.SUMMARY_JSON_PATH || path.join(__dirname, 'summary.json');
}

app.get('/api/summary', (req, res) => {
  const summaryPath = getSummaryPath();
  if (!fs.existsSync(summaryPath)) {
    return res.status(404).json({ error: 'Summary not found' });
  }
  try {
    const data = fs.readFileSync(summaryPath, 'utf8');
    const summary = JSON.parse(data);
    res.json(summary);
  } catch {
    res.status(500).json({ error: 'Invalid summary format' });
  }
});

function start(port = 3001) {
  return app.listen(port, () => {
    console.log(`Server on http://localhost:${port}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = { app, start };
