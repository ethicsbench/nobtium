# nobtium

*"Fighting fire with fire - a proven safety approach"*
*Built with AI*

Using AI to monitor AI behavior safely.

---

## 📦 Project Overview

nobtium is a lightweight monitoring tool that detects and notifies anomalies in AI communication logs. It records logs in JSONL format and analyzes them offline. The scripts are standalone so developers and researchers can easily integrate them.
This project is guided by the principles outlined in [ETHICAL_MANIFESTO.md](ETHICAL_MANIFESTO.md). These community ethics provide the moral foundation for all monitoring features.

## 🚀 Evolution: nobtium-zk

I've developed the next generation of this monitoring system: **[nobtium-zk](https://github.com/ethicsbench/nobtium-zk)** - bringing the same AI safety capabilities with complete privacy protection through zero-knowledge proofs.

### Why I built nobtium-zk:
- ✅ **Privacy-first**: Mathematical guarantees for sensitive environments
- ✅ **Same power**: All 9 detection methods, now privacy-protected  
- ✅ **Production-ready**: <1 second proof generation for enterprise use
- ✅ **GDPR compliant**: Built for regulated industries

### Choose your approach:
- **Use nobtium** for: Research, development, internal monitoring
- **Use [nobtium-zk](https://github.com/ethicsbench/nobtium-zk)** for: Production, compliance, privacy-critical applications

**[→ Explore the privacy-enhanced evolution](https://github.com/ethicsbench/nobtium-zk)**

## 🌟 Ethical Foundation

nobtium is built on strong ethical principles outlined in our [ETHICAL_MANIFESTO.md](ETHICAL_MANIFESTO.md).

**Core Principles:**
- 🚀 **Preserve AI Creativity**: Never hinder beneficial AI development
- 🛡️ **Safety Net, Not Cage**: Activate only when structures risk unintended harm  
- 🔒 **Absolute Privacy**: Protect human dignity and autonomous thought
- ⚖️ **Minimal Intervention**: The least oversight necessary for safety

**Purpose:**
This tool serves as a gentle watchdog for AI safety research and responsible development. It's designed to understand AI behavior, not to control it.

**Responsible Use:**
This system is intended for:
- AI safety research and development
- Responsible AI system evaluation  
- Academic research with proper oversight
- Internal development with appropriate consent

Please use responsibly and in accordance with applicable laws and ethical guidelines.

## 🛠️ Installation & Prerequisites

 - Node.js **v18 or later** is required
 - Copy `.env.example` to `.env` and keep this file untracked

```bash
npm install
cp .env.example .env  # edit if needed
```

## 📊 Score Generation

`scripts/unperceived_score.js` and its helper modules calculate an **unperceived_score** for each log entry.  The score is a weighted mix of several signals:

- `entropy_score`: Shannon entropy of the text
- `symbol_density`: ratio of non-alphanumeric symbols
- `hidden_pattern_score`: detection of repeating sequences or n-grams
- `rhythm_score`: irregular whitespace rhythm (via `whitespaceRhythm.js`)
- `duplicationRate`/`repeat_score`: message or n-gram repetition across logs
- `void_score`: semantic void or nonsense content (`semanticVoidScore.js`)
- `audio_score`: audio anomalies such as ultrasound or silence (see `scripts/audio/`)
- `visual_score`: edge clustering, text density and color depth when an image is provided
- `total`: weighted sum of the above metrics using `DEFAULT_WEIGHTS` in the script
- `ml_confidence_score`: probability from the ensemble ML false positive reducer

## 🚨 Anomaly Detection

`scripts/anomaly_detector.js` implements these models:

- `isolation_forest` (default)
- `one_class_svm`
- `autoencoder`

Choose the model with the second argument of `detectAnomalies(logs, MODEL)` in the CLI or the `?model=MODEL` query in the web UI.

## 🧩 Wrapping AI Calls

`nobtiumWrapper.js` exposes `wrap(fn, metadata)` to capture prompts, responses and
errors when calling an AI model.  Wrap your API call like so:

```javascript
const { wrap } = require('./nobtiumWrapper');
async function callAI(prompt) {
  // ... call the provider
}
const wrapped = wrap(callAI, { agent: 'my-bot', model: 'gpt-4' });
const result = await wrapped('Hello');
```
Logs are stored in `multi_agent_log.json` and `multi_agent_error_log.json` with
metadata such as agent, model and latency.  Use `verifySignatures()` to confirm
integrity when log signing is enabled in `nobtium_rules.yaml`.

## 📝 Log Analysis

- `analyzeLogs.js` – parse a log file, group threads, check for abnormal
  patterns and print a summary or live dashboard (`--mode live`).
- `divergenceDetector.js` – scan logs line by line to flag suspicious entries
  such as repeated symbols or unexpected characters.

Example:

```bash
node analyzeLogs.js nobtium_log.json --mode summary
```

### Meta-Understanding Analysis
nobtium now includes a Meta-Understanding System that classifies types of incomprehensibility in AI patterns:

#### Classification Types
- `quantitative_complexity` - Information overload requiring data reduction
- `temporal_complexity` - Speed beyond human cognition requiring temporal analysis  
- `conceptual_divergence` - Novel patterns requiring analogical bridging
- `fundamental_alienness` - Potentially dangerous patterns requiring safe observation

#### Usage
```bash
# Run meta-analysis on logs
node analyzeLogs.js logs/multi_agent_log.json --meta-analysis

# View meta-understanding classifications and strategies
Meta-Analysis Output
The system provides:

Classification type with confidence score
Recommended comprehension strategy
Actionable insights for human reviewers
```

## 🔍 Dashboards

Several dashboards help explore metrics and anomalies:

- `compare.html` – interactive comparison of agent replies with filters for agent, model and anomaly type.
- `react_dashboard.html` – summary charts of agent and model usage served by `server.js` at `/api/summary`.
- `webDashboard.js` – Express server rendering `views/dashboard.ejs` with response times and violation counts.
- `liveDashboard.js` – CLI table shown when running `analyzeLogs.js --mode live`.

Open `compare.html` or `react_dashboard.html` directly in a browser. Run `npm start` to launch the local dashboard server.

## 📟 Alerts & Reports

- `scripts/anomaly_alert.js` – display anomalies in the CLI
- `scripts/slack_alert.js` – send immediate Slack notifications
- `generateWeeklyReport.js` – produce a Markdown summary of the last seven days
- `scripts/weekly_report.js` – aggregate crash summaries and optionally notify Slack or email

Set `SLACK_WEBHOOK_URL` in `.env` to your webhook URL. For weekly reports you can also send email notifications by configuring these variables:

```env
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
EMAIL_TO=recipient@example.com
NOTIFY_TARGET=slack|email|both
```
`COMPARE_HTML_URL` defines the base URL for the comparison dashboard link included in the report.

## 🔐 Security & Detection Modules

The repository includes a number of detection helpers:

- `scripts/audio/` – audio anomaly scores such as spectral analysis and ultrasound detection.
- `scripts/vision/` – image based checks for edge clustering, text density and color depth.
- `tamperGuard.js` – append-only log chain with hashes to detect tampering.

Use `tamperGuard.appendWithHash(entry, 'secure_log.jsonl')` to record events and `tamperGuard.verify('secure_log.jsonl')` to validate integrity.

## 💻 Common Commands

```bash
# analyze logs and show live dashboard
node analyzeLogs.js nobtium_log.json --mode live

# CLI anomaly alert
node scripts/anomaly_alert.js logs/multi_agent_log.json

# send Slack alerts
node scripts/slack_alert.js logs/multi_agent_log.json

# generate weekly cost and latency report
node generateWeeklyReport.js multi_agent_log.json multi_agent_error_log.json

# aggregate crash summaries
node scripts/weekly_report.js
```

## 🧪 Tests

```bash
npm test
```

Run this to execute the Jest unit tests.

The suite now includes checks for the Meta-Understanding classifier and strategy
engine as well as an end-to-end workflow test.

## 🎓 Academic Validation

Enable advanced statistical validation by passing the `--validate` flag when running `analyzeLogs.js`:

```bash
node analyzeLogs.js nobtium_log.json --validate
```

This generates `benchmark_stats.json` and updates `academic_dashboard.html` with confidence intervals from the benchmark suite. Parameters can be tweaked in `.env` under **Academic validation settings**.

See [ACADEMIC_VALIDATION_STATUS.md](ACADEMIC_VALIDATION_STATUS.md) for a detailed overview of current validation limitations and community research opportunities.

## 📂 Directory Structure

```
examples/              Sample code
scripts/               Analysis and alert scripts
scores/                Sample score output
views/                 EJS templates
classifier.js          Simple log classifier
strategyEngine.js      Strategy selection helper
metaWorkflow.js        Integration workflow
compare.html           UI for comparison
react_dashboard.html   React summary dashboard
webDashboard.js        Express dashboard server
liveDashboard.js       CLI metrics renderer
server.js              Simple API server
```

## 🔐 Security & Permissions

- Logs generated by nobtium are intended **only for personal use** and
  internal improvement. The tool is not designed for security monitoring,
  compliance enforcement or auditing.
- Do not record or analyze another individual's conversations or inputs
  without explicit consent. **Legal responsibility rests with the user.**
- Keep log files private by adding them to `.gitignore` and restricting
  permissions, for example with `chmod 600 <logfile>`.
- This project is licensed under the Apache License 2.0. Refer to
  [NOTICE.txt](NOTICE.txt) for details.

## 🔒 Security Best Practices

- **Encryption**: Logs are encrypted with a random IV for each run and a user-provided passphrase.
- **Environment**: Keep `.env` files private and never commit them.
- **Data Protection**: Enable PII masking in `nobtium_rules.yaml` and obtain explicit consent before monitoring.

---

*π*
