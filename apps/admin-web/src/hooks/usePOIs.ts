import { useState, useEffect, useCallback } from 'react';
import type { POI } from '../types';
import { fetchPOIs, createPOI, updatePOI, deletePOI } from '../services/poiService';

export function usePOIs() {
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPOIs();
      setPois(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load POIs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addPOI = useCallback(async (data: Omit<POI, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPoi = await createPOI(data);
    setPois((prev) => [...prev, newPoi]);
    return newPoi;
  }, []);

  const editPOI = useCallback(async (id: string, data: Partial<Omit<POI, 'id' | 'createdAt'>>) => {
    const updated = await updatePOI(id, data);
    setPois((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  }, []);

  const removePOI = useCallback(async (id: string) => {
    await deletePOI(id);
    setPois((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { pois, loading, error, addPOI, editPOI, removePOI, reload: load };
}
