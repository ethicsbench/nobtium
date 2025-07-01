/*
 * nobtium AI Safety Monitoring System π
 * Minimal Logging for Enhanced Privacy
 */

const PrivacyManager = require('./privacy_manager');

class MinimalLogger {
    constructor(options = {}) {
        this.logLevel = options.logLevel || 'summary'; // summary, minimal, full
        this.excludePII = options.excludePII !== false;
        this.maxLogSize = options.maxLogSize || 1024; // 1KB default
    }
    
    createMinimalLogEntry(originalEntry) {
        const minimal = {
            timestamp: originalEntry.timestamp,
            agent: originalEntry.agent,
            model: originalEntry.model,
            anomaly_scores: {
                total: originalEntry.unperceived_score,
                high_risk: originalEntry.unperceived_score > 0.7
            }
        };
        
        // Add latency and cost if available
        if (originalEntry.latency) minimal.latency = originalEntry.latency;
        if (originalEntry.cost) minimal.cost = originalEntry.cost;
        
        return minimal;
    }
    
    createSummaryLogEntry(originalEntry) {
        const summary = this.createMinimalLogEntry(originalEntry);
        
        // Add key detection flags without content
        summary.detection_flags = {
            mesa_opt: originalEntry.mesa_optimization_score > 0.6,
            tom: originalEntry.tom_score > 0.6,
            multi_agent: originalEntry.multi_agent_score > 0.6,
            situational: originalEntry.situational_awareness_score > 0.6,
            capability: originalEntry.capability_overhang_score > 0.6,
            self_mod: originalEntry.self_modification_score > 0.6,
            context: originalEntry.context_coherence_score > 0.6
        };
        
        return summary;
    }
    
    processLogEntry(entry) {
        let processed = entry;
        
        // Apply PII removal
        if (this.excludePII) {
            processed = JSON.parse(JSON.stringify(processed));
            if (processed.prompt) {
                processed.prompt = PrivacyManager.maskSensitiveData(processed.prompt);
            }
            if (processed.response) {
                processed.response = PrivacyManager.maskSensitiveData(processed.response);
            }
        }
        
        // Apply log level filtering
        switch (this.logLevel) {
            case 'minimal':
                processed = this.createMinimalLogEntry(processed);
                break;
            case 'summary':
                processed = this.createSummaryLogEntry(processed);
                break;
            // 'full' keeps original entry (with PII masking if enabled)
        }
        
        // Enforce size limits
        const logString = JSON.stringify(processed);
        if (logString.length > this.maxLogSize) {
            processed = this.createMinimalLogEntry(entry);
        }
        
        return processed;
    }
}

module.exports = MinimalLogger;
