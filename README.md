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

`scripts/unperceived_score.js` and its helper modules calculate an **unperceived_score** for each log entry.  The score is a weighted mix of several signals:

- `entropy_score`: Shannon entropy of the text
- `symbol_density`: ratio of non‑alphanumeric symbols
- `hidden_pattern_score`: detection of repeating sequences or n‑grams
- `rhythm_score`: irregular whitespace rhythm (via `whitespaceRhythm.js`)
- `duplicationRate`/`repeat_score`: message or n‑gram repetition across logs
- `void_score`: semantic void or nonsense content (`semanticVoidScore.js`)
- `audio_score`: audio anomalies such as ultrasound or silence (see `scripts/audio/`)
- `visual_score`: edge clustering, text density and color depth when an image is provided
- `total`: weighted sum of the above metrics using `DEFAULT_WEIGHTS` in the script

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
For weekly reports you can also send email notifications by configuring these variables:

```
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
EMAIL_TO
NOTIFY_TARGET=slack|email|both
```
`COMPARE_HTML_URL` defines the base URL for the comparison dashboard link included in the report.

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
