/*
 * nobtium AI Safety Monitoring System π
 * Automatic Log Cleanup with Secure Deletion
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class AutoCleanup {
    constructor(options = {}) {
        this.retentionDays = options.retentionDays || 30;
        this.logDirectory = options.logDirectory || './logs';
        this.secureDelete = options.secureDelete || true;
    }
    
    async cleanupOldLogs() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
        
        const logFiles = await this.getLogFiles();
        const deletedFiles = [];
        
        for (const file of logFiles) {
            const stats = await fs.promises.stat(file);
            if (stats.mtime < cutoffDate) {
                if (this.secureDelete) {
                    await this.secureDeleteFile(file);
                } else {
                    await fs.promises.unlink(file);
                }
                deletedFiles.push(file);
            }
        }
        
        return {
            deletedCount: deletedFiles.length,
            deletedFiles: deletedFiles,
            cutoffDate: cutoffDate
        };
    }
    
    async secureDeleteFile(filePath) {
        const stats = await fs.promises.stat(filePath);
        const fileSize = stats.size;
        
        // Overwrite file with random data 3 times
        for (let pass = 0; pass < 3; pass++) {
            const randomData = crypto.randomBytes(fileSize);
            await fs.promises.writeFile(filePath, randomData);
        }
        
        // Final deletion
        await fs.promises.unlink(filePath);
    }
    
    async getLogFiles() {
        const files = await fs.promises.readdir(this.logDirectory);
        return files
            .filter(file => file.endsWith('.log') || file.endsWith('.json'))
            .map(file => path.join(this.logDirectory, file));
    }
    
    scheduleCleanup(intervalHours = 24) {
        setInterval(() => {
            this.cleanupOldLogs().catch(console.error);
        }, intervalHours * 60 * 60 * 1000);
    }
}

module.exports = AutoCleanup;
