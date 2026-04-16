/**
 * Express app for Gas Surfer API (samples, averages, ticks, snapshot).
 * Imported by `index.js` (listen) and by contract tests.
 */

import express from 'express';
import { upsertSamples, getAllAverages, insertFeeTick, getLatestSnapshotJson, getRecentFeeTicks } from './db.js';
import {
  securityHeaders,
  corsOptions,
  BODY_LIMIT,
  samplesRateLimiter,
  averagesRateLimiter,
  ticksRateLimiter,
  snapshotRateLimiter,
  ticksRecentRateLimiter,
} from './middleware.js';
import { validateSample, validateChainIds, validateTicksPayload, MAX_SAMPLES } from './security.js';

const app = express();

if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

app.use(securityHeaders());
app.use(corsOptions());
app.use(express.json({ limit: BODY_LIMIT, strict: true }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'gas-surfer-api' });
});

app.post(
  '/api/samples',
  samplesRateLimiter,
  async (req, res) => {
    try {
      const body = req.body;
      if (body == null || typeof body !== 'object') {
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
      const raw = Array.isArray(body.samples) ? body.samples : [];
      if (raw.length === 0) {
        return res.status(400).json({ error: 'Missing or empty "samples" array' });
      }
      if (raw.length > MAX_SAMPLES) {
        return res.status(400).json({ error: `Too many samples (max ${MAX_SAMPLES})` });
      }
      const samples = [];
      for (const s of raw) {
        const v = validateSample(s);
        if (v) samples.push(v);
      }
      if (samples.length === 0) {
        return res.status(400).json({ error: 'No valid samples (check chainId, value, timestamp)' });
      }
      await upsertSamples(samples);
      return res.json({ ok: true, recorded: samples.length });
    } catch (err) {
      console.error('POST /api/samples', err);
      return res.status(500).json({ error: 'Failed to record samples' });
    }
  }
);

app.get(
  '/api/averages',
  averagesRateLimiter,
  async (req, res) => {
    try {
      const raw = req.query.chainIds;
      const chainIds =
        typeof raw === 'string'
          ? raw.split(',').map((s) => s.trim()).filter(Boolean)
          : [];
      const validated = validateChainIds(chainIds);
      if (!validated) {
        return res.status(400).json({
          error: 'Missing or invalid "chainIds" (e.g. ?chainIds=1,0,8453, max 20 allowed chain IDs)',
        });
      }
      const averages = await getAllAverages(validated);
      return res.json(averages);
    } catch (err) {
      console.error('GET /api/averages', err);
      return res.status(500).json({ error: 'Failed to get averages' });
    }
  }
);

app.post(
  '/api/ticks',
  ticksRateLimiter,
  async (req, res) => {
    try {
      const body = req.body;
      const normalized = validateTicksPayload(body);
      if (!normalized) {
        return res.status(400).json({ error: 'Invalid ticks payload' });
      }
      const jsonStr = JSON.stringify(normalized);
      if (jsonStr.length > 512_000) {
        return res.status(400).json({ error: 'Payload too large' });
      }
      await insertFeeTick(jsonStr);
      return res.json({ ok: true });
    } catch (err) {
      console.error('POST /api/ticks', err);
      return res.status(500).json({ error: 'Failed to store tick' });
    }
  }
);

async function handleSnapshot(_req, res) {
  try {
    const raw = await getLatestSnapshotJson();
    if (raw == null) {
      return res.status(404).json({ error: 'No snapshot yet' });
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=5');
    return res.send(raw);
  } catch (err) {
    console.error('GET snapshot', err);
    return res.status(500).json({ error: 'Failed to read snapshot' });
  }
}

app.get('/api/v1/snapshot.json', snapshotRateLimiter, handleSnapshot);
app.get('/api/snapshot.json', snapshotRateLimiter, handleSnapshot);

app.get(
  '/api/ticks/recent',
  ticksRecentRateLimiter,
  async (req, res) => {
    try {
      const raw = req.query.limit;
      const parsed = typeof raw === 'string' ? parseInt(raw, 10) : 60;
      const limit = Number.isFinite(parsed) ? Math.min(120, Math.max(1, parsed)) : 60;
      const rows = await getRecentFeeTicks(limit);
      const ticks = rows.map((r) => {
        let snapshot = null;
        try {
          snapshot = JSON.parse(r.payload);
        } catch {
          /* skip bad row */
        }
        return {
          id: r.id,
          createdAt: r.created_at,
          snapshot,
        };
      });
      return res.json({ ticks });
    } catch (err) {
      console.error('GET /api/ticks/recent', err);
      return res.status(500).json({ error: 'Failed to read ticks' });
    }
  }
);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
