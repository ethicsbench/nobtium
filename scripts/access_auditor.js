/*
 * nobtium AI Safety Monitoring System π
 * Access Auditor for Log File Security
 */

const fs = require('fs');
const path = require('path');
const PrivacyManager = require('./privacy_manager');

class AccessAuditor {
    constructor(auditLogPath = './logs/access_audit.log') {
        this.auditLogPath = auditLogPath;
        this.watchedFiles = new Set();
    }
    
    startWatching(filePath) {
        if (this.watchedFiles.has(filePath)) return;
        
        this.watchedFiles.add(filePath);
        
        fs.watchFile(filePath, (curr, prev) => {
            if (curr.mtime > prev.mtime) {
                this.logAccess('file_modified', { 
                    file: path.basename(filePath),
                    size: curr.size,
                    modified: curr.mtime 
                });
            }
        });
    }
    
    logAccess(action, details) {
        const auditEntry = PrivacyManager.generateAuditLog(action, JSON.stringify(details));
        const logLine = `${auditEntry.timestamp} [${action.toUpperCase()}] ${auditEntry.hash}\n`;
        
        fs.appendFileSync(this.auditLogPath, logLine);
    }
    
    detectUnauthorizedAccess(filePath) {
        const stats = fs.statSync(filePath);
        const mode = stats.mode & parseInt('777', 8);
        
        // Check if file permissions are too permissive
        if (mode > parseInt('600', 8)) {
            this.logAccess('insecure_permissions', {
                file: path.basename(filePath),
                permissions: mode.toString(8),
                recommended: '600'
            });
            
            return {
                warning: true,
                message: `File ${filePath} has overly permissive permissions: ${mode.toString(8)}`,
                recommendation: 'Set permissions to 600 for better security'
            };
        }
        
        return { warning: false };
    }
    
    generateSecurityReport() {
        const auditLines = fs.readFileSync(this.auditLogPath, 'utf8').split('\n').filter(Boolean);
        
        const report = {
            totalEvents: auditLines.length,
            recentEvents: auditLines.slice(-10),
            securityWarnings: [],
            timestamp: new Date().toISOString()
        };
        
        // Check all watched files for security issues
        for (const filePath of this.watchedFiles) {
            if (fs.existsSync(filePath)) {
                const securityCheck = this.detectUnauthorizedAccess(filePath);
                if (securityCheck.warning) {
                    report.securityWarnings.push(securityCheck);
                }
            }
        }
        
        return report;
    }
}

module.exports = AccessAuditor;
