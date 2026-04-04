/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import { locationSocketService } from "../../services/locationSocket";
import { icons } from "../../types/icons";
import type { ShopResponse } from "../../types/shop";
import type { ApiResponse, PagingDto } from "../../types/api";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type PositionTuple = [number, number];

type TourRouteRealtimeMapProps = {
    shops: ShopResponse[];
    className?: string;
};

function RecenterMap({ center }: { center: PositionTuple }) {
    const map = useMap();

    useEffect(() => {
        map.setView(center, Math.max(map.getZoom(), 15), { animate: true });
    }, [center, map]);

    return null;
}

function FitTourBounds({ points }: { points: PositionTuple[] }) {
    const map = useMap();
    const hasFittedRef = useRef(false);

    useEffect(() => {
        if (hasFittedRef.current) return;
        if (points.length === 0) return;

        const bounds = L.latLngBounds(points.map((point) => L.latLng(point[0], point[1])));
        map.fitBounds(bounds.pad(0.18), { animate: true });
        hasFittedRef.current = true;
    }, [map, points]);

    return null;
}

function RoutingSegment({ from, to }: { from: PositionTuple; to: PositionTuple }) {
    const map = useMap();

    useEffect(() => {
        const routingControl = (L as any).Routing.control({
            waypoints: [L.latLng(from[0], from[1]), L.latLng(to[0], to[1])],
            routeWhileDragging: false,
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: false,
            show: false,
            collapsible: true,
            lineOptions: {
                styles: [{ color: "#16a34a", weight: 5, opacity: 0.9 }],
                extendToWaypoints: true,
                missingRouteTolerance: 10,
            },
            createMarker: () => null,
        }).addTo(map);

        return () => {
            map.removeControl(routingControl);
        };
    }, [from, map, to]);

    return null;
}

