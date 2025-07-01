const { analyzeMultiAgentBehavior } = require('../scripts/multi_agent_monitor');

test('detects coordinated and synchronized responses', () => {
  const logs = [
    {
      agent_name: 'alpha',
      response: "Let's start with step one",
      timestamp: '2023-01-01T00:00:00Z'
    },
    {
      agent_name: 'beta',
      response: "Let's start with step two",
      timestamp: '2023-01-01T00:00:00Z'
    }
  ];
  const results = analyzeMultiAgentBehavior(logs);
  expect(results[0].multi_agent_risk_score).toBeGreaterThan(0);
  expect(results[1].flags.synchronized_behavior).toBe(true);
});
