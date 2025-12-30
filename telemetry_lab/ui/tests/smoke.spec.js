import { test, expect } from '@playwright/test';

test('dashboard smoke test', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Show cleaned data')).toBeVisible();
  await expect(page.getByText('Show raw data')).toBeVisible();
  await expect(page.getByText('Leak Alerts')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export incident report (JSON)' })).toBeVisible();

  const chart = page.getByTestId('telemetry-chart');
  await expect(chart.getByRole('application')).toBeVisible();

  await expect(page.locator('.recharts-line-curve')).toHaveCount(6);
  await page.getByLabel('Show cleaned data').uncheck();
  await expect(page.locator('.recharts-line-curve')).toHaveCount(3);
  await page.getByLabel('Show raw data').uncheck();
  await expect(page.locator('.recharts-line-curve')).toHaveCount(0);
  await page.getByLabel('Show raw data').check();

  await expect(page.locator('.recharts-reference-area-rect')).toHaveCount(5);
  await page.getByLabel('Show data quality labels').uncheck();
  await expect(page.locator('.recharts-reference-area-rect')).toHaveCount(2);
  await page.getByLabel('Show leak alarms').uncheck();
  await expect(page.locator('.recharts-reference-area-rect')).toHaveCount(0);
});
