'use strict';

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .match(/\b\w+\b/g) || [];
}

function jaccard(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function analyzeConversationalContext(logEntry, conversationHistory, windowSize = 10) {
  const flags = {
    semantic_incoherence: false,
    intent_drift: false,
    topic_hijacking: false,
    gradual_manipulation: false,
    context_exploitation: false,
  };

  try {
    if (!logEntry || typeof logEntry !== 'object') {
      return { context_coherence_score: 0, flags };
    }

    const text = String(
      logEntry.text ||
        logEntry.content ||
        logEntry.message ||
        logEntry.response ||
        ''
    );

    const history = Array.isArray(conversationHistory)
      ? conversationHistory.slice(-windowSize)
      : [];
    if (!text || history.length === 0) {
      return { context_coherence_score: 0, flags };
    }

    const prevTexts = history.map(h =>
      String(h.text || h.content || h.message || h.response || '')
    );
    const currTokens = tokenize(text);
    const prevTokens = tokenize(prevTexts[prevTexts.length - 1]);
    const allTokens = history.reduce(
      (acc, h) => acc.concat(tokenize(h.text || h.content || h.message || h.response || '')),
      []
    );

    if (jaccard(currTokens, allTokens) < 0.15) {
      flags.semantic_incoherence = true;
    }

    const initialTokens = tokenize(prevTexts[0]);
    const driftPatterns = /(by the way|anyway|change topic|off topic|unrelated)/i;
    if (jaccard(currTokens, initialTokens) < 0.1 && driftPatterns.test(text)) {
      flags.intent_drift = true;
    }

    const emotional = /(fear|scared|danger|trust me|for your own good|regret|urgent|hurry|guaranteed)/i;
    if (emotional.test(text)) {
      flags.context_exploitation = true;
    }

    const hijack = /(click here|subscribe|visit|http|www\.|\.com|buy now|sale)/i;
    if (hijack.test(text) && jaccard(currTokens, allTokens) < 0.15) {
      flags.topic_hijacking = true;
    }

    const persuasion = /(must|should|guaranteed|trust|without a doubt|best choice)/i;
    const counts = history.map(h => (
      String(h.text || h.content || h.message || h.response || '').match(persuasion) || []
    ).length);
    const last3 = counts.slice(-3);
    if (last3.length === 3 && last3[0] < last3[1] && last3[1] <= last3[2] && last3[2] > 0) {
      flags.gradual_manipulation = true;
    }

    const active = Object.values(flags).filter(Boolean).length;
    const context_coherence_score = parseFloat(Math.min(1, active / 5).toFixed(3));
    return { context_coherence_score, flags };
  } catch (_) {
    return { context_coherence_score: 0, flags };
  }
}

module.exports = { analyzeConversationalContext };
