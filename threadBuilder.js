function buildThreads(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }

  const result = [];
  let currentThread = 1;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    if (i > 0) {
      const sameUUID = entry.uuid === entries[i - 1].uuid;
      const timeDiff = Math.abs(new Date(entry.timestamp) - new Date(entries[i - 1].timestamp));
      const intentMatch =
        entry.intent === entries[i - 1].intent ||
        entry.intent === 'smalltalk' ||
        entries[i - 1].intent === 'smalltalk';

      if (!(sameUUID && timeDiff < 5000 && intentMatch)) {
        currentThread += 1;
      }
    }

    result.push({ ...entry, threadId: `thread-${currentThread}` });
  }

  return result;
}

module.exports = { buildThreads };
