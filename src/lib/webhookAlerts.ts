import type { ChainGas, SurfCondition } from '../types';

const URL_PREFIX = 'gas-surfer-webhook-url-';
const COOLDOWN_PREFIX = 'gas-surfer-webhook-cool-';
const COOLDOWN_MS = 5 * 60 * 1000;

const CONDITION_RANK: Record<SurfCondition, number> = {
  'surfs-up': 0,
  smooth: 1,
  choppy: 2,
  storm: 3,
};

export type WebhookRegimePrefs = { improve: boolean; worsen: boolean };

export function loadWebhookUrl(chainId: number): string {
  try {
    return localStorage.getItem(URL_PREFIX + chainId) ?? '';
  } catch {
    return '';
  }
}

export function saveWebhookUrl(chainId: number, url: string): void {
  try {
    const trimmed = url.trim();
    if (trimmed === '') localStorage.removeItem(URL_PREFIX + chainId);
    else localStorage.setItem(URL_PREFIX + chainId, trimmed);
  } catch {
    /* ignore */
  }
}

export function loadWebhookRegime(chainId: number): WebhookRegimePrefs {
  try {
    const raw = localStorage.getItem(`gas-surfer-webhook-regime-${chainId}`);
    if (!raw) return { improve: true, worsen: false };
    const p = JSON.parse(raw) as WebhookRegimePrefs;
    return { improve: Boolean(p.improve), worsen: Boolean(p.worsen) };
  } catch {
    return { improve: true, worsen: false };
  }
}

export function saveWebhookRegime(chainId: number, prefs: WebhookRegimePrefs): void {
  try {
    localStorage.setItem(`gas-surfer-webhook-regime-${chainId}`, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

function isValidWebhookUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

function onCooldown(key: string): boolean {
  try {
    const last = parseInt(sessionStorage.getItem(key) ?? '0', 10) || 0;
    return Date.now() - last < COOLDOWN_MS;
  } catch {
    return false;
  }
}

function setCooldown(key: string): void {
  try {
    sessionStorage.setItem(key, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export async function postWebhook(url: string, text: string): Promise<void> {
  if (!isValidWebhookUrl(url)) return;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, message: text }),
    mode: 'no-cors',
  });
}

export type WebhookCheckInput = {
  chain: ChainGas;
  prevCondition: SurfCondition | null;
  thresholdBelow: string;
  regime: WebhookRegimePrefs;
};

export async function maybeFireWebhookAlerts(input: WebhookCheckInput): Promise<void> {
  const url = loadWebhookUrl(input.chain.chainId).trim();
  if (!url || !isValidWebhookUrl(url)) return;

  const { chain } = input;

  const max = parseFloat(input.thresholdBelow);
  if (Number.isFinite(max) && max > 0 && chain.gas.standard <= max) {
    const key = COOLDOWN_PREFIX + chain.chainId + '-below';
    if (!onCooldown(key)) {
      setCooldown(key);
      await postWebhook(
        url,
        `Gas Surfer: ${chain.name} standard fee ${chain.gas.standard} is at or below your threshold ${max}.`
      );
    }
  }

  const prev = input.prevCondition;
  if (prev == null || prev === chain.condition) return;
  const rPrev = CONDITION_RANK[prev];
  const rNext = CONDITION_RANK[chain.condition];
  const improved = rNext < rPrev;
  const worsened = rNext > rPrev;
  if (improved && !input.regime.improve) return;
  if (worsened && !input.regime.worsen) return;
  if (!improved && !worsened) return;

  const dir = improved ? 'improve' : 'worsen';
  const key = COOLDOWN_PREFIX + chain.chainId + '-' + dir;
  if (onCooldown(key)) return;
  setCooldown(key);
  await postWebhook(
    url,
    `Gas Surfer: ${chain.name} condition ${prev} → ${chain.condition} (${chain.gas.standard}).`
  );
}
