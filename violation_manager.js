'use strict';
const fs = require('fs');
const path = require('path');

class ViolationManager {
  constructor(logPath = path.join(__dirname, 'violation_log.json')) {
    this.logPath = logPath;
    this.log = this._load();
  }

  _load() {
    try {
      const raw = fs.readFileSync(this.logPath, 'utf8');
      const data = JSON.parse(raw || '{}');
      if (data && typeof data === 'object') {
        return data;
      }
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error('Failed to read violation log:', err);
      }
    }
    return {};
  }

  _save() {
    try {
      fs.writeFileSync(this.logPath, JSON.stringify(this.log, null, 2));
    } catch (err) {
      console.error('Failed to write violation log:', err);
    }
  }

  addViolation(userId) {
    if (!userId) return null;
    const entry = this.log[userId] || { userId, violations: 0, lastViolation: null };
    entry.violations += 1;
    entry.lastViolation = new Date().toISOString();
    this.log[userId] = entry;
    this._save();
    return this.getRestriction(userId);
  }

  getRestriction(userId) {
    const entry = this.log[userId];
    if (!entry) return null;
    return this._restrictionForCount(entry.violations);
  }

  _restrictionForCount(count) {
    if (count === 1) return 'warning';
    if (count === 2) return 'suspend-24h';
    if (count === 3) return 'suspend-7d';
    if (count >= 4) return 'block';
    return null;
  }
}

module.exports = { ViolationManager };