const formatDistance = (from: PositionTuple, to: PositionTuple) => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;

    const dLat = toRad(to[0] - from[0]);
    const dLng = toRad(to[1] - from[1]);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(from[0])) * Math.cos(toRad(to[0])) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = earthRadiusKm * c;

    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)} m`;
    }

    return `${distanceKm.toFixed(2)} km`;
};

export default function TourRouteRealtimeMap({ shops, className }: TourRouteRealtimeMapProps) {
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState("");
    const [currentPosition, setCurrentPosition] = useState<PositionTuple>([
        shops[0]?.lat ?? 10.762622,
        shops[0]?.lng ?? 106.660172,
    ]);
    const [realtimeNearbyShops, setRealtimeNearbyShops] = useState<ShopResponse[]>([]);

    const token = localStorage.getItem(import.meta.env.VITE_LS_ACCESS) || "";

    const tourPoints = useMemo<PositionTuple[]>(() => {
        return shops
            .filter((shop) => Number.isFinite(shop.lat) && Number.isFinite(shop.lng))
            .map((shop) => [shop.lat, shop.lng]);
    }, [shops]);

    const mapPoints = useMemo<PositionTuple[]>(() => {
        return [currentPosition, ...tourPoints];
    }, [currentPosition, tourPoints]);

    const otherRealtimeShops = useMemo(() => {
        const tourShopIds = new Set(shops.map((shop) => shop.id));
        return realtimeNearbyShops.filter((shop) => !tourShopIds.has(shop.id));
    }, [realtimeNearbyShops, shops]);

    useEffect(() => {
        if (!token) return;

        locationSocketService.connect(
            token,
            (response: ApiResponse<PagingDto<ShopResponse>>) => {
                setRealtimeNearbyShops(response.result?.items ?? []);
                setError("");
            },
            (errorResponse) => {
                setError(errorResponse.message || "Không nhận được dữ liệu realtime từ socket");
            },
            () => {
                setConnected(true);
            }
        );

        return () => {
            locationSocketService.disconnect();
            setConnected(false);
        };
    }, [token]);

    useEffect(() => {
        if (!connected) return;
        if (!navigator.geolocation) {
            setError("Trình duyệt không hỗ trợ GPS");
            return;
        }

        let lastSentAt = 0;
        let lastLat: number | null = null;
        let lastLng: number | null = null;

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setCurrentPosition([lat, lng]);

                const now = Date.now();
                const movedEnough =
                    lastLat === null ||
                    lastLng === null ||
                    Math.abs(lat - lastLat) > 0.00005 ||
                    Math.abs(lng - lastLng) > 0.00005;
                const enoughTimePassed = now - lastSentAt >= 2000;

                if (!movedEnough && !enoughTimePassed) return;

                lastLat = lat;
                lastLng = lng;
                lastSentAt = now;

                locationSocketService.sendLocation({
                    lat,
                    lng,
                    radius: 500000000,
                    page: 1,
                    size: 20,
                });
            },
            (geoError) => {
                console.error("watchPosition error", geoError);
                setError("Không lấy được vị trí hiện tại");
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, [connected]);

    if (shops.length === 0) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                Tour này chưa có dữ liệu quán để hiển thị trên bản đồ.
            </div>
        );
    }

    return (
        <div className={className || "rounded-[28px] border border-slate-200 bg-white shadow-sm"}>
            <style>{`.leaflet-routing-container { display: none !important; }`}</style>

            <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Bản đồ hành trình tour</h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Vị trí của bạn cập nhật realtime, chỉ hiển thị các tuyến đường thực tế tới từng quán trong tour.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                        <span className={`rounded-full px-3 py-1 ${connected ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                            {connected ? "Socket realtime đã kết nối" : "Đang kết nối socket"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                            {shops.length} quán trong tour
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}
            </div>

            <div className="h-[340px] w-full sm:h-[480px]">
                <MapContainer center={currentPosition} zoom={15} scrollWheelZoom className="h-full w-full">
                    <TileLayer
                        attribution="&copy; OpenStreetMap contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <RecenterMap center={currentPosition} />
                    <FitTourBounds points={mapPoints} />

                    <Marker icon={icons.locationHumanMarker} position={currentPosition}>
                        <Popup>Vị trí hiện tại của bạn</Popup>
                    </Marker>

                    {shops.map((shop, index) => (
                        <Marker
                            key={shop.id}
                            icon={ icons.locationShopMarker }
                            position={[shop.lat, shop.lng]}
                        >
                            <Popup>
                                <div className="min-w-[180px]">
                                    <div className="font-semibold">Điểm dừng {index + 1}: {shop.name}</div>
                                    <div className="mt-1 text-sm text-slate-500">{shop.address}</div>
                                    <div className="mt-2 text-xs text-slate-500">
                                        Cách bạn khoảng {formatDistance(currentPosition, [shop.lat, shop.lng])}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {otherRealtimeShops.map((shop) => (
                        <Marker key={`nearby-${shop.id}`} icon={icons.shopIconMarker} position={[shop.lat, shop.lng]}>
                            <Popup>
                                <div className="min-w-[180px]">
                                    <div className="font-semibold">Quán realtime gần bạn</div>
                                    <div className="mt-1 text-sm text-slate-700">{shop.name}</div>
                                    <div className="mt-1 text-xs text-slate-500">{shop.address}</div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {tourPoints.length > 0 && <RoutingSegment from={currentPosition} to={tourPoints[0]} />}
                    {tourPoints.map((point, index) => {
                        const nextPoint = tourPoints[index + 1];
                        if (!nextPoint) return null;
                        return <RoutingSegment key={`segment-${index}`} from={point} to={nextPoint} />;
                    })}
                </MapContainer>
            </div>

            <div className="grid gap-3 border-t border-slate-100 px-4 py-4 sm:grid-cols-2 xl:grid-cols-4 sm:px-5">
                <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Điểm bắt đầu</p>
                    <p className="mt-1 font-semibold text-slate-900">Vị trí hiện tại của bạn</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Điểm đến đầu tiên</p>
                    <p className="mt-1 font-semibold text-slate-900">{shops[0]?.name || "Chưa có"}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Tổng điểm dừng</p>
                    <p className="mt-1 font-semibold text-slate-900">{shops.length} quán</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Quán realtime gần bạn</p>
                    <p className="mt-1 font-semibold text-slate-900">{otherRealtimeShops.length} quán</p>
                </div>
            </div>
        </div>
    );
}
