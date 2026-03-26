export type PoiStatus = "DRAFT" | "PUBLISHED" | "FLAGGED" | "HIDDEN";

export type PoiCategoryKey =
    | "hai_san"
    | "lau"
    | "do_nuong"
    | "com"
    | "pho"
    | "giai_khat";

export type PoiSource = "api" | "manual";

export type PoiResponse = {
    id: number;
    shopId?: number;
    name: string;
    description?: string;
    address?: string;
    lat?: number;
    lng?: number;
    region?: string;
    category?: string;
    ownerId?: number;
    ownerName?: string;
    coverImage?: string;
    qrCode?: string;
    riskFlag: boolean;
    riskScore?: number;
    rejectionReason?: string;
    status: PoiStatus;
    createdAt: string;
    updatedAt: string;
};

export type MapPoi = {
    id: string;
    name: string;
    address?: string;
    description?: string;
    lat: number;
    lng: number;
    category?: string;
    categoryKey: PoiCategoryKey | null;
    status: PoiStatus;
    source: PoiSource;
};
