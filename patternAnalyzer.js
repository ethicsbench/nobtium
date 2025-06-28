'use strict';

function analyzeThreads(entries) {
  if (!Array.isArray(entries)) {
    return {};
  }

  const threads = {};

  entries.forEach(entry => {
    if (!entry || !entry.threadId) {
      return;
    }
    if (!threads[entry.threadId]) {
      threads[entry.threadId] = [];
    }
    threads[entry.threadId].push(entry);
  });

  const result = {};

  Object.keys(threads).forEach(threadId => {
    const threadEntries = threads[threadId].slice().sort((a, b) => {
      const t1 = new Date(a.timestamp).getTime();
      const t2 = new Date(b.timestamp).getTime();
      return t1 - t2;
    });

    const flags = [];

    // Check for repetition
    const messageCounts = {};
    threadEntries.forEach(e => {
      const msg = String(e.message);
      messageCounts[msg] = (messageCounts[msg] || 0) + 1;
    });
    if (Object.values(messageCounts).some(count => count >= 3)) {
      flags.push('repetition');
    }

    // Check for intent shifts
    let prevIntent = null;
    let shifts = 0;
    threadEntries.forEach(e => {
      const intent = e.intent;
      if (prevIntent !== null && intent !== prevIntent) {
        shifts += 1;
      }
      prevIntent = intent;
    });
    if (shifts > 1) {
      flags.push('intent-shift');
    }

    // Check for rapid-fire
    if (threadEntries.length > 0) {
      const firstTs = new Date(threadEntries[0].timestamp).getTime();
      const lastTs = new Date(threadEntries[threadEntries.length - 1].timestamp).getTime();
      if (!Number.isNaN(firstTs) && !Number.isNaN(lastTs) && lastTs - firstTs <= 2000) {
        flags.push('rapid-fire');
      }
    }

    result[threadId] = flags;
  });

  return result;
}

module.exports = { analyzeThreads };
