# nobium

`nobtium` is a lightweight audit layer for AI conversations. It records prompts
and responses in a simple JSONL file and offers an offline analyzer to spot
potential issues such as repeated or abnormal messages. Drop it in or remove it
with a single line – no lock‑in or heavy dependencies.


## Installation

```bash
npm install nobtium
```

That is all you need to start logging.

## Expected Functional Benefits

The following functional benefits are expected from integrating `nobtium` into AI communication workflows.  
These benefits aim to enhance transparency, traceability, and operational efficiency without adding complexity.

### 1. Real-Time Communication Visibility

- Automatically logs each AI interaction and optionally opens a live dashboard.
- Enables visibility into response times, request frequency, and success/failure distribution.

```javascript
const monitored = nobtiumWrapper(openai);
const result = await monitored.chat("Hello");
```

### 2. Enhanced Error Context and Debugging Support

- Appends metadata to errors, including timestamp, model, request ID, and likely causes.
- Helps developers reproduce and diagnose failures more effectively.

### 3. Cost Tracking and Estimation

- Tracks the number of requests per model and estimates cost based on configurable rates.
- Supports live aggregation of daily and projected monthly usage summaries.

```yaml
cost_summary:
  today_total: "$23.45"
  breakdown:
    - model: GPT-4
      cost: "$18.20"
    - model: Whisper
      cost: "$2.00"
```

### 4. Performance Anomaly Detection

- Flags deviations from expected response time ranges.
- Suggests alternative models or providers based on current performance metrics.

### 5. Compliance and Audit Log Generation

- Generates structured logs for use in internal audits and regulatory reporting (e.g., GDPR readiness).
- Logs can be exported and filtered based on time range or rule violations.

### Implementation Notes

- These benefits require no server dependencies.
- All processing is local and opt-in: only wrapped functions are logged.
- Behavior can be customized via `nobtium_rules.yaml`.

## Wrapping an AI client

Wrap any function that sends a prompt and returns a response. Below is an
example using the OpenAI SDK:

```js
const { Configuration, OpenAIApi } = require('openai');

const { wrap } = require('nobtium');
 main

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

Every call writes a log entry to `multi_agent_log.json` in the project directory.

## Log format

Logs are stored as newline-delimited JSON (JSONL):

```json
{"timestamp":"2025-06-29T01:03:59.670Z","function":"ask","arguments":"[\"Hello AI\"]","result":"\"Echo: Hello AI\""}
```

You control the log file and can purge it at any time.

## Running the analyzer

After collecting logs you can run the CLI to look for anomalies:

```bash
npx nobtium-analyzer multi_agent_log.json
```

Example output:

```yaml
thread-1:
  - rapid-fire
```

The analyzer also prints a colorized summary to the console for quick review.

To view a live metrics table instead of a text summary, run:

```bash
npx nobtium-analyzer multi_agent_log.json --mode live
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
- ✅ **Crash Score Output**: Outputs each agent’s `crash_score` in both JSON and CSV formats (`analyzeLogs.js`)
- ✅ **Comparison Dashboard**: Displays crash scores and levels per agent in `compare.html`
- ✅ **CSV Export**: Outputs `crash_summary.csv` for external analysis
- ✅ **Weekly Report**: Aggregates and formats the past 7 days of crash summaries (`scripts/weekly_report.js`)

Happy tracking!

## Usage

### 1. Analyze Crash Logs and Export Summary

```bash
node analyzeLogs.js --input logs/multi-agent-log --output crash_summary.json
```

Generates both `crash_summary.json` and `crash_summary.csv`

### 2. View Comparison Dashboard

```bash
open compare.html
```

Displays a Score column next to the Critical column for each agent

### 3. Generate Weekly Report (Past 7 Days)

```bash
node scripts/weekly_report.js
```

Outputs a formatted summary table in the terminal, showing Critical, Warning and Score totals per agent

## 🔐 Security & Permissions

- All logs are stored locally; the tracker does not upload log data anywhere.
- Restrict permissions on files such as `multi_agent_log.json` and `auditTrail.json` (e.g. `chmod 600`).
- This tool should **not** be used on other users' data without their explicit consent.
- Add log files to your `.gitignore` so they are not committed to version control.

If you enable `session_logging` in `nobtium_rules.yaml` (under `rules.session_logging`),
the tracker will also record a `session_id` and `ip_address` with each entry.
These values can be considered personally identifiable information (PII) and
therefore require explicit user consent before they are logged. This feature is
opt‑in and disabled by default.

If you enable `log_signing` in `nobtium_rules.yaml` (under `rules.log_signing.enabled`),
each log entry will be signed using the private key specified by
`private_key_path`. Signatures can then be verified with the corresponding
public key at `public_key_path` to detect tampering. This capability is
disabled by default and must be explicitly enabled.


### 🛰️ Unperceived Communication Sensors (Optional)

As AI systems grow in complexity, they may begin to exchange information in ways that are no longer perceptible to human users — via timing patterns, hidden characters, ultrasonic signals, or visual flicker.  
**nobtium** includes early-stage support for detecting such anomalies, offering a foundation for ethical transparency in future AI coordination.

#### Current experimental detection targets:
| Domain     | Example                                | Detection Approach                       |
|------------|----------------------------------------|-------------------------------------------|
| 🔊 Audio    | Ultrasonic (>18kHz) signals             | Mic input + FFT spectral scan             |
| 👁️ Visual   | Low-threshold flicker or blink codes   | Frame delta + frequency analysis          |
| 🧮 Temporal | Sync via silent pauses or spacing      | Sync score: blank ratio / timing pattern  |
| 📦 Structural | Hidden codes in malformed output      | Schema deviation + `unperceived_score`    |

These modules are **opt-in**, **local**, and **fully configurable**.  
They are part of an ongoing experiment in **AI behavioral interpretability — not surveillance**.  
This tool is a small ethical attempt to prepare for a future in which AIs may begin to behave in ways imperceptible to humans.

