/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import { locationSocketService } from "../../services/locationSocket";
import type { ShopResponse } from "../../types/shop";
import { useAppDispatch, useAppSelector } from "../../stores/hooks";
import { setCurrentShop, setNearbyShops } from "../../stores/slices/shopSlice";
import { setAutoTurnOnNearbyShopAudio } from "../../stores/slices/audioSlice";
import { useAudioPlayer } from "../../stores/useAudioPlayer";
import ShopCard from "../../components/shop/ShopCard";
import { icons } from "../../types/icons";
import { resolveMediaUrl } from "../../utils/media";
import { usePoiMapData } from "../../hooks/usePoiMapData";
import { getPoiCategoryLabel, getPoiMarkerIcon, getPoiStatusLabel } from "../../utils/poiMap";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type PositionTuple = [number, number];

function RoutingMachine({ from, to }: { from: PositionTuple; to: PositionTuple }) {
    const map = useMap();
    const routingRef = useRef<any>(null);

    useEffect(() => {
        const routingControl = (L as any).Routing.control({
            waypoints: [],
            routeWhileDragging: false,
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            show: false,
            lineOptions: {
                styles: [{ color: "#16a34a", weight: 5 }],
                extendToWaypoints: true,
                missingRouteTolerance: 10,
            },
            createMarker: () => null,
        });
        routingControl.addTo(map);
        routingRef.current = routingControl;

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
        const routingControl = routingRef.current;
        if (!routingControl) {
            return;
        }

        try {
            routingControl.setWaypoints([L.latLng(from[0], from[1]), L.latLng(to[0], to[1])]);
        } catch {
            // avoid runtime crash if plugin is in transient disposal state
        }
    }, [from[0], from[1], to[0], to[1]]);

    return null;
}

function RecenterMap({ center }: { center: PositionTuple }) {
    const map = useMap();

    useEffect(() => {
        map.setView(center, map.getZoom(), {
            animate: true,
        });
    }, [map, center]);

    return null;
}



