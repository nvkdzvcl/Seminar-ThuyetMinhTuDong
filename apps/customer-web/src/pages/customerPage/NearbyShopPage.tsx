/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import { locationSocketService } from "../../services/locationSocket";
import { shopService } from "../../services/shopService";
import type { ShopResponse } from "../../types/shop";
import { useAppDispatch, useAppSelector } from "../../stores/hooks";
import { setCurrentShop, setNearbyShops } from "../../stores/slices/shopSlice";
import { setAutoTurnOnNearbyShopAudio } from "../../stores/slices/audioSlice";
import { useAudioPlayer } from "../../stores/useAudioPlayer";
import ShopCard from "../../components/shop/ShopCard";
import { icons } from "../../types/icons";
import { resolveMediaUrl } from "../../utils/media";
import { resolvePreferredLanguage } from "../../utils/language";
import { usePoiMapData } from "../../hooks/usePoiMapData";
import { getPoiCategoryLabel, getPoiMarkerIcon, getPoiStatusLabel } from "../../utils/poiMap";
import { notifyError, notifyInfo, notifyWarning } from "../../utils/notify";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type PositionTuple = [number, number];
const NEARBY_RADIUS_KM = 2;
const POI_PROXIMITY_ALERT_RADIUS_KM = 0.1;
const POI_ALERT_MAX_ITEMS = 5;

function calculateDistanceKm(from: PositionTuple, to: PositionTuple): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const dLat = toRad(to[0] - from[0]);
    const dLng = toRad(to[1] - from[1]);
    const lat1 = toRad(from[0]);
    const lat2 = toRad(to[0]);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return 6371 * c;
}

function formatDistance(distanceKm: number): string {
    const distanceMeter = Math.round(distanceKm * 1000);
    if (distanceMeter < 1000) {
        return `${distanceMeter}m`;
    }
    return `${distanceKm.toFixed(2)}km`;
}

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

