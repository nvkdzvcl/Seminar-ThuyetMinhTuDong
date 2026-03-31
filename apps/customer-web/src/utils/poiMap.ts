import L from "leaflet";
import type { ManualPoiSeed } from "../data/manualPoiSeeds";
import type { MapPoi, PoiCategoryKey, PoiResponse, PoiStatus } from "../types/poi";

const MAP_MARKER_SIZE = 30;
const MARKER_HALF_SIZE = Math.round(MAP_MARKER_SIZE / 2);
const PUBLIC_BASE_URL = import.meta.env.BASE_URL || "/";

type PoiCategoryMeta = {
    label: string;
    color: string;
    emoji: string;
    keywords: string[];
    iconUrl: string;
};

type PoiStatusMeta = {
    label: string;
    color: string;
    emoji: string;
};

export const POI_CATEGORY_META: Record<PoiCategoryKey, PoiCategoryMeta> = {
    hai_san: {
        label: "Hải sản",
        color: "#0ea5e9",
        emoji: "🦐",
        keywords: ["hai san", "seafood", "oc", "muc", "cua", "ca", "tom"],
        iconUrl: "/images/poi-categories/seafood.png",
    },
    lau: {
        label: "Lẩu",
        color: "#f59e0b",
        emoji: "🍲",
        keywords: ["lau", "hot pot", "hotpot", "bo lau"],
        iconUrl: "/images/poi-categories/hot-pot.png",
    },
    do_nuong: {
        label: "Đồ nướng",
        color: "#ef4444",
        emoji: "🔥",
        keywords: ["do nuong", "nuong", "bbq", "grill"],
        iconUrl: "/images/poi-categories/bacon.png",
    },
    com: {
        label: "Cơm",
        color: "#f97316",
        emoji: "🍛",
        keywords: ["com", "rice"],
        iconUrl: "/images/poi-categories/rice.png",
    },
    pho: {
        label: "Phở",
        color: "#8b5cf6",
        emoji: "🍜",
        keywords: ["noodle", "bun", "pho", "mi", "hu tieu"],
        iconUrl: "/images/poi-categories/noodles.png",
    },
    giai_khat: {
        label: "Giải khát",
        color: "#2563eb",
        emoji: "🥤",
        keywords: ["giai khat", "beverage", "drink", "coffee", "ca phe", "tra sua", "sinzien"],
        iconUrl: "/images/poi-categories/tea.png",
    },
};

const POI_CATEGORY_KEYS = Object.keys(POI_CATEGORY_META) as PoiCategoryKey[];

const POI_STATUS_META: Record<PoiStatus, PoiStatusMeta> = {
    DRAFT: {
        label: "Chờ duyệt",
        color: "#d97706",
        emoji: "⏳",
    },
    PUBLISHED: {
        label: "Đã duyệt",
        color: "#059669",
        emoji: "✔",
    },
    FLAGGED: {
        label: "Từ chối",
        color: "#dc2626",
        emoji: "!",
    },
    HIDDEN: {
        label: "Đã ẩn",
        color: "#475569",
        emoji: "•",
    },
};

const categoryIconCache = new Map<PoiCategoryKey, L.Icon>();
const statusIconCache = new Map<PoiStatus, L.DivIcon>();

function resolvePublicAssetPath(path: string): string {
    const base = PUBLIC_BASE_URL.endsWith("/") ? PUBLIC_BASE_URL : `${PUBLIC_BASE_URL}/`;
    const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
    return `${base}${normalizedPath}`;
}

