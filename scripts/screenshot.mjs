#!/usr/bin/env node
/**
 * Capture screenshots of the app for the README.
 * Run with: npm run dev (in another terminal), then: node scripts/screenshot.mjs
 */
import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'docs', 'screenshots');
const BASE = process.env.BASE_URL || 'http://localhost:5173';

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: join(OUT_DIR, 'hero.png'), fullPage: false });
    await page.screenshot({ path: join(OUT_DIR, 'full.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
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
