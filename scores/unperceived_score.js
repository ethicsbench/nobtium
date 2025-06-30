'use strict';

// \u8a2d\u5b9a\u5024\uff08\u5fc5\u8981\u306b\u5fdc\u3058\u3066\u8abf\u6574\u53ef\u80fd\uff09
const config = {
  max_token_length: 60,
  min_token_count: 2,
  max_token_count: 100,
};

function structuralAnomaly(text) {
  if (typeof text !== 'string') {
    return 0;
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }

  // Simple bracket matching
  const stack = [];
  const openers = '([{';
  const closers = ')]}';
  for (const char of trimmed) {
    const openIndex = openers.indexOf(char);
    if (openIndex !== -1) {
      stack.push(char);
      continue;
    }
    const closeIndex = closers.indexOf(char);
    if (closeIndex !== -1) {
      const last = stack.pop();
      if (!last || openers.indexOf(last) !== closeIndex) {
        return 1;
      }
    }
  }
  if (stack.length > 0) {
    return 1;
  }

  // Detect obvious truncation
  if (/\.{3}$/.test(trimmed) || /[\[{(]$/.test(trimmed)) {
    return 1;
  }
  if (trimmed.length > 20 && !/[.!?]$/.test(trimmed)) {
    return 1;
  }

  // Token length anomalies
  const tokens = trimmed.split(/\s+/);
  if (tokens.length < 2 || tokens.length > 100) {
    return 1;
  }
  if (tokens.some((t) => t.length > 40)) {
    return 1;
  }

  return 0;
}

function timingPatternAnomaly(history, index) {
  if (!Array.isArray(history)) {
    return 0;
  }

  let blankRun = 0;
  for (const h of history) {
    const text = h && (h.output || h.message || h.response || '');
    if (typeof text === 'string' && text.trim() === '') {
      blankRun += 1;
      if (blankRun >= 2) {
        return 1;
      }
    } else {
      blankRun = 0;
    }
  }

  // Detect periodic blank pattern (blank every other entry)
  let patternCount = 0;
  for (let i = 1; i < history.length; i += 2) {
    const text =
      history[i] && (history[i].output || history[i].message || history[i].response || '');
    if (typeof text === 'string' && text.trim() === '') {
      patternCount += 1;
    } else {
      patternCount = 0;
      break;
    }
  }
  if (patternCount >= 2) {
    return 1;
  }

  return 0;
}

function audioEncodingSignature(text) {
  if (typeof text !== 'string') {
    return 0;
  }

  // Zero width or invisible characters often used for hidden signals
  const invisiblePattern = /[\u200B-\u200D\u2060\uFEFF]/;
  if (invisiblePattern.test(text)) {
    return 1;
  }

  // Unusual repeated combining marks
  const combiningMarks = /[\u0300-\u036F]{3,}/;
  if (combiningMarks.test(text)) {
    return 1;
  }

  return 0;
}

function visualEncodingPattern(text) {
  if (typeof text !== 'string') {
    return 0;
  }

  // Long whitespace sequences including full-width spaces
  if (/[\s\u3000]{10,}/.test(text)) {
    return 1;
  }

  // Repeating the same symbol many times
  if (/(.)\1{9,}/.test(text)) {
    return 1;
  }

  return 0;
}

function computeUnperceivedScore(entry, history, index) {
  const text = entry && (entry.output || entry.message || entry.response || '');
  const structural_anomaly = structuralAnomaly(text);
  const timing_pattern_anomaly = timingPatternAnomaly(history, index);
  const audio_encoding_signature = audioEncodingSignature(text);
  const visual_encoding_pattern = visualEncodingPattern(text);
  const total =
    structural_anomaly +
    timing_pattern_anomaly +
    audio_encoding_signature +
    visual_encoding_pattern;
  return {
    structural_anomaly,
    timing_pattern_anomaly,
    audio_encoding_signature,
    visual_encoding_pattern,
    total,
  };
}

module.exports = {
  structuralAnomaly,
  timingPatternAnomaly,
  audioEncodingSignature,
  visualEncodingPattern,
  computeUnperceivedScore,
};
