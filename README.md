# sap-tracker

[![npm version](https://img.shields.io/npm/v/sap-tracker.svg)](https://www.npmjs.com/package/sap-tracker)
[![License](https://img.shields.io/npm/l/sap-tracker.svg)](LICENSE)
[![CI](https://img.shields.io/badge/CI-passing-blue)](#)

`sap-tracker` is a lightweight audit layer for AI conversations. It records prompts
and responses in a simple JSONL file and offers an offline analyzer to spot
potential issues such as repeated or abnormal messages. Drop it in or remove it
with a single line – no lock‑in or heavy dependencies.

## Installation

```bash
npm install sap-tracker
```

That is all you need to start logging.

## Wrapping an AI client

Wrap any function that sends a prompt and returns a response. Below is an
example using the OpenAI SDK:

```js
const { Configuration, OpenAIApi } = require('openai');
const { wrap } = require('sap-tracker');

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