export default function NearbyShopPage() {
    const dispatch = useAppDispatch();
    const { shops, currentShop } = useAppSelector((state) => state.shop);
    const {
        currentAudio,
        isAudioPlaying,
        playAudio,
        toggleAudio,
        stopAudio,
        autoTurnOnNearbyShopAudio,
    } = useAudioPlayer();

    const [error, setError] = useState("");
    const [connected, setConnected] = useState(false);
    const [currentPosition, setCurrentPosition] = useState<PositionTuple>([
        10.7130418, 106.6189652,
    ]);
    const { pois, error: poiError } = usePoiMapData();

    const token = localStorage.getItem(import.meta.env.VITE_LS_ACCESS) || "";
    const currentShopIdRef = useRef<number | null>(null);
    const autoAudioRef = useRef<boolean>(autoTurnOnNearbyShopAudio);

    useEffect(() => {
        currentShopIdRef.current = currentShop?.id ?? null;
    }, [currentShop]);

    useEffect(() => {
        autoAudioRef.current = autoTurnOnNearbyShopAudio;
    }, [autoTurnOnNearbyShopAudio]);

    const playShopAudio = async (shop: ShopResponse, trigger: "MANUAL" | "REALTIME" = "MANUAL") => {
        try {
            await playAudio({
                id: shop.id,
                type: "SHOP",
                url: shop.audioURL,
                title: shop.name,
                trigger,
            });
        } catch (err) {
            console.error("Play audio failed:", err);
        }
    };

    const toggleCurrentShopAudio = async () => {
        if (!currentShop?.audioURL) return;

        try {
            await toggleAudio({
                id: currentShop.id,
                type: "SHOP",
                url: currentShop.audioURL,
                title: currentShop.name,
            });
        } catch (err) {
            console.error("Toggle audio failed:", err);
        }
    };

    useEffect(() => {
        locationSocketService.connect(
            token,
            (response) => {
                const items = response.result?.items || [];
                dispatch(setNearbyShops(items));
                setError("");

                if (items.length === 0) {
                    dispatch(setCurrentShop(null));
                    return;
                }

                const nearestShop = items[0];
                const isSameCurrentShop = currentShopIdRef.current === nearestShop.id;

                dispatch(setCurrentShop(nearestShop));

                if (
                    autoAudioRef.current &&
                    nearestShop.audioURL &&
                    !isSameCurrentShop
                ) {
                    playShopAudio(nearestShop, "REALTIME");
                }
            },
            (errorResponse) => {
                setError(errorResponse.message || "Có lỗi xảy ra");
            },
            () => {
                setConnected(true);
            }
        );

        return () => {
            stopAudio();
            locationSocketService.disconnect();
            setConnected(false);
        };
    }, [token, dispatch]);

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
                const coords: PositionTuple = [lat, lng];

                setCurrentPosition(coords);
                setError("");

                const now = Date.now();

                const movedEnough =
                    lastLat === null ||
                    lastLng === null ||
                    Math.abs(lat - lastLat) > 0.00005 ||
                    Math.abs(lng - lastLng) > 0.00005;

                const enoughTimePassed = now - lastSentAt > 2000;

                if (!movedEnough && !enoughTimePassed) {
                    return;
                }

                lastLat = lat;
                lastLng = lng;
                lastSentAt = now;

                locationSocketService.sendLocation({
                    lat,
                    lng,
                    radius: 500000000,
                    page: 1,
                    size: 10,
                });
            },
            (geoError) => {
                console.error("watchPosition error:", geoError);
                setError("Không lấy được vị trí hiện tại");
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 10000,
            }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, [connected]);
    const otherShops = useMemo(() => {
        return shops.filter((shop) => shop.id !== currentShop?.id);
    }, [shops, currentShop]);
    const currentShopImageSrc = resolveMediaUrl(
        currentShop?.imageName,
        import.meta.env.VITE_SHOP_IMAGE_API,
        "https://placehold.co/800x500?text=Shop"
    );

    const handleOpenDirections = () => {
        if (!currentShop) return;

        const url = `https://www.google.com/maps/dir/${currentPosition[0]},${currentPosition[1]}/${currentShop.lat},${currentShop.lng}`;
        window.open(url, "_blank");
    };

    const handleListenOtherShopAudio = (shopId: number) => {
        const shop = otherShops.find((item) => item.id === shopId);
        if (!shop) return;

        void playShopAudio(shop);
        dispatch(setCurrentShop(shop));
    };

    const handleViewOtherShop = (shopId: number) => {
        console.log("Xem quán:", shopId);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <style>{`
        .leaflet-routing-container {
          display: none !important;
        }
      `}</style>

            <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                            Shop gần bạn
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            {connected ? "Đã kết nối realtime" : "Đang kết nối realtime..."}
                        </p>
                    </div>

                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <input
                            type="checkbox"
                            checked={autoTurnOnNearbyShopAudio}
                            onChange={(e) => dispatch(setAutoTurnOnNearbyShopAudio(e.target.checked))}
                            className="h-4 w-4 rounded border-slate-300"
                        />
                        <span className="text-sm font-medium text-slate-700">
                            Tự phát audio khi tới gần quán
                        </span>
                    </label>
                </div>

                {error && (
                    <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {poiError && (
                    <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        {poiError}
                    </div>
                )}

                {currentShop ? (
                    <>
                        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 px-4 py-3">
                                <h2 className="text-lg font-bold text-slate-900">
                                    Bản đồ shop gần nhất
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Hiển thị vị trí hiện tại, các POI và đường đi tới quán gần nhất.
                                    POI: {pois.length}
                                </p>
                            </div>

                            <div className="h-[320px] w-full sm:h-[460px]">
                                <MapContainer
                                    center={currentPosition}
                                    zoom={15}
                                    scrollWheelZoom
                                    className="h-full w-full"
                                >
                                    <TileLayer
                                        attribution="&copy; OpenStreetMap contributors"
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />

                                    <RecenterMap center={currentPosition} />

                                    <Marker icon={icons.locationHumanMarker} position={currentPosition}>
                                        <Popup>Vị trí hiện tại của bạn</Popup>
                                    </Marker>

                                    {pois.map((poi) => (
                                        <Marker
                                            key={`poi-${poi.id}`}
                                            icon={getPoiMarkerIcon(poi)}
                                            position={[poi.lat, poi.lng]}
                                        >
                                            <Popup>
                                                <div className="min-w-[180px]">
                                                    <div className="font-semibold">{poi.name}</div>
                                                    <div className="mt-1 text-sm text-slate-500">
                                                        {poi.address || "Chưa có địa chỉ"}
                                                    </div>
                                                    <div className="mt-2 text-xs text-slate-500">
                                                        Loại quán: {getPoiCategoryLabel(poi.categoryKey)}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        Trạng thái: {getPoiStatusLabel(poi.status)}
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

                        <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                                <img
                                    src={currentShopImageSrc}
                                    alt={currentShop.name}
                                    className="h-64 w-full rounded-[24px] object-cover"
                                />

                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                                        {currentShop.name}
                                    </h2>

                                    <p className="mt-2 text-sm text-slate-600">
                                        {currentShop.address}
                                    </p>

                                    <div className="mt-5 grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={handleOpenDirections}
                                            className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-100"
                                        >
                                            Tới quán
                                        </button>

                                        <button
                                            type="button"
                                            onClick={toggleCurrentShopAudio}
                                            className="rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
                                        >
                                            {isAudioPlaying && currentAudio?.type === "SHOP" && currentAudio.id === currentShop.id
                                                ? "Tắt audio"
                                                : "Phát audio"}
                                        </button>
                                    </div>

                                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-2xl bg-slate-50 p-4">
                                            <p className="text-sm text-slate-500">
                                                Chi phí trung bình
                                            </p>
                                            <p className="mt-1 font-semibold text-slate-900">
                                                {currentShop.avgCostPerPerson.toLocaleString(
                                                    "vi-VN"
                                                )}
                                                đ / người
                                            </p>
                                        </div>

                                        <div className="rounded-2xl bg-slate-50 p-4">
                                            <p className="text-sm text-slate-500">Thời gian chờ</p>
                                            <p className="mt-1 font-semibold text-slate-900">
                                                {currentShop.avgWaitTimeMin} phút
                                            </p>
                                        </div>

                                        <div className="rounded-2xl bg-slate-50 p-4">
                                            <p className="text-sm text-slate-500">Thời gian ăn</p>
                                            <p className="mt-1 font-semibold text-slate-900">
                                                {currentShop.avgEatTimeMin} phút
                                            </p>
                                        </div>

                                        <div className="rounded-2xl bg-slate-50 p-4">
                                            <p className="text-sm text-slate-500">Trạng thái</p>
                                            <p className="mt-1 font-semibold text-slate-900">
                                                {currentShop.status}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                                        <p className="text-sm text-slate-500">Mô tả</p>
                                        <p className="mt-1 text-sm text-slate-700">
                                            {currentShop.description || "Chưa có mô tả"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-sm">
                        Chưa có shop nào gần bạn. Hệ thống sẽ tự tìm lại sau mỗi 10 giây.
                    </div>
                )}

                <div className="mt-8">
                    <h3 className="mb-4 text-xl font-bold text-slate-900">Các shop khác</h3>

                    {otherShops.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
                            Chưa có shop khác trong bán kính 2km
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {otherShops.map((shop) => (
                                <ShopCard
                                    key={shop.id}
                                    id={shop.id}
                                    image={shop.imageName}
                                    shopName={shop.name}
                                    onViewShop={handleViewOtherShop}
                                    rating={4.6}
                                    category="Ẩm thực đường phố"
                                    onListenAudio={handleListenOtherShopAudio}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
