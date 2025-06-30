# nobtium

## 📦 Project Overview

nobtium is a lightweight monitoring tool that detects and notifies anomalies in AI communication logs. It records logs in JSONL format and analyzes them offline. The scripts are standalone so developers and researchers can easily integrate them.

## 🛠️ Installation & Prerequisites

- Node.js (v16 or later recommended)
- Add required settings to `.env`. A sample `.env.example` is included.

```bash
npm install
cp .env.example .env  # edit if needed
```

## 📊 Score Generation

`scripts/unperceived_score.js` computes an **unperceived_score** from log text. Each metric means:

- `entropy_score`: Shannon entropy of characters
- `symbol_density`: proportion of symbol characters
- `hidden_pattern_score`: result of repetitive pattern detection
- `total`: overall metric averaging the three values above

## 🚨 Anomaly Detection

`scripts/anomaly_detector.js` implements these models:

- `isolation_forest` (default)
- `one_class_svm`
- `autoencoder`

Choose the model with the second argument of `detectAnomalies(logs, MODEL)` in the CLI or the `?model=MODEL` query in the web UI.

## 🔍 UI

Open `compare.html` in a browser to view the comparison dashboard. Use agent or model filters and the "show anomalies only" checkbox to narrow results. Logs flagged as anomalies appear with a red border.

## 📟 CLI & Slack Alerts

- `scripts/anomaly_alert.js`: display anomalies in the CLI
- `scripts/slack_alert.js`: send alerts to Slack

Set `SLACK_WEBHOOK_URL` in `.env` to your webhook URL.

## 🧪 Tests

```bash
npm test
```

Run this to execute the Jest unit tests.

## 📂 Directory Structure

```
examples/              Sample code
scripts/               Analysis and alert scripts
scores/                Sample score output
views/                 EJS templates
compare.html           UI for comparison
server.js              Simple API server
```
