const { renderDashboard } = require('../liveDashboard');

test('formats metrics in table', () => {
  const out = renderDashboard({ totalInteractions: 5, flaggedThreads: 2, avgResponseTime: 1000 });
  expect(out).toContain('Total Interactions');
  expect(out).toContain('5');
  expect(out).toContain('Flagged Threads');
  expect(out).toContain('2');
  expect(out).toContain('Average Response Time');
});
