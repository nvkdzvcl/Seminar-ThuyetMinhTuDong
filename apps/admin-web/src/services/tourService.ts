import type { Tour } from '../types';
import { MOCK_TOURS } from '../data/mockData';
import { v4 as uuidv4 } from 'uuid';

let tours: Tour[] = [...MOCK_TOURS];
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchTours(): Promise<Tour[]> {
  await delay(400);
  return [...tours];
}

export async function createTour(name: string, poiIds: string[]): Promise<Tour> {
  await delay(500);
  const tour: Tour = {
    id: uuidv4(),
    name,
    poiIds,
    qrToken: uuidv4(),
    qrImageUrl: '',
    createdAt: new Date().toISOString(),
    isActive: true,
  };
  tours.push(tour);
  return tour;
}

export async function deleteTour(id: string): Promise<void> {
  await delay(400);
  tours = tours.filter((t) => t.id !== id);
}
