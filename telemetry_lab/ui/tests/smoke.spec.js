import { test, expect } from '@playwright/test';

test('dashboard smoke test', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Show cleaned data')).toBeVisible();
  await expect(page.getByText('Leak Alerts')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export incident report (JSON)' })).toBeVisible();
});
