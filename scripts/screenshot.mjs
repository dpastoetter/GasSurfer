#!/usr/bin/env node
/**
 * Capture screenshots of the app for the README.
 * Prerequisite: start the app (e.g. npm run dev), then run: npm run screenshot
 * Optional: BASE_URL=http://localhost:5174 if Vite uses a different port.
 */
import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'docs', 'screenshots');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173';
const WAIT_AFTER_LOAD = Number(process.env.SCREENSHOT_WAIT) || 8000;

const MOCK_COINGECKO_PRICES = {
  bitcoin: { usd: 100, eur: 90, gbp: 80, jpy: 15000, chf: 88, cad: 135, aud: 150 },
  ethereum: { usd: 100, eur: 90, gbp: 80, jpy: 15000, chf: 88, cad: 135, aud: 150 },
  'matic-network': { usd: 100, eur: 90, gbp: 80, jpy: 15000, chf: 88, cad: 135, aud: 150 },
  binancecoin: { usd: 100, eur: 90, gbp: 80, jpy: 15000, chf: 88, cad: 135, aud: 150 },
  'avalanche-2': { usd: 100, eur: 90, gbp: 80, jpy: 15000, chf: 88, cad: 135, aud: 150 },
  fantom: { usd: 100, eur: 90, gbp: 80, jpy: 15000, chf: 88, cad: 135, aud: 150 },
  xdai: { usd: 100, eur: 90, gbp: 80, jpy: 15000, chf: 88, cad: 135, aud: 150 },
  mantle: { usd: 100, eur: 90, gbp: 80, jpy: 15000, chf: 88, cad: 135, aud: 150 },
  celo: { usd: 100, eur: 90, gbp: 80, jpy: 15000, chf: 88, cad: 135, aud: 150 },
};

async function setupPage(page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('gas-surfer-onboard-v1', '1');
      localStorage.setItem('gas-surfer-install-prompt-dismissed', '1');
      localStorage.setItem('gas-surfer-cheapest-callout-week', '2099-W1');
    } catch {
      /* ignore */
    }
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
          const body = JSON.parse(post);
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
                result: { baseFeePerGas: '0x4a817c800', number: '0x10' },
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
}

/** Wait until the main dashboard has loaded chain data. */
async function loadDashboard(page) {
  await page.goto(BASE, { waitUntil: 'load', timeout: 60_000 });
  await page.getByRole('heading', { name: /EVM chains/i }).waitFor({ state: 'visible', timeout: 90_000 });
  await page.waitForTimeout(WAIT_AFTER_LOAD);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await setupPage(page);

    await page.setViewportSize({ width: 1280, height: 800 });
    await loadDashboard(page);
    await page.screenshot({ path: join(OUT_DIR, 'hero.png'), fullPage: false });
    await page.screenshot({ path: join(OUT_DIR, 'full.png'), fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await loadDashboard(page);
    await page.waitForTimeout(Math.min(WAIT_AFTER_LOAD, 3000));
    await page.screenshot({ path: join(OUT_DIR, 'mobile.png'), fullPage: false });

    console.log('Screenshots saved to docs/screenshots/');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
