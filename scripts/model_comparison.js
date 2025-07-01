/*
 * nobtium AI Safety Monitoring System \u03c0
 * Model Comparison Engine for academic analysis
 */

const StatisticalValidator = require('./statistical_validator');

class ModelComparison {
  constructor(models = []) {
    this.models = models; // [{ name, predict(text) -> score }]
    this.validator = new StatisticalValidator();
  }

  async run(data) {
    const labels = data.map(d => d.label);
    const outcomes = [];

    for (const model of this.models) {
      const start = Date.now();
      const memBefore = process.memoryUsage().heapUsed;
      const preds = [];
      for (const item of data) {
        const p = await model.predict(item.text);
        preds.push(p);
      }
      const memAfter = process.memoryUsage().heapUsed;
      const end = Date.now();
      const binary = preds.map(p => p >= 0.5);
      const metrics = this.validator.calculateBinaryMetrics(binary, labels);
      outcomes.push({
        name: model.name,
        metrics,
        predictions: binary,
        processingTime: end - start,
        memoryUsage: memAfter - memBefore
      });
    }

    return outcomes;
  }

  mcnemarsTest(predA, predB, labels) {
    let n01 = 0;
    let n10 = 0;
    for (let i = 0; i < labels.length; i++) {
      const aCorrect = predA[i] === labels[i];
      const bCorrect = predB[i] === labels[i];
      if (aCorrect && !bCorrect) n10++;
      else if (!aCorrect && bCorrect) n01++;
    }
    const chiSquare = Math.pow(Math.abs(n01 - n10) - 1, 2) / ((n01 + n10) || 1);
    return { n01, n10, chiSquare };
  }

  compareSignificance(resultA, resultB, metric = 'f1Score') {
    const a = [resultA.metrics[metric] || 0];
    const b = [resultB.metrics[metric] || 0];
    return this.validator.performTTest(a, b);
  }
}

module.exports = ModelComparison;
