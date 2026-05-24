import { formatGwei } from '../types';

export type RecapSnapshotInput = {
  samples: number;
  bestName: string;
  bestStd: number;
  ethPct: number;
  title: string;
  samplesLine: string;
  bestLine: string;
  ethLine: string;
  disclaimer: string;
  dateRange: string;
};

export function drawRecapSnapshot(input: RecapSnapshotInput): Promise<Blob | null> {
  const w = 720;
  const h = 480;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.resolve(null);

  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#021a26');
  g.addColorStop(1, '#0eb5d8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillText('GAS SURFER', 36, 64);

  ctx.font = 'bold 32px system-ui, sans-serif';
  ctx.fillText(input.title, 36, 112);

  ctx.font = '18px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.fillText(input.dateRange, 36, 142);

  ctx.font = '22px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  const lines = [input.samplesLine, input.bestLine, input.ethLine].filter((l) => l.length > 0);
  let y = 190;
  for (const line of lines) {
    ctx.fillText(`• ${line}`, 36, y);
    y += 36;
  }

  ctx.font = '14px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  const disclaimer =
    input.disclaimer.length > 72 ? `${input.disclaimer.slice(0, 69)}…` : input.disclaimer;
  ctx.fillText(disclaimer, 36, h - 52);

  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('gassurfer.app', 36, h - 24);

  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/png');
  });
}

export function recapBestFeeLine(bestName: string, bestStd: number): string {
  return `${bestName} at ${formatGwei(bestStd)}`;
}
