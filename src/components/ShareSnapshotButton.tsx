import type { ChainGas, Currency } from '../types';
import { formatGwei, gasCostInToken, formatFiat, feeUnitLabel } from '../types';
import { getPriceInCurrency } from '../useTokenPrices';
import { useI18n } from '../i18n/I18nContext';
import { conditionLabels } from '../i18n/messages';

interface ShareSnapshotButtonProps {
  chain: ChainGas | undefined;
  coinGeckoId: string;
  prices: Record<string, Partial<Record<Currency, number>>>;
  currency: Currency;
}

function drawSnapshot(chain: ChainGas, conditionLabel: string, fiatLine: string | null): Promise<Blob | null> {
  const w = 720;
  const h = 420;
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
  ctx.font = 'bold 52px system-ui, sans-serif';
  ctx.fillText('GAS SURFER', 36, 72);

  ctx.font = '24px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText(chain.name, 36, 120);

  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillStyle = '#fff';
  ctx.fillText(conditionLabel, 36, 175);

  ctx.font = '28px ui-monospace, monospace';
  ctx.fillText(`${formatGwei(chain.gas.standard)} ${feeUnitLabel(chain.chainId)}`, 36, 230);

  if (fiatLine) {
    ctx.font = '22px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(fiatLine, 36, 275);
  }

  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('gassurfer.app', 36, h - 28);

  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/png');
  });
}

export function ShareSnapshotButton({ chain, coinGeckoId, prices, currency }: ShareSnapshotButtonProps) {
  const { t, locale } = useI18n();

  const onClick = async () => {
    if (!chain) return;
    const labels = conditionLabels(locale);
    const conditionLabel = labels[chain.condition].label;
    const token = gasCostInToken(chain.chainId, chain.gas.standard);
    const p = getPriceInCurrency(prices, coinGeckoId, currency);
    const fiatLine = p != null && p > 0 ? `~ ${formatFiat(token * p, currency)}` : null;

    const blob = await drawSnapshot(chain, conditionLabel, fiatLine);
    if (!blob) return;

    const file = new File([blob], 'gas-surfer.png', { type: 'image/png' });
    const shareData = { files: [file], title: t('shareSnapshotTitle'), text: `${chain.name} — ${conditionLabel}` };

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      /* fall through */
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gas-surfer.png';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={!chain}
      className="rounded-xl glass border border-slate-300/50 dark:border-white/20 px-3 py-2 text-sm font-medium text-slate-600 dark:text-surf-200 hover:bg-slate-200/50 dark:hover:bg-white/10 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
    >
      {t('shareSnapshot')}
    </button>
  );
}
