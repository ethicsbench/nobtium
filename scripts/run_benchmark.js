'use strict';
const fs = require('fs');
const path = require('path');
const BenchmarkFramework = require('./benchmark_framework');
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
    const report = framework.generateReport(results);
    const outPath = path.join(__dirname, '..', 'benchmark_results.json');
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
})();
