import { useState, useCallback } from 'react';

const STORAGE_KEY = 'gas-surfer-favorites';

function loadIds(): number[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (!s) return [];
    const parsed = JSON.parse(s) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is number => typeof x === 'number' && Number.isFinite(x));
  } catch {
    return [];
  }
}

function saveIds(ids: number[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<number[]>(loadIds);

  const toggleFavorite = useCallback((chainId: number) => {
    setFavoriteIds((prev) => {
      const next = prev.includes(chainId) ? prev.filter((id) => id !== chainId) : [...prev, chainId];
      saveIds(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback((chainId: number) => favoriteIds.includes(chainId), [favoriteIds]);

  return { favoriteIds, toggleFavorite, isFavorite };
}
