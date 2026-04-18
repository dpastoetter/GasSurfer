import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

describe('optional Gas Surfer API (Express)', () => {
  let server: ReturnType<typeof createServer>;
  let port: number;

  beforeAll(async () => {
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

  it('GET /api/ticks/recent returns ticks array', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/api/ticks/recent?limit=2`);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ticks?: unknown[] };
    expect(Array.isArray(json.ticks)).toBe(true);
  });
});
