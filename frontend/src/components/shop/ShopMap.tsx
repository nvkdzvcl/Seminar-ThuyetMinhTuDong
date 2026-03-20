/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

import { icons } from "../../types/icons";
import type { ShopResponse } from "../../types/shop";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type RoutingProps = {
    from: [number, number];
    to: [number, number];
};

function RoutingMachine({ from, to }: RoutingProps) {
    const map = useMap();

    useEffect(() => {
        const routing = (L as any).Routing.control({
            waypoints: [L.latLng(from[0], from[1]), L.latLng(to[0], to[1])],
            lineOptions: {
                styles: [{ color: "#16a34a", weight: 5 }],
                extendToWaypoints: true,
                missingRouteTolerance: 10,
            },
            routeWhileDragging: false,
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            show: false,
            collapsible: true,
            createMarker: () => null,
        } as any).addTo(map);

        return () => {
            map.removeControl(routing);
        };
    }, [map, from, to]);

    return null;
}

type ShopMapProps = {
    currentPosition: [number, number];
    currentShop: ShopResponse;
    nearbyShops: ShopResponse[];
};

function ShopMap({ currentPosition, currentShop, nearbyShops }: ShopMapProps) {
    return (
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
                <h3 className="text-base font-bold text-slate-900">Bản đồ quán</h3>
                <p className="text-sm text-slate-500">
                    Xem vị trí hiện tại, quán đang xem và các quán trong bán kính 2km
                </p>
            </div>

            <div className="h-[320px] w-full sm:h-[420px]">
                <MapContainer
                    center={[currentShop.lat, currentShop.lng]}
                    zoom={15}
                    scrollWheelZoom
                    className="h-full w-full"
                >
                    <TileLayer
                        attribution="&copy; OpenStreetMap contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <Marker position={currentPosition}  icon={icons.locationHumanMarker}>
                        <Popup>Vị trí hiện tại của bạn</Popup>
                    </Marker>

                    <Marker position={[currentShop.lat, currentShop.lng]} icon={icons.locationShopMarker}>
                        <Popup>
                            <div>
                                <div className="font-semibold">{`# ${currentShop.id}, ${currentShop.name}`}</div>
                                <div> {`lat: ${currentShop.lat}, lng: ${currentShop.lng}`} </div>

                                <div className="mt-1 text-sm text-slate-500">
                                    {currentShop.address}
                                </div>
                            </div>
                        </Popup>
                    </Marker>

                    {nearbyShops
                        .filter((shop) => shop.id !== currentShop.id)
                        .map((shop) => (
                            <Marker key={shop.id} icon={icons.shopIconMarker} position={[shop.lat, shop.lng]}>
                                <Popup>
                                    <div>
                                        <div className="font-semibold">{`# ${shop.id}, ${shop.name}`}</div>
                                        <div> {`lat: ${shop.lat}, lng: ${shop.lng}`} </div>
                                        <div className="mt-1 text-sm text-slate-500">
                                            {shop.address}
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                    <RoutingMachine
                        from={currentPosition}
                        to={[currentShop.lat, currentShop.lng]}
                    />
                </MapContainer>
            </div>
        </div>
    );
}

export default ShopMap;
