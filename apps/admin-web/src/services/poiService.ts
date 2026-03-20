import type { POI } from '../types';
import { MOCK_POIS } from '../data/mockData';
import { v4 as uuidv4 } from 'uuid';

let pois: POI[] = [...MOCK_POIS];
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchPOIs(): Promise<POI[]> {
  await delay(400);
  return [...pois];
}

export async function createPOI(data: Omit<POI, 'id' | 'createdAt' | 'updatedAt'>): Promise<POI> {
  await delay(500);
  const now = new Date().toISOString();
  const newPoi: POI = { ...data, id: uuidv4(), createdAt: now, updatedAt: now };
  pois.push(newPoi);
  return newPoi;
}

export async function updatePOI(id: string, data: Partial<Omit<POI, 'id' | 'createdAt'>>): Promise<POI> {
  await delay(500);
  const idx = pois.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('POI not found');
  pois[idx] = { ...pois[idx], ...data, updatedAt: new Date().toISOString() };
  return pois[idx];
}

export async function deletePOI(id: string): Promise<void> {
  await delay(400);
  pois = pois.filter((p) => p.id !== id);
}
