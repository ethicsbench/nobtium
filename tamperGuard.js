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

function verify(filePath) {
  let lines;
  try {
    lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
  } catch (err) {
    console.error('Failed to read file for verification:', err);
    return;
  }

  let expectedPrevHash = null;

  lines.forEach((line, idx) => {
    let entry;
    try {
      entry = JSON.parse(line);
    } catch (err) {
      console.error(`Invalid JSON on line ${idx + 1}`);
      return;
    }

    if (entry.prevHash !== expectedPrevHash) {
      console.log(`Tampering detected at line ${idx + 1}: prevHash mismatch`);
    }

    const { hash, ...withoutHash } = entry;
    const computedHash = crypto.createHash('sha256').update(JSON.stringify(withoutHash)).digest('hex');

    if (hash !== computedHash) {
      console.log(`Tampering detected at line ${idx + 1}: hash mismatch`);
    }

    expectedPrevHash = hash;
  });
}

module.exports = { appendWithHash, verify };