function resolveBackendAudioUrl(rawAudioPath?: string | null): string | undefined {
    if (!rawAudioPath) return undefined;
    if (/^https?:\/\//i.test(rawAudioPath)) return rawAudioPath;

    const base = (import.meta.env.VITE_BACKEND_API || "").replace(/\/+$/, "");
    const normalizedPath = rawAudioPath.startsWith("/") ? rawAudioPath : `/${rawAudioPath}`;

    if (!base) {
        return normalizedPath;
    }

    return `${base}${normalizedPath}`;
}

function resolveRequestErrorMessage(error: unknown, fallback: string): string {
    if ((error as { response?: { data?: { message?: string } } })?.response?.data?.message) {
        return (error as { response: { data: { message: string } } }).response.data.message;
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
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
    const [loadingPoiId, setLoadingPoiId] = useState<string | null>(null);
    const { pois, error: poiError } = usePoiMapData();

    const token = localStorage.getItem(import.meta.env.VITE_LS_ACCESS) || "";
    const currentShopIdRef = useRef<number | null>(null);
    const autoAudioRef = useRef<boolean>(autoTurnOnNearbyShopAudio);
    const currentPositionRef = useRef<PositionTuple>(currentPosition);
    const lastNearbyPoiAlertRef = useRef<string | null>(null);

    useEffect(() => {
        currentShopIdRef.current = currentShop?.id ?? null;
    }, [currentShop]);

    useEffect(() => {
        currentPositionRef.current = currentPosition;
    }, [currentPosition]);

    useEffect(() => {
        autoAudioRef.current = autoTurnOnNearbyShopAudio;
    }, [autoTurnOnNearbyShopAudio]);

    const playShopNarration = async (shop: ShopResponse, trigger: "MANUAL" | "REALTIME" = "MANUAL") => {
        try {
            const preferredLanguage = resolvePreferredLanguage();
            const narrationRes = await shopService.getShopNarration(shop.id, preferredLanguage);
            const narrationAudioUrl = resolveBackendAudioUrl(narrationRes.result?.audioUrl);

            if (!narrationAudioUrl) {
                if (trigger === "MANUAL") {
                    notifyWarning(`KhÃ´ng táº¡o Ä‘Æ°á»£c audio cho quÃ¡n ${shop.name}.`);
                }
                return;
            }

            await playAudio({
                id: shop.id,
                type: "SHOP",
                url: narrationAudioUrl,
                title: shop.name,
                shopId: shop.id,
                trigger,
                transcript: narrationRes.result?.script,
                transcriptLanguage: narrationRes.result?.language,
            });
        } catch (err) {
            console.error("Play shop narration failed:", err);
            if (trigger === "MANUAL") {
                notifyError(
                    resolveRequestErrorMessage(err, `KhÃ´ng thá»ƒ phÃ¡t audio cá»§a quÃ¡n ${shop.name}. Vui lÃ²ng thá»­ láº¡i.`)
                );
            }
        }
    };

    const toggleCurrentShopAudio = async () => {
        if (!currentShop) return;

        try {
            const isCurrentShopAudio =
                currentAudio?.type === "SHOP" &&
                currentAudio.id === currentShop.id &&
                Boolean(currentAudio.url);

            if (!isCurrentShopAudio) {
                await playShopNarration(currentShop, "MANUAL");
                return;
            }

            await toggleAudio({
                id: currentShop.id,
                type: "SHOP",
                url: currentAudio?.url,
                title: currentShop.name,
                shopId: currentShop.id,
                transcript: currentAudio?.transcript,
                transcriptLanguage: currentAudio?.transcriptLanguage,
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
                const position = currentPositionRef.current;
                const sortedItems = [...items].sort(
                    (a, b) =>
                        calculateDistanceKm(position, [a.lat, a.lng]) -
                        calculateDistanceKm(position, [b.lat, b.lng])
                );
                dispatch(setNearbyShops(sortedItems));
                setError("");

                if (sortedItems.length === 0) {
                    dispatch(setCurrentShop(null));
                    return;
                }

                const nearestShop = sortedItems[0];
                const isSameCurrentShop = currentShopIdRef.current === nearestShop.id;

                dispatch(setCurrentShop(nearestShop));

                if (
                    autoAudioRef.current &&
                    !isSameCurrentShop
                ) {
                    void playShopNarration(nearestShop, "REALTIME");
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
                    radius: NEARBY_RADIUS_KM,
                    page: 1,
                    size: 10,
                });
            },
            (geoError) => {
                if (geoError.code === geoError.TIMEOUT) {
                    setError("GPS phản hồi chậm. Hệ thống sẽ tự thử lại.");
                    return;
                }
                console.error("watchPosition error:", geoError);
                setError("Không lấy được vị trí hiện tại");
            },
            {
                enableHighAccuracy: false,
                maximumAge: 15000,
                timeout: 20000,
            }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, [connected]);
    const otherShops = useMemo(() => {
        return shops.filter((shop) => shop.id !== currentShop?.id);
    }, [shops, currentShop]);
    const nearbyPoiCandidates = useMemo(() => {
        return pois
            .filter((poi) => Boolean(poi.shopId))
            .map((poi) => ({
                ...poi,
                distanceKm: calculateDistanceKm(currentPosition, [poi.lat, poi.lng]),
            }))
            .filter((poi) => poi.distanceKm <= POI_PROXIMITY_ALERT_RADIUS_KM)
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .slice(0, POI_ALERT_MAX_ITEMS);
    }, [pois, currentPosition]);
    const nearestNearbyPoi = nearbyPoiCandidates[0] ?? null;
    const currentShopImageSrc = resolveMediaUrl(
        currentShop?.imageName,
        import.meta.env.VITE_SHOP_IMAGE_API,
        "https://placehold.co/800x500?text=Cua+hang",
        "uploads/shop-images"
    );
    const currentShopDisplayDescription =
        currentShop?.shortDescription || "Chưa cập nhật mô tả ngắn";

    const handleOpenDirections = () => {
        if (!currentShop) return;

        const url = `https://www.google.com/maps/dir/${currentPosition[0]},${currentPosition[1]}/${currentShop.lat},${currentShop.lng}`;
        window.open(url, "_blank");
    };

    const handleListenOtherShopAudio = (shopId: number) => {
        const shop = otherShops.find((item) => item.id === shopId);
        if (!shop) return;

        void playShopNarration(shop);
        dispatch(setCurrentShop(shop));
    };

    const handlePlayPoiNarration = async (poi: { id: string; name: string; shopId?: number }) => {
        if (!poi.shopId) {
            notifyWarning("POI này chưa liên kết hồ sơ quán nên chưa phát audio được.");
            return;
        }

        setLoadingPoiId(poi.id);
        try {
            const preferredLanguage = resolvePreferredLanguage();
            const narrationRes = await shopService.getShopNarration(poi.shopId, preferredLanguage);
            const narrationAudioUrl = resolveBackendAudioUrl(narrationRes.result?.audioUrl);

            if (!narrationAudioUrl) {
                notifyWarning("Chưa tạo được audio cho quán này. Bạn thử lại sau nhé.");
                return;
            }

            await playAudio({
                id: poi.shopId,
                type: "SHOP",
                url: narrationAudioUrl,
                title: poi.name,
                shopId: poi.shopId,
                trigger: "MANUAL",
                transcript: narrationRes.result?.script,
                transcriptLanguage: narrationRes.result?.language,
            });
        } catch (playError) {
            console.error("Play POI narration failed:", playError);
            notifyError(
                resolveRequestErrorMessage(playError, "Không thể phát audio mô tả quán lúc này. Vui lòng thử lại.")
            );
        } finally {
            setLoadingPoiId((current) => (current === poi.id ? null : current));
        }
    };

    const handleViewOtherShop = (shopId: number) => {
        console.log("Xem quán:", shopId);
    };

    useEffect(() => {
        if (!nearestNearbyPoi) {
            lastNearbyPoiAlertRef.current = null;
            return;
        }

        if (lastNearbyPoiAlertRef.current === nearestNearbyPoi.id) {
            return;
        }

        lastNearbyPoiAlertRef.current = nearestNearbyPoi.id;
        notifyInfo(
            `Bạn đang gần ${nearestNearbyPoi.name} (${formatDistance(nearestNearbyPoi.distanceKm)}). Nhấn "Phát audio" để nghe mô tả.`,
            "POI gần bạn",
            3200
        );
    }, [nearestNearbyPoi]);

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
                            Cửa hàng gần bạn
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
                {nearbyPoiCandidates.length > 0 ? (
                    <div className="mb-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-3 shadow-sm">
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold text-cyan-900">
                                Bạn đang ở gần {nearbyPoiCandidates.length} POI trong bán kính {Math.round(POI_PROXIMITY_ALERT_RADIUS_KM * 1000)}m
                            </h3>
                            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-cyan-700">
                                Gần nhất lên đầu
                            </span>
                        </div>
                        <div className="space-y-2">
                            {nearbyPoiCandidates.map((poi, index) => (
                                <div
                                    key={`nearby-poi-alert-${poi.id}`}
                                    className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 ${
                                        index === 0
                                            ? "border-emerald-200 bg-emerald-50"
                                            : "border-cyan-200 bg-white"
                                    }`}
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-900">
                                            {index === 0 ? "Gần nhất: " : ""}
                                            {poi.name}
                                        </p>
                                        <p className="truncate text-xs text-slate-600">
                                            Cách bạn {formatDistance(poi.distanceKm)}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            void handlePlayPoiNarration(poi);
                                        }}
                                        disabled={loadingPoiId === poi.id || !poi.shopId}
                                        className="shrink-0 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {loadingPoiId === poi.id ? "Đang tải..." : "Phát audio"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}

                {currentShop ? (
                    <>
                        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 px-4 py-3">
                                <h2 className="text-lg font-bold text-slate-900">
                                    Bản đồ cửa hàng gần nhất
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Hiển thị vị trí hiện tại, các POI đã duyệt và đường đi tới cửa hàng gần nhất.
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
                                        <Marker key={`poi-${poi.id}`} icon={getPoiMarkerIcon(poi)} position={[poi.lat, poi.lng]}>
                                            <Popup>
                                                <div className="min-w-[220px]">
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

                                                    <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                                                        Muốn nghe câu chuyện ngắn về quán này không?
                                                    </div>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        Giọng đọc sẽ theo ngôn ngữ bạn đã chọn.
                                                    </p>

                                                    <div className="mt-3 flex gap-2">
                                                        <button
                                                            type="button"
                                                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                            onClick={() => {
                                                                void handlePlayPoiNarration(poi);
                                                            }}
                                                            disabled={loadingPoiId === poi.id || !poi.shopId}
                                                        >
                                                            {loadingPoiId === poi.id
                                                                ? "Đang chuẩn bị audio..."
                                                                : "Có, nghe ngay"}
                                                        </button>
                                                        {poi.shopId ? (
                                                            <a
                                                                href={`/shop/${poi.shopId}`}
                                                                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                                            >
                                                                Xem chi tiết quán
                                                            </a>
                                                        ) : null}
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
                                            {currentShopDisplayDescription}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-sm">
                        Chưa có cửa hàng nào gần bạn. Hệ thống sẽ tự tìm lại sau mỗi 10 giây.
                    </div>
                )}

                <div className="mt-8">
                    <h3 className="mb-4 text-xl font-bold text-slate-900">Các cửa hàng khác</h3>

                    {otherShops.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
                            Chưa có cửa hàng khác trong bán kính 2km
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
