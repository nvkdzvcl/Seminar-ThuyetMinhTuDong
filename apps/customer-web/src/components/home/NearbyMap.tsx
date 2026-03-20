import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";


import { icons } from "../../types/icons";
import type { ShopResponse } from "../../types/shop";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});



type NearbyMapProps = {
    currentPosition: [number, number];
    shops: ShopResponse[];
};

function NearbyMap({ currentPosition, shops }: NearbyMapProps) {
    return (
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm w-full">
            <div className="border-b border-slate-100 px-4 py-3">
                <h3 className="text-base font-bold text-slate-900">Bản đồ quán gần đây</h3>
                <p className="text-sm text-slate-500">Vị trí hiện tại và các quán quanh bạn</p>
            </div>

            <div className="h-[280px] w-full sm:h-[360px]">
                <MapContainer
                    center={currentPosition}
                    zoom={15}
                    scrollWheelZoom={true}
                    className="h-full w-full"
                >
                    <TileLayer
                        attribution="&copy; OpenStreetMap contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <Marker position={currentPosition} icon={icons.locationHumanMarker}>
                        
                        <Popup>Vị trí hiện tại của bạn</Popup>
                    </Marker>

                    {shops.map((shop) => (
                        <Marker key={shop.id} icon={icons.shopIconMarker} position={[shop.lat, shop.lng]}>
                            <Popup>
                                <div className="min-w-[160px]">
                                    <div className="font-semibold">{shop.name}</div>
                                    <div className="mt-1 text-sm text-slate-500">
                                        {shop.address}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}

export default NearbyMap;
