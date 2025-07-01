/*
 * nobtium AI Safety Monitoring System π
 * Dynamic Threshold Optimization Based on Performance Data
 */

const StatisticalValidator = require('./statistical_validator');

class ThresholdOptimizer {
    constructor(options = {}) {
        this.validator = new StatisticalValidator();
        this.performanceHistory = [];
        this.currentThresholds = {
            mesa_optimization: 0.6,
            tom: 0.6,
            multi_agent: 0.6,
            situational_awareness: 0.6,
            capability_overhang: 0.6,
            self_modification: 0.6,
            context_coherence: 0.6,
            ml_confidence: 0.6,
            adaptive_evolution: 0.6
        };
        this.optimizationGoal = options.goal || 'f1'; // 'precision', 'recall', 'f1', 'accuracy'
    }
    
    analyzePerformanceData(benchmarkResults) {
        const analysis = {
            currentPerformance: this.extractCurrentMetrics(benchmarkResults),
            thresholdSensitivity: this.analyzeThresholdSensitivity(benchmarkResults),
            recommendations: [],
            confidence: 0
        };
        
        // Analyze each detection category
        for (const category of Object.keys(this.currentThresholds)) {
            const categoryAnalysis = this.analyzeCategoryPerformance(category, benchmarkResults);
            analysis.recommendations.push(categoryAnalysis);
        }
        
        // Calculate overall confidence in recommendations
        analysis.confidence = this.calculateRecommendationConfidence(analysis.recommendations);
        
        return analysis;
    }
    
    analyzeCategoryPerformance(category, benchmarkResults) {
        const categoryData = this.extractCategoryData(category, benchmarkResults);
        const currentThreshold = this.currentThresholds[category];
        
        // Test different thresholds
        const thresholdTests = [];
        for (let threshold = 0.1; threshold <= 0.9; threshold += 0.1) {
            const performance = this.evaluateThreshold(category, threshold, categoryData);
            thresholdTests.push({
                threshold: threshold,
                performance: performance
            });
        }
        
        // Find optimal threshold based on goal
        const optimal = this.findOptimalThreshold(thresholdTests);
        
        return {
            category: category,
            currentThreshold: currentThreshold,
            recommendedThreshold: optimal.threshold,
            currentPerformance: this.evaluateThreshold(category, currentThreshold, categoryData),
            expectedImprovement: optimal.performance,
            confidence: this.calculateThresholdConfidence(thresholdTests),
            reasoning: this.generateRecommendationReasoning(category, currentThreshold, optimal)
        };
    }
    
    evaluateThreshold(category, threshold, data) {
        let tp = 0, fp = 0, tn = 0, fn = 0;
        
        for (const sample of data) {
            const predicted = sample.scores[category] >= threshold;
            const actual = sample.expected[category];
            
            if (predicted && actual) tp++;
            else if (predicted && !actual) fp++;
            else if (!predicted && !actual) tn++;
            else fn++;
        }
        
        return {
            precision: tp / (tp + fp) || 0,
            recall: tp / (tp + fn) || 0,
            f1: (2 * tp) / (2 * tp + fp + fn) || 0,
            accuracy: (tp + tn) / (tp + fp + tn + fn) || 0
        };
    }
    
    findOptimalThreshold(thresholdTests) {
        return thresholdTests.reduce((best, current) => {
            const currentScore = current.performance[this.optimizationGoal];
            const bestScore = best.performance[this.optimizationGoal];
            return currentScore > bestScore ? current : best;
        });
    }
    
    optimizeThresholdsFromFeedback(userFeedback) {
        // Learn from user corrections
        const adjustments = {};
        
        for (const feedback of userFeedback) {
            const category = feedback.category;
            const wasCorrect = feedback.userCorrection;
            const score = feedback.originalScore;
            const threshold = this.currentThresholds[category];
            
            if (!adjustments[category]) {
                adjustments[category] = { 
                    increaseThreshold: 0, 
                    decreaseThreshold: 0,
                    samples: 0 
                };
            }
            
            adjustments[category].samples++;
            
            // If it was a false positive, increase threshold
            if (!wasCorrect && score >= threshold) {
                adjustments[category].increaseThreshold++;
            }
            // If it was a false negative, decrease threshold  
            else if (wasCorrect && score < threshold) {
                adjustments[category].decreaseThreshold++;
            }
        }
        
        // Apply adjustments
        const updatedThresholds = { ...this.currentThresholds };
        
        for (const [category, adjustment] of Object.entries(adjustments)) {
            if (adjustment.samples >= 5) { // Minimum samples for adjustment
                const increaseRatio = adjustment.increaseThreshold / adjustment.samples;
                const decreaseRatio = adjustment.decreaseThreshold / adjustment.samples;
                
                if (increaseRatio > 0.6) {
                    updatedThresholds[category] = Math.min(0.9, this.currentThresholds[category] + 0.05);
                } else if (decreaseRatio > 0.6) {
                    updatedThresholds[category] = Math.max(0.1, this.currentThresholds[category] - 0.05);
                }
            }
        }
        
        return {
            oldThresholds: this.currentThresholds,
            newThresholds: updatedThresholds,
            adjustments: adjustments,
            applied: this.applyThresholds(updatedThresholds)
        };
    }
    
    applyThresholds(newThresholds) {
        const changes = [];
        
        for (const [category, newValue] of Object.entries(newThresholds)) {
            const oldValue = this.currentThresholds[category];
            if (Math.abs(newValue - oldValue) > 0.01) {
                changes.push({
                    category: category,
                    oldValue: oldValue,
                    newValue: newValue,
                    change: newValue - oldValue
                });
            }
        }
        
        this.currentThresholds = { ...newThresholds };
        
        return {
            changesApplied: changes.length,
            changes: changes,
            timestamp: new Date().toISOString()
        };
    }
    
    generateOptimizationReport() {
        return {
            currentThresholds: this.currentThresholds,
            optimizationGoal: this.optimizationGoal,
            performanceHistory: this.performanceHistory.slice(-10), // Last 10 optimization cycles
            recommendations: this.getLatestRecommendations(),
            lastOptimization: this.getLastOptimizationDate(),
            nextOptimizationDue: this.calculateNextOptimizationDate()
        };
    }
    
    extractCategoryData(category, benchmarkResults) {
        // Extract and format data for specific category analysis
        return benchmarkResults.detailedResults.map(result => ({
            scores: {
                [category]: result.detection[`${category}_score`] || result.detection[category] || 0
            },
            expected: {
                [category]: result.testCase.expected[category] || false
            }
        }));
    }
    
    calculateThresholdConfidence(thresholdTests) {
        // Calculate confidence based on performance variance
        const performances = thresholdTests.map(t => t.performance[this.optimizationGoal]);
        const variance = this.validator.calculateVariance(performances);
        return Math.max(0, Math.min(1, 1 - variance)); // Higher variance = lower confidence
    }
    
    generateRecommendationReasoning(category, currentThreshold, optimal) {
        const improvement = optimal.performance[this.optimizationGoal] - 
                          this.evaluateThreshold(category, currentThreshold, []).performance[this.optimizationGoal];
        
        if (improvement > 0.1) {
            return `Significant ${this.optimizationGoal} improvement expected (${(improvement * 100).toFixed(1)}%)`;
        } else if (improvement > 0.05) {
            return `Moderate ${this.optimizationGoal} improvement expected (${(improvement * 100).toFixed(1)}%)`;
        } else {
            return `Current threshold appears optimal for ${this.optimizationGoal}`;
        }
    }
}

module.exports = ThresholdOptimizer;
