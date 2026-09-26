import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { unlinkSync, existsSync } from 'node:fs';

describe('optional Gas Surfer API (Express)', () => {
  let server: ReturnType<typeof createServer>;
  let port: number;
  let dbPath: string;

  beforeAll(async () => {
    dbPath = join(tmpdir(), `gas-surfer-contract-${process.pid}-${Date.now()}.db`);
    process.env.GAS_SURFER_DB = dbPath;
    const mod = await import('../server/app.js');
    server = createServer(mod.default);
    await new Promise<void>((resolve, reject) => {
      server.listen(0, '127.0.0.1', () => resolve());
      server.on('error', reject);
    });
    const addr = server.address() as AddressInfo;
    port = addr.port;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err?: Error) => (err ? reject(err) : resolve()));
    });
    try {
      if (existsSync(dbPath)) unlinkSync(dbPath);
    } catch {
      /* ignore */
    }
  });

  it('GET /api/health returns JSON ok', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok?: boolean; service?: string };
    expect(json.ok).toBe(true);
    expect(json.service).toBe('gas-surfer-api');
  });

  it('GET /api/averages without chainIds returns 400', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/api/averages`);
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error?: string };
    expect(json.error).toBeTruthy();
  });

  it('GET /api/status returns 404 without snapshot', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/api/status`);
    expect(res.status).toBe(404);
    const json = (await res.json()) as { chains?: unknown[] };
    expect(Array.isArray(json.chains)).toBe(true);
  });

  it('GET /api/ticks/recent returns ticks array', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/api/ticks/recent?limit=2`);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ticks?: unknown[] };
    expect(Array.isArray(json.ticks)).toBe(true);
  });
});
