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

  const labelsResponse = await page.request.get('/data/labels');
  const alertsResponse = await page.request.get('/data/alerts');
  const sampleResponse = await page.request.get('/data/sample');
  const labels = await labelsResponse.json();
  const alerts = await alertsResponse.json();
  const sampleCsv = await sampleResponse.text();
  const telemetryCount = Math.max(
    0,
    sampleCsv.trim().split('\n').length - 1
  );
  const validLabels = labels.filter(
    (label) =>
      label.start_index < telemetryCount &&
      label.end_index < telemetryCount &&
      label.start_index !== label.end_index
  );
  const validAlerts = alerts.filter(
    (alert) =>
      alert.start_index < telemetryCount &&
      alert.end_index < telemetryCount &&
      alert.start_index !== alert.end_index
  );
  const totalOverlays = validLabels.length + validAlerts.length;

  await expect(page.locator('.recharts-reference-area-rect')).toHaveCount(
    totalOverlays
  );
  await page.getByLabel('Show data quality labels').uncheck();
  await expect(page.locator('.recharts-reference-area-rect')).toHaveCount(
    validAlerts.length
  );
  await page.getByLabel('Show leak alarms').uncheck();
  await expect(page.locator('.recharts-reference-area-rect')).toHaveCount(0);
});
