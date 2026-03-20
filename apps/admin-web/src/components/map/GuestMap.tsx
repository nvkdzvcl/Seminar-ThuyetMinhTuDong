import { MapContainer, TileLayer, Circle, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import type { POI } from '../../types';
import { isMainCategory } from '../../types';
import { MAP_CENTER, MAP_ZOOM } from '../../data/mockData';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

interface GuestMapProps {
  pois: POI[];
  userLat: number | null;
  userLng: number | null;
  activePOI: POI | null;
}

export function GuestMap({ pois, userLat, userLng, activePOI }: GuestMapProps) {
  const center: [number, number] = userLat && userLng ? [userLat, userLng] : [MAP_CENTER.lat, MAP_CENTER.lng];
  return (
    <MapContainer center={center} zoom={MAP_ZOOM} className="h-full w-full" style={{ minHeight: 400 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {userLat && userLng && (
        <CircleMarker center={[userLat, userLng]} radius={8}
          pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.9, weight: 3 }}>
          <Popup>Vi tri cua ban</Popup>
        </CircleMarker>
      )}
      {pois.map((poi) => {
        const isMain = isMainCategory(poi.category);
        const isActive = activePOI?.id === poi.id;
        return (
          <span key={poi.id}>
            <Marker position={[poi.lat, poi.lng]}>
              <Popup>
                <strong>{poi.name}</strong>
                <br />
                <span className="text-xs">{poi.category}</span>
              </Popup>
            </Marker>
            {isMain && (
              <Circle center={[poi.lat, poi.lng]} radius={poi.radius}
                pathOptions={{
                  color: isActive ? '#22c55e' : '#6366f1',
                  fillOpacity: isActive ? 0.2 : 0.05,
                  weight: isActive ? 2 : 1,
                }}
              />
            )}
          </span>
        );
      })}
    </MapContainer>
  );
}
