const { randomUUID } = require('crypto');

function logSAP(timestamp, uuid, direction, message) {
  // SAP protocol: [timestamp] UUID direction message
  console.log(`[${timestamp}] ${uuid} ${direction} ${message}`);
}

function sapWrapper(originalAI) {
  // Wrap a function-style API client
  if (typeof originalAI === 'function') {
    return async function(...args) {
      const uuid = randomUUID();
      const ts = new Date().toISOString();
      logSAP(ts, uuid, '>', args[0]);
      const response = await originalAI.apply(this, args);
      logSAP(new Date().toISOString(), uuid, '<', response);
      return response;
    };
  }

  // Wrap an object with a 'send' method by default
  if (typeof originalAI === 'object' && typeof originalAI.send === 'function') {
    return new Proxy(originalAI, {
      get(target, prop) {
        if (prop === 'send') {
          return async function(...args) {
            const uuid = randomUUID();
            logSAP(new Date().toISOString(), uuid, '>', args[0]);
            const response = await target.send.apply(this, args);
            logSAP(new Date().toISOString(), uuid, '<', response);
            return response;
          };
        }
        return target[prop];
      },
    });
  }

  throw new Error('Unsupported AI client interface');
}

module.exports = { sapWrapper };

// Example usage
if (require.main === module) {
  // Dummy AI function that echoes the message
  async function dummyAI(msg) {
    return `Echo: ${msg}`;
  }

  const ai = sapWrapper(dummyAI);

  (async () => {
    const reply = await ai('Hello AI');
    console.log('Reply:', reply);
  })();
}
