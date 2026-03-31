/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

import { icons } from "../../types/icons";
import type { ShopResponse } from "../../types/shop";
import { getPoiCategoryLabel, getPoiMarkerIcon, resolvePoiCategoryKey } from "../../utils/poiMap";

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
    const routingRef = useRef<any>(null);

    useEffect(() => {
        const routing = (L as any).Routing.control({
            waypoints: [],
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
        } as any);
        routing.addTo(map);
        routingRef.current = routing;

        return () => {
            const currentRouting = routingRef.current;
            routingRef.current = null;

            if (!currentRouting) {
                return;
            }

            try {
                currentRouting.off?.();
            } catch {
                // ignore cleanup errors from plugin internals
            }

            try {
                currentRouting.getPlan?.().setWaypoints([]);
            } catch {
                // ignore when routing plan is already disposed
            }

            try {
                if ((map as any)._loaded) {
                    map.removeControl(currentRouting);
                }
            } catch {
                // ignore remove errors when map/control already unmounted
            }
        };
    }, [map]);

    useEffect(() => {
        const routing = routingRef.current;
        if (!routing) {
            return;
        }

        try {
            routing.setWaypoints([L.latLng(from[0], from[1]), L.latLng(to[0], to[1])]);
        } catch {
            // avoid runtime crash if plugin is in transient disposal state
        }
    }, [from[0], from[1], to[0], to[1]]);

    return null;
}

type ShopMapProps = {
    currentPosition: [number, number];
    currentShop: ShopResponse;
    nearbyShops: ShopResponse[];
};

function getShopCategoryKey(shop: ShopResponse) {
    return resolvePoiCategoryKey(shop.shopTypeName, shop.name, shop.description);
}

function getShopMarkerIcon(shop: ShopResponse) {
    const categoryKey = getShopCategoryKey(shop);
    if (!categoryKey) {
        return icons.locationShopMarker;
    }

    return getPoiMarkerIcon({
        categoryKey,
        status: "PUBLISHED",
    });
}

function ShopMap({ currentPosition, currentShop, nearbyShops }: ShopMapProps) {
    const [showNearbyShops, setShowNearbyShops] = useState(false);

    return (
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Bản đồ quán</h3>
                        <p className="text-sm text-slate-500">
                            Mặc định hiển thị vị trí của bạn, quán đang xem và đường đi.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowNearbyShops((prev) => !prev)}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                        {showNearbyShops
                            ? "Ẩn quán gần đây"
                            : `Hiện quán gần đây (${nearbyShops.filter((shop) => shop.id !== currentShop.id).length})`}
                    </button>
                </div>
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

                    <Marker position={currentPosition} icon={icons.locationHumanMarker}>
                        <Popup>Vị trí hiện tại của bạn</Popup>
                    </Marker>

                    <Marker position={[currentShop.lat, currentShop.lng]} icon={getShopMarkerIcon(currentShop)}>
                        <Popup>
                            <div>
                                <div className="font-semibold">{`# ${currentShop.id}, ${currentShop.name}`}</div>
                                <div> {`lat: ${currentShop.lat}, lng: ${currentShop.lng}`} </div>
                                <div className="mt-1 text-sm text-slate-500">{currentShop.address}</div>
                                <div className="mt-1 text-xs text-slate-500">
                                    Loại quán: {getPoiCategoryLabel(getShopCategoryKey(currentShop))}
                                </div>
                            </div>
                        </Popup>
                    </Marker>

                    {showNearbyShops
                        ? nearbyShops
                              .filter((shop) => shop.id !== currentShop.id)
                              .map((shop) => (
                                  <Marker
                                      key={shop.id}
                                      icon={getShopMarkerIcon(shop)}
                                      position={[shop.lat, shop.lng]}
                                  >
                                      <Popup>
                                          <div>
                                              <div className="font-semibold">{`# ${shop.id}, ${shop.name}`}</div>
                                              <div> {`lat: ${shop.lat}, lng: ${shop.lng}`} </div>
                                              <div className="mt-1 text-sm text-slate-500">{shop.address}</div>
                                              <div className="mt-1 text-xs text-slate-500">
                                                  Loại quán: {getPoiCategoryLabel(getShopCategoryKey(shop))}
                                              </div>
                                          </div>
                                      </Popup>
                                  </Marker>
                              ))
                        : null}

                    <RoutingMachine from={currentPosition} to={[currentShop.lat, currentShop.lng]} />
                </MapContainer>
            </div>
        </div>
    );
}

export default ShopMap;
