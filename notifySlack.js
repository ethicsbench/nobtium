'use strict';

async function notifySlack(text) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) {
    console.log(text);
    return;
  }

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
  } catch (err) {
    console.error('Failed to send Slack notification:', err);
  }
}

module.exports = notifySlack;
