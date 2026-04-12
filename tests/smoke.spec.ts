import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('gas-surfer-onboard-v1', '1');
  });
});

test('title and EVM section heading', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load', timeout: 60_000 });
  await expect(page).toHaveTitle(/Gas Surfer/i);
  await expect(page.getByRole('heading', { name: /EVM chains/i })).toBeVisible({ timeout: 90_000 });
});

test('axe: no serious accessibility violations on home', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load', timeout: 60_000 });
  await page.getByRole('heading', { name: /EVM chains/i }).waitFor({ state: 'visible', timeout: 90_000 });
  const { violations } = await new AxeBuilder({ page })
    .disableRules(['color-contrast', 'meta-viewport'])
    .analyze();
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
});
