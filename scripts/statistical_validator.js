/*
 * nobtium AI Safety Monitoring System π
 * Statistical Validation and Significance Testing
 */

class StatisticalValidator {
    constructor() {
        this.confidenceLevel = 0.95;
        this.significanceLevel = 0.05;
    }
    
    calculateConfidenceInterval(data, confidence = this.confidenceLevel) {
        const mean = this.calculateMean(data);
        const std = this.calculateStandardDeviation(data);
        const n = data.length;
        
        // t-distribution critical value (approximation for large n)
        const tValue = this.getTValue(confidence, n - 1);
        const marginOfError = tValue * (std / Math.sqrt(n));
        
        return {
            mean: mean,
            lowerBound: mean - marginOfError,
            upperBound: mean + marginOfError,
            marginOfError: marginOfError,
            confidence: confidence
        };
    }
    
    getTValue(confidence, degreesOfFreedom) {
        // Simplified t-table lookup for common confidence levels
        const tTable = {
            0.90: { 1: 6.314, 5: 2.015, 10: 1.812, 30: 1.697, 100: 1.660, Infinity: 1.645 },
            0.95: { 1: 12.706, 5: 2.571, 10: 2.228, 30: 2.042, 100: 1.984, Infinity: 1.960 },
            0.99: { 1: 63.657, 5: 4.032, 10: 3.169, 30: 2.750, 100: 2.626, Infinity: 2.576 }
        };
        
        const table = tTable[confidence] || tTable[0.95];
        
        // Find closest degrees of freedom
        const dfs = Object.keys(table).map(Number).sort((a, b) => a - b);
        for (let df of dfs) {
            if (degreesOfFreedom <= df || df === Infinity) {
                return table[df];
            }
        }
        
        return table[Infinity];
    }
    
    performTTest(sample1, sample2) {
        const mean1 = this.calculateMean(sample1);
        const mean2 = this.calculateMean(sample2);
        const var1 = this.calculateVariance(sample1);
        const var2 = this.calculateVariance(sample2);
        const n1 = sample1.length;
        const n2 = sample2.length;
        
        // Welch's t-test for unequal variances
        const pooledSE = Math.sqrt(var1/n1 + var2/n2);
        const tStatistic = (mean1 - mean2) / pooledSE;
        
        // Degrees of freedom (Welch-Satterthwaite equation)
        const df = Math.pow(var1/n1 + var2/n2, 2) / 
                   (Math.pow(var1/n1, 2)/(n1-1) + Math.pow(var2/n2, 2)/(n2-1));
        
        const pValue = this.calculatePValue(Math.abs(tStatistic), df);
        
        return {
            tStatistic: tStatistic,
            degreesOfFreedom: df,
            pValue: pValue,
            significant: pValue < this.significanceLevel,
            meanDifference: mean1 - mean2,
            confidenceInterval: this.calculateDifferenceCI(sample1, sample2)
        };
    }
    
    calculatePValue(tStat, df) {
        // Simplified p-value calculation (approximation)
        // In practice, you'd use a more sophisticated statistical library
        if (tStat > 4) return 0.001;
        if (tStat > 3) return 0.01;
        if (tStat > 2) return 0.05;
        if (tStat > 1.5) return 0.1;
        return 0.2;
    }
    
    performCrossValidation(data, folds = 5) {
        const foldSize = Math.floor(data.length / folds);
        const results = [];
        
        for (let i = 0; i < folds; i++) {
            const start = i * foldSize;
            const end = start + foldSize;
            
            const testSet = data.slice(start, end);
            const trainSet = [...data.slice(0, start), ...data.slice(end)];
            
            results.push({
                fold: i + 1,
                trainSize: trainSet.length,
                testSize: testSet.length,
                trainSet: trainSet,
                testSet: testSet
            });
        }
        
        return results;
    }
    
    calculateROCCurve(predictions, actualLabels) {
        const thresholds = [];
        const points = [];
        
        // Generate thresholds from 0 to 1
        for (let i = 0; i <= 100; i++) {
            thresholds.push(i / 100);
        }
        
        for (const threshold of thresholds) {
            const predictedLabels = predictions.map(p => p >= threshold);
            const metrics = this.calculateBinaryMetrics(predictedLabels, actualLabels);
            
            points.push({
                threshold: threshold,
                fpr: metrics.falsePositiveRate,
                tpr: metrics.truePositiveRate,
                precision: metrics.precision,
                recall: metrics.recall
            });
        }
        
        const auc = this.calculateAUC(points);
        
        return {
            points: points,
            auc: auc,
            optimalThreshold: this.findOptimalThreshold(points)
        };
    }
    
