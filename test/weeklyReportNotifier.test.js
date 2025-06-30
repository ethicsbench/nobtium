const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  if (global.fetch && global.fetch.mockRestore) {
    global.fetch.mockRestore();
  }
  jest.resetModules();
});

test('sendSlackNotification posts to webhook', async () => {
  const { sendSlackNotification } = require('../scripts/weekly_report');
  process.env.SLACK_WEBHOOK_URL = 'http://example.com/webhook';
  global.fetch = jest.fn(() => Promise.resolve({ ok: true }));
  await sendSlackNotification('hello');
  expect(fetch).toHaveBeenCalled();
});

test('sendEmailNotification uses nodemailer', async () => {
  jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({
      sendMail: jest.fn(() => Promise.resolve())
    }))
  }), { virtual: true });
  const { sendEmailNotification } = require('../scripts/weekly_report');
  process.env.SMTP_HOST = 'smtp';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_USER = 'a@b.c';
  process.env.SMTP_PASS = 'p';
  process.env.EMAIL_TO = 't@x.y';
  const nodemailer = require('nodemailer');
  await sendEmailNotification('sub', 'msg', 'link');
  expect(nodemailer.createTransport).toHaveBeenCalled();
});

test('notifyReport respects NOTIFY_TARGET', async () => {
  jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({ sendMail: jest.fn(() => Promise.resolve()) }))
  }), { virtual: true });
  process.env.NOTIFY_TARGET = 'both';
  process.env.SLACK_WEBHOOK_URL = 'http://example.com/webhook';
  process.env.SMTP_HOST = 'smtp';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_USER = 'a@b.c';
  process.env.SMTP_PASS = 'p';
  process.env.EMAIL_TO = 't@x.y';
  const { notifyReport } = require('../scripts/weekly_report');
  global.fetch = jest.fn(() => Promise.resolve({ ok: true }));
  const nodemailer = require('nodemailer');
  await notifyReport({ criticalTotal: 2, worstAgent: 'bot' });
  expect(fetch).toHaveBeenCalled();
  expect(nodemailer.createTransport).toHaveBeenCalled();
});
