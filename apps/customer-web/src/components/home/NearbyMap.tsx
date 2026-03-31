import { useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import type { MapPoi } from "../../types/poi";
import { icons } from "../../types/icons";
import { usePoiMapData } from "../../hooks/usePoiMapData";
import { getPoiCategoryLabel, getPoiMarkerIcon, getPoiStatusLabel } from "../../utils/poiMap";
import { shopService } from "../../services/shopService";
import { resolvePreferredLanguage } from "../../utils/language";
import { useAudioPlayer } from "../../stores/useAudioPlayer";
import { notifyError, notifyWarning } from "../../utils/notify";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type NearbyMapProps = {
    currentPosition: [number, number];
};

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
    if (axios.isAxiosError(error)) {
        const responseData = error.response?.data as { message?: string; code?: string } | undefined;
        if (responseData?.message) {
            return responseData.message;
        }
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
}

function NearbyMap({ currentPosition }: NearbyMapProps) {
    const { pois, error } = usePoiMapData();
    const { currentAudio, isAudioPlaying, playAudio } = useAudioPlayer();
    const [loadingPoiId, setLoadingPoiId] = useState<string | null>(null);

    const handlePlayPoiNarration = async (poi: MapPoi) => {
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

    return (
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm w-full">
            <div className="border-b border-slate-100 px-4 py-3">
                <h3 className="text-base font-bold text-slate-900">Bản đồ quán gần đây</h3>
                <p className="text-sm text-slate-500">
                    Vị trí hiện tại và các POI ({pois.length})
                </p>
            </div>

            {error ? (
                <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
                    {error}
                </div>
            ) : null}

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

                    {pois.map((poi) => {
                        const isLoading = loadingPoiId === poi.id;
                        const isPlayingThisPoi =
                            Boolean(poi.shopId) &&
                            isAudioPlaying &&
                            currentAudio?.type === "SHOP" &&
                            currentAudio.id === poi.shopId;

                        return (
                            <Marker
                                key={`poi-${poi.id}`}
                                icon={getPoiMarkerIcon(poi)}
                                position={[poi.lat, poi.lng]}
                            >
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
                                                disabled={isLoading || !poi.shopId}
                                            >
                                                {isLoading
                                                    ? "Đang chuẩn bị audio..."
                                                    : isPlayingThisPoi
                                                        ? "Đang phát audio"
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
                        );
                    })}
                </MapContainer>
            </div>
        </div>
    );
}

export default NearbyMap;
