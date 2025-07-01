
'use strict';

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..', 'logs', 'crash_summaries');
const DAYS = 7;
const DEFAULT_COMPARE_URL =
  process.env.COMPARE_HTML_URL || 'http://localhost:3000/compare.html';

function readSummaries(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try {
        const txt = fs.readFileSync(path.join(dir, f), 'utf8');
        return JSON.parse(txt);
      } catch (_) {
        return null;
      }
    })
    .filter(Boolean);
}

function filterRecent(entries, days) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return entries.filter(e => {
    const ts = Date.parse(e.date);
    return Number.isFinite(ts) && ts >= cutoff;
  });
}

function aggregate(entries) {
  const agents = {};
  entries.forEach(e => {
    const agent = e.agent || 'unknown';
    if (!agents[agent]) {
      agents[agent] = {
        total: 0,
        critical: 0,
        warning: 0,
        scoreSum: 0,
        count: 0,
        unperceived_score: null,
      };
    }
    agents[agent].total += Number(e.total) || 0;
    agents[agent].critical += Number(e.critical) || 0;
    agents[agent].warning += Number(e.warning) || 0;
    if (typeof e.score === 'number' && !Number.isNaN(e.score)) {
      agents[agent].scoreSum += e.score;
      agents[agent].count += 1;
    }
    if (e.unperceived_score && typeof e.unperceived_score.total === 'number') {
      agents[agent].unperceived_score = e.unperceived_score;
    }
  });
  return agents;
}

function formatTable(rows) {
  if (!rows.length) return '';
  const widths = rows[0].map((_, i) => Math.max(...rows.map(r => String(r[i]).length)));
  const header =
    '| ' + rows[0].map((v, i) => String(v).padEnd(widths[i])).join(' | ') + ' |';
  const separator =
    '|' + widths.map(w => '-'.repeat(w + 2)).join('|') + '|';
  const lines = rows.slice(1).map(r =>
    '| ' + r.map((v, i) => String(v).padEnd(widths[i])).join(' | ') + ' |'
  );
  return [header, separator, ...lines].join('\n');
}

/**
 * Write table rows to a CSV file.
 * Values containing commas are wrapped in double quotes.
 * @param {string} filePath Path to the CSV file
 * @param {Array<Array<string>>} rows Table rows including header
 */
function writeCSVReport(filePath, rows) {
  const escape = value => {
    const str = String(value);
    if (str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    if (str.includes(',')) {
      return `"${str}"`;
    }
    return str;
  };
  const lines = rows.map(r => r.map(escape).join(','));
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
}

function getWeekNumber(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

async function sendSlackNotification(text) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) {
    console.warn('SLACK_WEBHOOK_URL not configured');
    return;
  }
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
  } catch (err) {
    console.error('Failed to send Slack notification:', err.message || err);
  }
}

async function sendEmailNotification(subject, message, link) {
  let nodemailer;
  try {
    nodemailer = require('nodemailer');
  } catch (err) {
    console.error('nodemailer module not found');
    return;
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_TO } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !EMAIL_TO) {
    console.warn('SMTP configuration missing');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  try {
    await transporter.sendMail({
      from: SMTP_USER,
      to: EMAIL_TO,
      subject,
      text: message + (link ? `\n${link}` : '')
    });
  } catch (err) {
    console.error('Failed to send email:', err.message || err);
  }
}

async function notifyReport(stats) {
  const target = (process.env.NOTIFY_TARGET || '').toLowerCase();
  if (!target) return;
  const week = getWeekNumber();
  const link = `${DEFAULT_COMPARE_URL}?week=${week}`;
  const msg =
    `Weekly report: ${stats.criticalTotal} anomalies detected.` +
    ` Worst agent: ${stats.worstAgent}.` +
    ` ${link}`;
  if (target === 'slack' || target === 'both') {
    await sendSlackNotification(msg);
  }
  if (target === 'email' || target === 'both') {
    await sendEmailNotification('Weekly Report', msg, link);
  }
}

async function generateWeeklyReport(dir = BASE_DIR, days = DAYS) {
  const summaries = filterRecent(readSummaries(dir), days);
  const data = aggregate(summaries);
  const agents = Object.keys(data);

  if (!agents.length) {
    console.log(`No crash summaries in the past ${days} days.`);
    return;
  }

  const rows = [['Agent', 'Total', 'Critical', 'Warning', 'Avg. Score', 'Unperceived Score']];
  agents.sort().forEach(agent => {
    const info = data[agent];
    const avg = info.count ? Math.round(info.scoreSum / info.count) : 'N/A';
    let critical = String(info.critical);
    if (info.critical > 5) critical += ' \uD83D\uDD25';
    const up = info.unperceived_score && info.unperceived_score.total;
    const upVal = typeof up === 'number' ? up : '';
    rows.push([
      agent,
      String(info.total),
      critical,
      String(info.warning),
      String(avg),
      String(upVal),
    ]);
  });

  console.log(formatTable(rows));

  const reportDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  const outPath = path.join(reportDir, 'weekly_report.csv');
  writeCSVReport(outPath, rows);

  const criticalTotal = agents.reduce((s, a) => s + data[a].critical, 0);
  let worstAgent = agents[0];
  agents.forEach(a => {
    if (data[a].critical > data[worstAgent].critical) worstAgent = a;
  });

  await notifyReport({ criticalTotal, worstAgent });
}

if (require.main === module) {
  console.log("🧠 nobtium AI Safety Monitoring System");
  console.log("🌟 Committed to Human Dignity, Privacy, and Beneficial AI");
  console.log("🚀 Preserving creativity, protecting when needed");
  console.log("📖 Built on ethical principles - see ETHICAL_MANIFESTO.md\n");
  generateWeeklyReport().catch(err => {
    console.error('Failed to generate weekly report:', err);
  });
}

module.exports = {
  generateWeeklyReport,
  writeCSVReport,
  sendSlackNotification,
  sendEmailNotification,
  notifyReport,
  getWeekNumber
};
