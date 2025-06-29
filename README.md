旧称: sap-tracker

# Nobtium

[![npm version](https://img.shields.io/npm/v/Nobtium.svg)](https://www.npmjs.com/package/Nobtium)
[![License](https://img.shields.io/npm/l/Nobtium.svg)](LICENSE)
[![CI](https://img.shields.io/badge/CI-passing-blue)](#)

Nobtium is a lightweight AI conversation auditing toolkit.

## Installation

```bash
npm install Nobtium
```

That is all you need to start logging.

## Wrapping an AI client

Wrap any function that sends a prompt and returns a response. Below is an
example using the OpenAI SDK:

```js
const { Configuration, OpenAIApi } = require('openai');
const { wrap } = require('Nobtium');

const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_KEY }));

async function ask(prompt) {
  const res = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
  });
  return res.data.choices[0].message.content;
}

const trackedAsk = wrap(ask); // opt‑in logging

const answer = await trackedAsk('Hello, world!');
console.log(answer);
```

Every call writes a log entry to `sap_logs.json` in the project directory.

## Log format

Logs are stored as a JSON array:

```json
[
  {
    "timestamp": "2025-06-29T01:03:59.670Z",
    "function": "ask",
    "arguments": "[\"Hello AI\"]",
    "result": "\"Echo: Hello AI\""
  }
]
```

You control the log file and can purge it at any time.

## Running the analyzer

After collecting logs you can run the CLI to look for anomalies:

```bash
npx sap-analyzer sap_logs.json
```

Example output:

```yaml
thread-1:
  - rapid-fire
```

The analyzer also prints a colorized summary to the console for quick review.

To view a live metrics table instead of a text summary, run:

```bash
npx sap-analyzer sap_logs.json --mode live
```

For a browser-based dashboard with charts, run:

```bash
npm run dashboard
```

Then open [http://localhost:3000](http://localhost:3000) to view flagged threads,
average response time and a live interaction chart that refreshes every 10s.

## Features

- **1‑line install** and minimal footprint
- **No lock‑in** – logs are plain JSONL
- **Opt‑in logging** – wrap only the calls you want to audit

Happy tracking!

## 🔐 Security & Permissions

- All logs are stored locally; the tracker does not upload log data anywhere.
- Restrict permissions on files such as `sap_logs.json` and `auditTrail.json` (e.g. `chmod 600`).
- This tool should **not** be used on other users' data without their explicit consent.
- Add log files to your `.gitignore` so they are not committed to version control.

If you enable `session_logging` in `sap_rules.yaml` (under `rules.session_logging`),
the tracker will also record a `session_id` and `ip_address` with each entry.
These values can be considered personally identifiable information (PII) and
therefore require explicit user consent before they are logged. This feature is
opt‑in and disabled by default.

If you enable `log_signing` in `sap_rules.yaml` (under `rules.log_signing.enabled`),
each log entry will be signed using the private key specified by
`private_key_path`. Signatures can then be verified with the corresponding
public key at `public_key_path` to detect tampering. This capability is
disabled by default and must be explicitly enabled.

