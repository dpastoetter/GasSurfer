import type { SurfCondition } from '../types';

export type SendWindowVerdict = 'great' | 'ok' | 'wait';

const CONDITION_RANK: Record<SurfCondition, number> = {
  'surfs-up': 0,
  smooth: 1,
  choppy: 2,
  storm: 3,
};

export type SendWindowInput = {
  condition: SurfCondition;
  standardFee: number;
  avg7d?: number | null;
  /** This UTC hour is historically calm on device (tide table). */
  calmHourNow?: boolean;
  /** Another chain beats this one on standard-tx fiat cost. */
  hasCheaperChain?: boolean;
};

export type SendWindowResult = {
  verdict: SendWindowVerdict;
  score: number;
  /** i18n key suffix: sendWindowDetailGreat | ok | wait — with optional flags for interpolation */
  detailKey: 'sendWindowDetailGreat' | 'sendWindowDetailOk' | 'sendWindowDetailWait';
  belowAvg7d: boolean;
  calmHour: boolean;
  cheaperElsewhere: boolean;
};

/**
 * 0–100 score from current condition, 7d comparison, device calm hour, and cross-chain cost.
 */
export function computeSendWindowScore(input: SendWindowInput): SendWindowResult {
  let score = 0;
  const rank = CONDITION_RANK[input.condition];
  if (rank === 0) score += 35;
  else if (rank === 1) score += 25;
  else if (rank === 2) score += 10;

  let belowAvg7d = false;
  const avg = input.avg7d;
  if (avg != null && avg > 0 && Number.isFinite(input.standardFee)) {
    const pct = ((input.standardFee - avg) / avg) * 100;
    if (pct <= -5) {
      score += 30;
      belowAvg7d = true;
    } else if (pct <= 10) score += 12;
  }

  const calmHour = Boolean(input.calmHourNow);
  if (calmHour) score += 20;

  const cheaperElsewhere = Boolean(input.hasCheaperChain);
  if (cheaperElsewhere) score -= 15;

  score = Math.max(0, Math.min(100, score));

  let verdict: SendWindowVerdict;
  let detailKey: SendWindowResult['detailKey'];
  if (score >= 55) {
    verdict = 'great';
    detailKey = 'sendWindowDetailGreat';
  } else if (score >= 30) {
    verdict = 'ok';
    detailKey = 'sendWindowDetailOk';
  } else {
    verdict = 'wait';
    detailKey = 'sendWindowDetailWait';
  }

  return { verdict, score, detailKey, belowAvg7d, calmHour, cheaperElsewhere };
}

export function sendWindowVerdictLabelKey(verdict: SendWindowVerdict): 'sendWindowGreat' | 'sendWindowOk' | 'sendWindowWait' {
  if (verdict === 'great') return 'sendWindowGreat';
  if (verdict === 'ok') return 'sendWindowOk';
  return 'sendWindowWait';
}
