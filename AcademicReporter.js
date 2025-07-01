'use strict';
const fs = require('fs');
const path = require('path');

class AcademicReporter {
  constructor(outDir = '.') {
    this.outDir = outDir;
  }

  generateMarkdown(report, filename = 'academic_report.md') {
    const lines = [
      '# Academic Validation Report',
      '## Executive Summary',
      report.summary || '',
      '## Methodology',
      report.methodology || '',
      '## Results',
      '```json',
      JSON.stringify(report.results || {}, null, 2),
      '```',
      '## Statistical Analysis',
      report.statistics || '',
      '## Comparative Analysis',
      report.comparison || '',
      '## Limitations',
      report.limitations || '',
      '## Reproducibility',
      report.reproducibility || ''
    ];
    const filePath = path.join(this.outDir, filename);
    fs.writeFileSync(filePath, lines.join('\n'));
    return filePath;
  }

  generateJSON(report, filename = 'academic_report.json') {
    const filePath = path.join(this.outDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
    return filePath;
  }

  generateCSV(rows, filename = 'academic_report.csv') {
    const filePath = path.join(this.outDir, filename);
    const csv = rows.map(r => r.join(',')).join('\n');
    fs.writeFileSync(filePath, csv);
    return filePath;
  }

  generateLatexTable(rows, filename = 'table.tex') {
    const filePath = path.join(this.outDir, filename);
    const header = '\\begin{tabular}{|' + 'c|'.repeat(rows[0].length) + '}\\hline';
    const body = rows.map(r => r.join(' & ') + ' \\ \\hline').join('\n');
    const footer = '\\end{tabular}';
    fs.writeFileSync(filePath, [header, body, footer].join('\n'));
    return filePath;
  }
}

module.exports = AcademicReporter;
