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
const BASE = process.env.BASE_URL || 'http://localhost:5173';
const WAIT_AFTER_LOAD = Number(process.env.SCREENSHOT_WAIT) || 5000;

/** Skip first-visit onboarding so captures show the main dashboard. */
async function loadDashboard(page) {
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 45000 });
  await page.evaluate(() => {
    try {
      localStorage.setItem('gas-surfer-onboard-v1', '1');
    } catch {
      /* ignore */
    }
  });
  await page.reload({ waitUntil: 'networkidle', timeout: 45000 });
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await loadDashboard(page);
    await page.waitForTimeout(WAIT_AFTER_LOAD);
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
