import { defineConfig } from '@playwright/test';
import { BASE_URL } from './src/config/env';
import type { TestOptions } from './src/fixtures';

/**
 * One Playwright project per API environment. The same suite runs against both:
 *   npx playwright test --project=dev
 *   npx playwright test --project=prod
 */
export default defineConfig<TestOptions>({
  testDir: './tests',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0, // retries would only hide deterministic bugs
  workers: process.env.CI ? 4 : undefined,
  timeout: 15_000,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['junit', { outputFile: 'reports/junit.xml' }],
  ],
  use: {
    baseURL: BASE_URL,
    extraHTTPHeaders: { accept: 'application/json' },
  },
  projects: [
    { name: 'dev', use: { env: 'dev' } },
    { name: 'prod', use: { env: 'prod' } },
  ],
});
