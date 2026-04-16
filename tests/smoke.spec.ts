import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const MOCK_COINGECKO_PRICES: Record<string, Record<string, number>> = {};
for (const id of [
  'bitcoin',
  'ethereum',
  'matic-network',
  'binancecoin',
  'avalanche-2',
  'fantom',
  'xdai',
  'mantle',
  'celo',
]) {
  MOCK_COINGECKO_PRICES[id] = {
    usd: 100,
    eur: 90,
    gbp: 80,
    jpy: 15000,
    chf: 88,
    cad: 135,
    aud: 150,
  };
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('gas-surfer-onboard-v1', '1');
  });

  await page.route('**/*', async (route) => {
    const req = route.request();
    const url = req.url();

    if (url.includes('mempool.space/api/v1/fees/recommended')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          hourFee: 8,
          halfHourFee: 12,
          fastestFee: 18,
          economyFee: 6,
          minimumFee: 1,
        }),
      });
    }

    if (url.includes('api.coingecko.com/api/v3/simple/price')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_COINGECKO_PRICES),
      });
    }

    if (req.method() === 'POST') {
      const post = req.postData();
      if (post) {
        try {
          const body = JSON.parse(post) as { method?: string };
          const { method } = body;
          if (method === 'eth_gasPrice') {
            return route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({ jsonrpc: '2.0', id: 1, result: '0x2e90edd000' }),
            });
          }
          if (method === 'eth_getBlockByNumber') {
            return route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                result: {
                  baseFeePerGas: '0x4a817c800',
                  number: '0x10',
                },
              }),
            });
          }
          if (method === 'eth_maxPriorityFeePerGas') {
            return route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({ jsonrpc: '2.0', id: 1, result: '0x5f5e100' }),
            });
          }
        } catch {
          /* continue */
        }
      }
    }

    return route.continue();
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
