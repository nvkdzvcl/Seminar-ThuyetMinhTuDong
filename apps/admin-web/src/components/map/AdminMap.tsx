import { MapContainer, TileLayer, Circle, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { POI } from '../../types';
import { isMainCategory } from '../../types';
import { MAP_CENTER, MAP_ZOOM } from '../../data/mockData';

// Fix default marker icon issue with bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const mainIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface AdminMapProps {
  pois: POI[];
  selectedPOI?: POI | null;
  onMapClick: (lat: number, lng: number) => void;
  onPOIClick: (poi: POI) => void;
}

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function AdminMap({ pois, selectedPOI, onMapClick, onPOIClick }: AdminMapProps) {
  return (
    <MapContainer center={[MAP_CENTER.lat, MAP_CENTER.lng]} zoom={MAP_ZOOM} className="h-full w-full rounded-xl" style={{ minHeight: 500 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onClick={onMapClick} />
      {pois.map((poi) => {
        const isMain = isMainCategory(poi.category);
        const isSelected = selectedPOI?.id === poi.id;
        return (
          <span key={poi.id}>
            <Marker
              position={[poi.lat, poi.lng]}
              icon={mainIcon}
              eventHandlers={{ click: () => onPOIClick(poi) }}
            >
              <Popup>
                <strong>{poi.name}</strong>
                <br />
                <span className="text-xs">{poi.category} | R={poi.radius}m</span>
              </Popup>
            </Marker>
            <Circle
              center={[poi.lat, poi.lng]}
              radius={poi.radius}
              pathOptions={{
                color: isSelected ? '#f59e0b' : isMain ? '#6366f1' : '#64748b',
                fillOpacity: isSelected ? 0.25 : 0.1,
                dashArray: isSelected ? '8 4' : undefined,
                weight: isSelected ? 3 : 1,
              }}
            />
          </span>
        );
      })}
    </MapContainer>
  );
}
