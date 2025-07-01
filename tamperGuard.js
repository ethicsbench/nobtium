// Log integrity helpers. Please see ETHICAL_MANIFESTO.md for moral guidance.
const fs = require('fs');
const crypto = require('crypto');

function appendWithHash(entry, filePath) {
  let prevHash = null;
  try {
    const data = fs.readFileSync(filePath, 'utf8').trim();
    if (data) {
      const lines = data.split('\n');
      const last = JSON.parse(lines[lines.length - 1]);
      if (last && last.hash) {
        prevHash = last.hash;
      }
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  const entryWithPrev = { ...entry, prevHash };
  const hash = crypto.createHash('sha256').update(JSON.stringify(entryWithPrev)).digest('hex');
  const finalEntry = { ...entryWithPrev, hash };

  fs.appendFileSync(filePath, JSON.stringify(finalEntry) + '\n');
}

function validateChain(filePath) {
  let lines;
  try {
    lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
  } catch (err) {
    console.error('Failed to read file for validation:', err);
    return false;
  }

  let expectedPrevHash = null;

  for (let i = 0; i < lines.length; i++) {
    let entry;
    try {
      entry = JSON.parse(lines[i]);
    } catch (err) {
      console.warn(`Invalid JSON on line ${i + 1}`);
      return false;
    }

    if (entry.prevHash !== expectedPrevHash) {
      console.warn(`Chain break at line ${i + 1}: prevHash mismatch`);
      return false;
    }

    const { hash, ...withoutHash } = entry;
    const computedHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(withoutHash))
      .digest('hex');

    if (hash !== computedHash) {
      console.warn(`Chain break at line ${i + 1}: hash mismatch`);
      return false;
    }

    expectedPrevHash = hash;
  }

  return true;
}

function verify(filePath) {
  validateChain(filePath);
}

module.exports = { appendWithHash, verify, validateChain };
