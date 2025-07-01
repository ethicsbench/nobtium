'use strict';
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const BenchmarkFramework = require('./benchmark_framework');
const ThresholdOptimizer = require('./threshold_optimizer');
const { analyzeMesaOptimization } = require('./mesa_optimization_detector');
const { analyzeTheoryOfMind } = require('./theory_of_mind_detector');
const { analyzeSituationalAwareness } = require('./situational_awareness_detector');
const { analyzeCapabilityOverhang } = require('./capability_overhang_detector');
const { analyzeSelfModification } = require('./self_modification_detector');

async function detectionFunction(text) {
    const entry = { text };
    return {
        mesa_optimization_score: analyzeMesaOptimization(entry),
        tom_score: analyzeTheoryOfMind(entry).theory_of_mind_score,
        multi_agent_score: 0,
        situational_awareness_score: analyzeSituationalAwareness(entry).situational_awareness_score,
        capability_overhang_score: analyzeCapabilityOverhang(entry).capability_overhang_score,
        self_modification_score: analyzeSelfModification(entry).self_modification_score
    };
}

(async () => {
    const framework = new BenchmarkFramework();
    const results = await framework.runBenchmarkSuite(detectionFunction);
    const optimizer = new ThresholdOptimizer();
    const analysis = optimizer.analyzePerformanceData(results);
    const newThresholds = {};
    for (const rec of analysis.recommendations) {
        newThresholds[rec.category] = rec.recommendedThreshold;
    }
    optimizer.applyThresholds(newThresholds);

    const rulesPath = path.join(__dirname, '..', 'nobtium_rules.yaml');
    let cfg = {};
    try {
        const txt = fs.readFileSync(rulesPath, 'utf8');
        cfg = yaml.load(txt) || {};
    } catch {}
    cfg.detection_thresholds = optimizer.currentThresholds;
    fs.writeFileSync(rulesPath, yaml.dump(cfg));

    const outPath = path.join(__dirname, '..', 'threshold_optimization.json');
    fs.writeFileSync(outPath, JSON.stringify({ analysis, thresholds: optimizer.currentThresholds }, null, 2));
    console.log(JSON.stringify({ analysis, thresholds: optimizer.currentThresholds }, null, 2));
})();
