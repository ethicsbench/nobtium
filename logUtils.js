'use strict';

function sanitizeLogs(entries) {
  if (!Array.isArray(entries)) return [];
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?){2,4}\d{3,4}/g;

  return entries.map(entry => {
    if (!entry || typeof entry !== 'object') return entry;
    const sanitized = {};
    for (const [key, value] of Object.entries(entry)) {
      if (typeof value === 'string') {
        let val = value.replace(emailRegex, '[REDACTED_EMAIL]');
        val = val.replace(phoneRegex, '[REDACTED_PHONE]');
        if (val.length > 100) {
          val = '[MASKED]';
        }
        sanitized[key] = val;
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  });
}

module.exports = { sanitizeLogs };
