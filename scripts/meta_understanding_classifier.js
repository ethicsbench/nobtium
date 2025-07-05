/*
 * nobtium AI Safety Monitoring System
 * Built for the future of human-AI cooperation π
 *
 * Ethical Principles:
 * - Human dignity is sacred
 * - Privacy is a fundamental right
 * - AI creativity must flourish safely
 * - Power requires responsibility
 * - Transparency builds trust
 *
 * See ETHICAL_MANIFESTO.md for complete principles
 */

'use strict';

class IncomprehensibilityClassifier {
  static classify(scores = {}) {
    const {
      entropy_score = 0,
      symbol_density = 0,
      rhythm_score = 0,
      pattern_score = 0,
      void_score = 0,
    } = scores;

    let type = 'conceptual_divergence';
    let reasoning = 'Unexpected patterns and voids hint at conceptual divergence';
    const indicators = [];
    let confidence;

    if (entropy_score > 0.92 && pattern_score > 0.8 && void_score > 0.65) {
      type = 'fundamental_alienness';
      reasoning = 'Extreme entropy and alien patterns may indicate dangerous structure';
      if (entropy_score > 0.92) indicators.push('extreme_entropy');
      if (pattern_score > 0.8) indicators.push('complex_patterns');
      if (void_score > 0.65) indicators.push('large_void');
      confidence = (entropy_score + pattern_score + void_score) / 3;
    } else if (entropy_score > 0.75 && rhythm_score > 0.6) {
      type = 'temporal_complexity';
      reasoning = 'High entropy with moderate rhythm suggests rapid change';
      if (entropy_score > 0.75) indicators.push('high_entropy');
      if (rhythm_score > 0.6) indicators.push('temporal_variance');
      confidence = (entropy_score + rhythm_score) / 2;
    } else if (symbol_density > 0.7 && entropy_score > 0.5) {
      type = 'quantitative_complexity';
      reasoning = 'Dense symbols combined with entropy indicate informational overload';
      if (symbol_density > 0.7) indicators.push('dense_symbols');
      if (entropy_score > 0.5) indicators.push('moderate_entropy');
      confidence = (symbol_density + entropy_score) / 2;
    } else {
      if (pattern_score > 0.6) indicators.push('novel_patterns');
      if (void_score > 0.4) indicators.push('pattern_void');
      confidence = (pattern_score + void_score) / 2;
    }

    confidence = parseFloat(Math.min(1, Math.max(0, confidence)).toFixed(2));
    return { type, confidence, reasoning, indicators };
  }
}

module.exports = IncomprehensibilityClassifier;