function normalizeForMatching(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

function isValidCoordinate(value: unknown, min: number, max: number): value is number {
    return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function buildPoiIdentityKey(poi: Pick<MapPoi, "name" | "lat" | "lng">): string {
    return `${normalizeForMatching(poi.name)}|${poi.lat.toFixed(6)}|${poi.lng.toFixed(6)}`;
}

function buildCategoryIcon(category: PoiCategoryKey): L.Icon {
    const iconUrl = resolvePublicAssetPath(POI_CATEGORY_META[category].iconUrl);
    return L.icon({
        iconUrl,
        iconSize: [MAP_MARKER_SIZE, MAP_MARKER_SIZE],
        iconAnchor: [MARKER_HALF_SIZE, MARKER_HALF_SIZE],
        popupAnchor: [0, -Math.round(MAP_MARKER_SIZE * 0.45)],
        className: "customer-poi-marker",
    });
}

function buildStatusIcon(status: PoiStatus): L.DivIcon {
    const meta = POI_STATUS_META[status];
    return L.divIcon({
        className: "customer-poi-status-marker-wrapper",
        html: `<div class="customer-poi-status-marker" style="--marker-color:${meta.color};"><span>${meta.emoji}</span></div>`,
        iconSize: [MAP_MARKER_SIZE, MAP_MARKER_SIZE],
        iconAnchor: [MARKER_HALF_SIZE, MARKER_HALF_SIZE],
        popupAnchor: [0, -Math.round(MAP_MARKER_SIZE * 0.45)],
    });
}

export function resolvePoiCategoryKey(
    ...candidates: Array<string | null | undefined>
): PoiCategoryKey | null {
    const normalizedCandidates = candidates
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .map((value) => normalizeForMatching(value));

    if (!normalizedCandidates.length) {
        return null;
    }

    for (const category of POI_CATEGORY_KEYS) {
        const keywords = POI_CATEGORY_META[category].keywords;
        const hasMatch = normalizedCandidates.some((candidate) =>
            keywords.some((keyword) => candidate.includes(keyword))
        );

        if (hasMatch) {
            return category;
        }
    }

    return null;
}

export function getPoiCategoryLabel(categoryKey: PoiCategoryKey | null): string {
    if (!categoryKey) {
        return "Chưa phân loại";
    }
    return POI_CATEGORY_META[categoryKey].label;
}

export function getPoiStatusLabel(status: PoiStatus): string {
    return POI_STATUS_META[status].label;
}

export function getPoiMarkerIcon(poi: Pick<MapPoi, "categoryKey" | "status">): L.Icon | L.DivIcon {
    if (poi.categoryKey) {
        const cached = categoryIconCache.get(poi.categoryKey);
        if (cached) {
            return cached;
        }

        const created = buildCategoryIcon(poi.categoryKey);
        categoryIconCache.set(poi.categoryKey, created);
        return created;
    }

    const statusCached = statusIconCache.get(poi.status);
    if (statusCached) {
        return statusCached;
    }

    const created = buildStatusIcon(poi.status);
    statusIconCache.set(poi.status, created);
    return created;
}

export function toMapPoiFromApi(poi: PoiResponse): MapPoi | null {
    if (!isValidCoordinate(poi.lat, -90, 90) || !isValidCoordinate(poi.lng, -180, 180)) {
        return null;
    }

    return {
        id: String(poi.id),
        shopId: poi.shopId,
        name: poi.name,
        address: poi.address ?? undefined,
        description: poi.description ?? undefined,
        lat: poi.lat,
        lng: poi.lng,
        category: poi.category ?? undefined,
        categoryKey: resolvePoiCategoryKey(poi.category, poi.name, poi.description),
        status: poi.status,
        source: "api",
    };
}

export function toMapPoiFromManual(seed: ManualPoiSeed): MapPoi {
    return {
        id: seed.id,
        shopId: seed.shopId,
        name: seed.name,
        address: seed.address,
        lat: seed.lat,
        lng: seed.lng,
        category: seed.category,
        categoryKey: seed.category,
        status: "PUBLISHED",
        source: "manual",
    };
}

export function mergeMapPois(apiPois: MapPoi[], manualPois: MapPoi[]): MapPoi[] {
    const byIdentity = new Map<string, MapPoi>();

    for (const poi of apiPois) {
        byIdentity.set(buildPoiIdentityKey(poi), poi);
    }

    for (const poi of manualPois) {
        const key = buildPoiIdentityKey(poi);
        if (!byIdentity.has(key)) {
            byIdentity.set(key, poi);
        }
    }

    return Array.from(byIdentity.values());
}
