import type { ChainGas, SurfCondition } from '../types';
import { ETHEREUM_CHAIN_ID } from '../types';

const DB_NAME = 'gas-surfer-fee-samples';
const DB_VERSION = 1;
const STORE = 'ticks';
const MAX_ROWS = 12_000;

export type FeeTickRow = {
  id?: number;
  ts: number;
  stale: boolean;
  ethStandard: number | null;
  ethCondition: SurfCondition | null;
  cheapestChainId: number | null;
  cheapestName: string | null;
  cheapestStandard: number | null;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        os.createIndex('byTs', 'ts', { unique: false });
      }
    };
  });
}

export async function appendFeeTick(chains: ChainGas[], stale: boolean): Promise<void> {
  if (chains.length === 0 || typeof indexedDB === 'undefined') return;
  const eth = chains.find((c) => c.chainId === ETHEREUM_CHAIN_ID);
  let cheapest: ChainGas | null = null;
  for (const c of chains) {
    if (cheapest == null || c.gas.standard < cheapest.gas.standard) cheapest = c;
  }
  const row: FeeTickRow = {
    ts: Date.now(),
    stale,
    ethStandard: eth?.gas.standard ?? null,
    ethCondition: eth?.condition ?? null,
    cheapestChainId: cheapest?.chainId ?? null,
    cheapestName: cheapest?.name ?? null,
    cheapestStandard: cheapest?.gas.standard ?? null,
  };
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE).add(row);
    });

    const count = await new Promise<number>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const r = tx.objectStore(STORE).count();
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });

    if (count > MAX_ROWS) {
      const toDelete = count - MAX_ROWS;
      const keys = await new Promise<IDBValidKey[]>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const idx = tx.objectStore(STORE).index('byTs');
        const out: IDBValidKey[] = [];
        const cur = idx.openCursor();
        cur.onsuccess = () => {
          const c = cur.result;
          if (!c || out.length >= toDelete) {
            resolve(out);
            return;
          }
          out.push(c.primaryKey);
          c.continue();
        };
        cur.onerror = () => reject(cur.error);
      });
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        const os = tx.objectStore(STORE);
        for (const k of keys) os.delete(k);
      });
    }
    db.close();
  } catch {
    /* ignore */
  }
}

export async function loadTicksSince(sinceMs: number): Promise<FeeTickRow[]> {
  if (typeof indexedDB === 'undefined') return [];
  try {
    const db = await openDb();
    const rows = await new Promise<FeeTickRow[]>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const idx = tx.objectStore(STORE).index('byTs');
      const out: FeeTickRow[] = [];
      const cur = idx.openCursor(IDBKeyRange.lowerBound(sinceMs));
      cur.onsuccess = () => {
        const c = cur.result;
        if (!c) {
          resolve(out);
          return;
        }
        out.push(c.value as FeeTickRow);
        c.continue();
      };
      cur.onerror = () => reject(cur.error);
    });
    db.close();
    return rows;
  } catch {
    return [];
  }
}
