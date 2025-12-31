import { test, expect } from '@playwright/test';

test('dashboard smoke test', async ({ page }) => {
  const reportPayload = {
    generated_at: '2024-01-01T00:00:00Z',
    alerts: [],
    labels: [],
    summary: { alert_count: 0, label_count: 0 }
  };
  await page.route('**/data/report', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(reportPayload)
    });
  });
  await page.goto('/');

  await expect(page.getByText('Show cleaned data')).toBeVisible();
  await expect(page.getByText('Show raw data')).toBeVisible();
  await expect(page.getByText('Leak Alerts')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export incident report (JSON)' })).toBeVisible();

  const chart = page.getByTestId('telemetry-chart');
  await expect(chart.getByRole('application')).toBeVisible();
  await expect(chart.locator('svg[role="application"]')).toBeVisible();
  await expect(chart.locator('.recharts-line-curve')).toHaveCount(6);
  await expect(chart.locator('.recharts-line-curve').first()).toHaveAttribute('d', /.+/);

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

  await page.evaluate(() => {
    window.__reportExportCapture = { blob: null, download: null, href: null, url: null };
    const originalCreateObjectURL = window.URL.createObjectURL.bind(window.URL);
    window.URL.createObjectURL = (blob) => {
      window.__reportExportCapture.blob = blob;
      const url = originalCreateObjectURL(blob);
      window.__reportExportCapture.url = url;
      return url;
    };
    const originalClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      window.__reportExportCapture.download = this.download;
      window.__reportExportCapture.href = this.href;
      return originalClick.apply(this);
    };
  });

  await page.getByLabel('Show leak alarms').check();
  const exportButton = page.getByRole('button', { name: 'Export incident report (JSON)' });
  await expect(exportButton).toBeEnabled();
  await exportButton.click();
  const exportPayload = await page.evaluate(async () => {
    const capture = window.__reportExportCapture;
    return {
      download: capture?.download ?? null,
      href: capture?.href ?? null,
      url: capture?.url ?? null,
      text: capture?.blob ? await capture.blob.text() : null
    };
  });

  await expect(exportPayload.download).toBe('report.json');
  await expect(exportPayload.href).toContain('blob:');
  const reportContents = JSON.parse(exportPayload.text);
  await expect(reportContents).toMatchObject({
    alerts: expect.any(Array),
    labels: expect.any(Array),
    summary: {
      alert_count: expect.any(Number),
      label_count: expect.any(Number)
    }
  });
});
