import { useMemo } from 'react';
import type { POI } from '../types';
import { haversineDistance } from '../utils/haversine';
import { isMainCategory } from '../types';

export function useGeofence(
  pois: POI[],
  userLat: number | null,
  userLng: number | null
) {
  const activePOI = useMemo(() => {
    if (userLat === null || userLng === null || pois.length === 0) return null;
    let nearest: POI | null = null;
    let nearestDist = Infinity;

    for (const poi of pois) {
      if (!isMainCategory(poi.category)) continue;
      const dist = haversineDistance(userLat, userLng, poi.lat, poi.lng);
      if (dist <= poi.radius && dist < nearestDist) {
        nearest = poi;
        nearestDist = dist;
      }
    }
    return nearest;
  }, [pois, userLat, userLng]);

  return { activePOI };
}
