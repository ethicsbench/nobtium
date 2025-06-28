function extractIntent(message) {
  if (typeof message !== 'string') {
    return 'unknown';
  }

  const msg = message.toLowerCase().trim();

  if (msg.endsWith('?') || /\b(what|why|how)\b/.test(msg)) {
    return 'question';
  }

  if (/^(run|create|generate)\b/.test(msg)) {
    return 'instruction';
  }

  if (/\b(yes|no|correct|wrong)\b/.test(msg)) {
    return 'confirmation';
  }

  if (/\b(hello|hi|hey|lol)\b/.test(msg) || msg.includes('how are you')) {
    return 'smalltalk';
  }

  return 'unknown';
}

module.exports = { extractIntent };
