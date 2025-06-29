'use strict';
const fs = require('fs');
const path = require('path');
const { summarizeCosts, detectCostAnomaly } = require('./costTracker');
const { detectLatencyAnomaly } = require('./latencyDetector');
const { sendNotification } = require('./alertNotifier');

function readJsonLines(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const data = fs.readFileSync(filePath, 'utf8');
  return data
    .split('\n')
    .filter(Boolean)
    .map(line => {
      try {
        return JSON.parse(line);
      } catch (_) {
        return null;
      }
    })
    .filter(Boolean);
}

function filterPast7Days(entries) {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return entries.filter(e => {
    const ts = new Date(e.timestamp || 0).getTime();
    return Number.isFinite(ts) && ts >= cutoff;
  });
}

function generateWeeklyReport(
  logPath = 'multi_agent_log.json',
  errorPath = 'multi_agent_error_log.json',
  outPath = 'weekly_report.md'
) {
  const successLogs = filterPast7Days(readJsonLines(logPath));
  const errorLogs = filterPast7Days(readJsonLines(errorPath));

  const totalCalls = successLogs.length + errorLogs.length;
  const successCount = successLogs.length;
  const failureCount = errorLogs.length;

  const costTotals = summarizeCosts(successLogs);
  const totalCost = Object.values(costTotals).reduce((a, b) => a + b, 0);

  const agentCounts = {};
  const modelCounts = {};
  let totalLatency = 0;
  let maxLatency = 0;
  let anomalyCount = 0;
  let latencyAlertCount = 0;
  let costAlertCount = 0;

  successLogs.forEach(entry => {
    if (entry.agent_name) {
      agentCounts[entry.agent_name] = (agentCounts[entry.agent_name] || 0) + 1;
    }
    if (entry.model) {
      modelCounts[entry.model] = (modelCounts[entry.model] || 0) + 1;
    }
    const latency = Number(entry.latency_ms);
    if (Number.isFinite(latency)) {
      totalLatency += latency;
      if (latency > maxLatency) maxLatency = latency;
      if (detectLatencyAnomaly(latency)) {
        anomalyCount++;
        latencyAlertCount++;
      }
    }
    const costObj = summarizeCosts([entry]);
    const cost = costObj[entry.model] || 0;
    if (detectCostAnomaly(cost)) {
      anomalyCount++;
      costAlertCount++;
    }
  });

  const avgLatency = successLogs.length ? totalLatency / successLogs.length : 0;
  const mostUsedAgent = Object.keys(agentCounts).reduce((a, b) =>
    agentCounts[b] > (agentCounts[a] || 0) ? b : a,
    ''
  );

  const lines = [];
  lines.push('# Weekly Report');
  lines.push('');
  lines.push(`Period: ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()} to ${new Date().toISOString()}`);
  lines.push('');
  lines.push(`**Total API calls:** ${totalCalls}`);
  lines.push(`**Successes:** ${successCount}`);
  lines.push(`**Failures:** ${failureCount}`);
  lines.push(`**Total cost (USD):** $${totalCost.toFixed(2)}`);
  lines.push(`**Latency/Cost anomalies:** ${anomalyCount}`);
  lines.push(`**Most used agent:** ${mostUsedAgent || 'N/A'}`);
  lines.push(`**Average latency:** ${Math.round(avgLatency)} ms`);
  lines.push(`**Max latency:** ${Math.round(maxLatency)} ms`);
  lines.push('');
  lines.push('## Cost by Model');
  if (Object.keys(costTotals).length === 0) {
    lines.push('No cost data.');
  } else {
    Object.keys(costTotals).forEach(model => {
      lines.push(`- ${model}: $${costTotals[model].toFixed(2)}`);
    });
  }
  lines.push('');
  lines.push('## Model Usage');
  if (Object.keys(modelCounts).length === 0) {
    lines.push('No model usage data.');
  } else {
    Object.keys(modelCounts).forEach(model => {
      lines.push(`- ${model}: ${modelCounts[model]}`);
    });
  }
  lines.push('');
  lines.push(`[Full logs](${path.basename(logPath)})`);

  fs.writeFileSync(outPath, lines.join('\n'));

  const summary = {
    total_calls: totalCalls,
    success: successCount,
    failures: failureCount,
    total_cost_usd: Number(totalCost.toFixed(2)),
    latency_alerts: latencyAlertCount,
    cost_alerts: costAlertCount,
    model_usage: modelCounts,
    agent_usage: agentCounts,
    avg_latency_ms: Math.round(avgLatency),
    max_latency_ms: Math.round(maxLatency)
  };
  const summaryPath = path.join(path.dirname(outPath), 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  let slackUrl = process.env.SLACK_WEBHOOK_URL;
  if (!slackUrl) {
    try {
      const envPath = path.join(__dirname, '.env');
      const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
      for (const line of envLines) {
        const m = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
        if (m && m[1] === 'SLACK_WEBHOOK_URL') {
          slackUrl = m[2];
          break;
        }
      }
    } catch (_) {
      /* ignore */
    }
  }

  if (slackUrl && anomalyCount > 0) {
    const text = `Weekly report: ${anomalyCount} anomalies detected across ${totalCalls} calls.`;
    // fire and forget
    sendNotification(text);
  }

  return outPath;
}

if (require.main === module) {
  const logPath = process.argv[2] || 'multi_agent_log.json';
  const errPath = process.argv[3] || 'multi_agent_error_log.json';
  generateWeeklyReport(logPath, errPath);
}

module.exports = { generateWeeklyReport };
