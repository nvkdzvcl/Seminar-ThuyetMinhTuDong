import type { POI, Tour } from '../types';
import { MOCK_POIS, MOCK_TOURS } from '../data/mockData';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function validateGuestToken(token: string): Promise<{ tour: Tour; pois: POI[] }> {
  await delay(500);
  const tour = MOCK_TOURS.find((t) => t.qrToken === token && t.isActive);
  if (!tour) throw new Error('Token khong hop le hoac da het han');
  const pois = MOCK_POIS.filter((p) => tour.poiIds.includes(p.id));
  return { tour, pois };
}