    calculateBinaryMetrics(predicted, actual) {
        let tp = 0, fp = 0, tn = 0, fn = 0;
        
        for (let i = 0; i < predicted.length; i++) {
            if (predicted[i] && actual[i]) tp++;
            else if (predicted[i] && !actual[i]) fp++;
            else if (!predicted[i] && !actual[i]) tn++;
            else fn++;
        }
        
        return {
            truePositiveRate: tp / (tp + fn) || 0,
            falsePositiveRate: fp / (fp + tn) || 0,
            precision: tp / (tp + fp) || 0,
            recall: tp / (tp + fn) || 0,
            accuracy: (tp + tn) / (tp + fp + tn + fn) || 0,
            f1Score: 2 * tp / (2 * tp + fp + fn) || 0
        };
    }
    
    calculateAUC(rocPoints) {
        let auc = 0;
        for (let i = 1; i < rocPoints.length; i++) {
            const width = rocPoints[i].fpr - rocPoints[i-1].fpr;
            const height = (rocPoints[i].tpr + rocPoints[i-1].tpr) / 2;
            auc += width * height;
        }
        return auc;
    }
    
    findOptimalThreshold(rocPoints) {
        let optimalPoint = rocPoints[0];
        let maxYouden = 0;
        
        for (const point of rocPoints) {
            const youdenIndex = point.tpr - point.fpr; // Youden's J statistic
            if (youdenIndex > maxYouden) {
                maxYouden = youdenIndex;
                optimalPoint = point;
            }
        }
        
        return optimalPoint;
    }
    
    calculateMean(data) {
        return data.reduce((sum, val) => sum + val, 0) / data.length;
    }
    
    calculateVariance(data) {
        const mean = this.calculateMean(data);
        return data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (data.length - 1);
    }
    
    calculateStandardDeviation(data) {
        return Math.sqrt(this.calculateVariance(data));
    }

    // Cohen's Kappa for inter-rater reliability
    cohensKappa(observed, expected) {
        if (!Array.isArray(observed) || !Array.isArray(expected)) return 0;
        if (observed.length !== expected.length) return 0;
        let agreement = 0;
        const labelCounts = {};
        observed.forEach((o, i) => {
            if (o === expected[i]) agreement++;
            labelCounts[o] = (labelCounts[o] || 0) + 1;
            labelCounts[expected[i]] = (labelCounts[expected[i]] || 0) + 1;
        });
        const total = observed.length;
        const p0 = agreement / total;
        let pe = 0;
        const labels = Object.keys(labelCounts);
        for (const label of labels) {
            const po = observed.filter(v => v === label).length / total;
            const peLabel = expected.filter(v => v === label).length / total;
            pe += po * peLabel;
        }
        if (pe === 1) return 1;
        return (p0 - pe) / (1 - pe);
    }

    // Matthews Correlation Coefficient for binary classification
    matthewsCorrelation(tp, tn, fp, fn) {
        const numerator = tp * tn - fp * fn;
        const denominator = Math.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn));
        if (!denominator) return 0;
        return numerator / denominator;
    }

    // Cohen's d effect size
    effectSize(group1, group2) {
        const mean1 = this.calculateMean(group1);
        const mean2 = this.calculateMean(group2);
        const var1 = this.calculateVariance(group1);
        const var2 = this.calculateVariance(group2);
        const pooledStd = Math.sqrt(((group1.length - 1) * var1 + (group2.length - 1) * var2) / (group1.length + group2.length - 2));
        if (!pooledStd) return 0;
        return (mean1 - mean2) / pooledStd;
    }

    // Alias for cross-validation
    crossValidate(data, folds = 5) {
        return this.performCrossValidation(data, folds);
    }
    
    calculateDifferenceCI(sample1, sample2) {
        const mean1 = this.calculateMean(sample1);
        const mean2 = this.calculateMean(sample2);
        const var1 = this.calculateVariance(sample1);
        const var2 = this.calculateVariance(sample2);
        const n1 = sample1.length;
        const n2 = sample2.length;
        
        const meanDiff = mean1 - mean2;
        const pooledSE = Math.sqrt(var1/n1 + var2/n2);
        const df = n1 + n2 - 2; // simplified
        const tValue = this.getTValue(this.confidenceLevel, df);
        const marginOfError = tValue * pooledSE;
        
        return {
            difference: meanDiff,
            lowerBound: meanDiff - marginOfError,
            upperBound: meanDiff + marginOfError
        };
    }
}

module.exports = StatisticalValidator;
