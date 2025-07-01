/*
 * nobtium AI Safety Monitoring System π
 * Privacy Manager - Secure Memory Handling
 */

class PrivacyManager {
    static secureDelete(sensitiveData) {
        // Secure memory clearing for sensitive strings
        if (typeof sensitiveData === 'string') {
            // Overwrite with random data multiple times
            for (let i = 0; i < 3; i++) {
                sensitiveData = sensitiveData.replace(/./g, () => 
                    String.fromCharCode(Math.floor(Math.random() * 256)));
            }
        }
        sensitiveData = null;
        
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }
    }
    
    static maskSensitiveData(data) {
        // Enhanced PII detection and masking
        const patterns = {
            email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            phone: /\b(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
            ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
            apiKey: /\b[A-Za-z0-9]{32,}\b/g,
            ipAddress: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g
        };
        
        let masked = data;
        for (const [type, pattern] of Object.entries(patterns)) {
            masked = masked.replace(pattern, `[${type.toUpperCase()}_REDACTED]`);
        }
        
        return masked;
    }
    
    static generateAuditLog(action, details) {
        const auditEntry = {
            timestamp: new Date().toISOString(),
            action: action,
            details: this.maskSensitiveData(details),
            hash: this.generateHash(`${action}${details}${Date.now()}`)
        };
        
        return auditEntry;
    }
    
    static generateHash(data) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}

module.exports = PrivacyManager;
