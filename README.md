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
const { sapWrapper } = require('sap-tracker');

const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_KEY }));

async function ask(prompt) {
  const res = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
  });
  return res.data.choices[0].message.content;
}

const trackedAsk = sapWrapper(ask); // opt‑in logging

const answer = await trackedAsk('Hello, world!');
console.log(answer);
```

Every call writes a log entry to `saplog.jsonl` in the project directory.

## Log format

Logs are newline‑separated JSON objects:

```json
{"timestamp":"2025-06-29T01:03:59.670Z","uuid":"9018e0ee-d69d-4628-ab93-21c4b57f43a2","direction":">","message":"Hello AI"}
{"timestamp":"2025-06-29T01:03:59.671Z","uuid":"9018e0ee-d69d-4628-ab93-21c4b57f43a2","direction":"<","message":"Echo: Hello AI"}
```

You control the log file and can purge it at any time.

## Running the analyzer

After collecting logs you can run the CLI to look for anomalies:

```bash
npx sap-analyzer saplog.jsonl
```

Example output:

```yaml
thread-1:
  - rapid-fire
```

The analyzer also prints a colorized summary to the console for quick review.

## Features

- **1‑line install** and minimal footprint
- **No lock‑in** – logs are plain JSONL
- **Opt‑in logging** – wrap only the calls you want to audit

Happy tracking!

