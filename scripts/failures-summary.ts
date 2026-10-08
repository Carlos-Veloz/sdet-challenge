/**
 * Turns reports/results.json (Playwright JSON reporter) into
 * reports/failures-summary.md: one table per environment listing every failing
 * test with the assertion message. Use it as raw material for BUGS.md.
 *
 *   npm run test && npm run failures
 */
import fs from 'node:fs';
import path from 'node:path';

interface JsonError {
  message?: string;
}
interface JsonResult {
  status: string;
  errors?: JsonError[];
  error?: JsonError;
}
interface JsonTest {
  projectName: string;
  status: string;
  results: JsonResult[];
}
interface JsonSpec {
  title: string;
  file: string;
  line: number;
  tests: JsonTest[];
}
interface JsonSuite {
  title: string;
  suites?: JsonSuite[];
  specs?: JsonSpec[];
}

// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;]*m/g;
const input = path.resolve('reports/results.json');
const output = path.resolve('reports/failures-summary.md');

if (!fs.existsSync(input)) {
  console.error(`Not found: ${input}. Run "npm test" first.`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(input, 'utf8')) as { suites: JsonSuite[] };

interface Failure {
  project: string;
  title: string;
  location: string;
  message: string;
}
const failures: Failure[] = [];
const totals = new Map<string, { passed: number; failed: number }>();

function walk(suite: JsonSuite, parents: string[]): void {
  const trail = suite.title && !suite.title.endsWith('.ts') ? [...parents, suite.title] : parents;
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests) {
      const total = totals.get(test.projectName) ?? { passed: 0, failed: 0 };
      if (test.status === 'expected') total.passed++;
      else if (test.status === 'unexpected' || test.status === 'flaky') {
        total.failed++;
        const result = test.results.find((r) => r.status !== 'passed') ?? test.results[0];
        const raw = result?.errors?.[0]?.message ?? result?.error?.message ?? '(no message)';
        failures.push({
          project: test.projectName,
          title: [...trail, spec.title].join(' › '),
          location: `${spec.file}:${spec.line}`,
          message: raw.replace(ANSI, '').split('\n').slice(0, 8).join('\n'),
        });
      }
      totals.set(test.projectName, total);
    }
  }
  for (const child of suite.suites ?? []) walk(child, trail);
}
report.suites.forEach((s) => walk(s, []));

const lines: string[] = ['# Failure summary (auto-generated)', ''];
for (const [project, t] of totals) {
  lines.push(`- **${project}**: ${t.passed} passed, ${t.failed} failed`);
}
lines.push('');
for (const project of totals.keys()) {
  const list = failures.filter((f) => f.project === project);
  lines.push(`## ${project} (${list.length} failing)`, '');
  for (const f of list) {
    lines.push(`### ${f.title}`, `\`${f.location}\``, '', '```', f.message, '```', '');
  }
}
fs.writeFileSync(output, lines.join('\n'));
console.log(`Wrote ${output} (${failures.length} failing tests)`);
