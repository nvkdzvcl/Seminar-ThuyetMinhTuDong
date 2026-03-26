import type { PoiCategoryKey } from "../types/poi";

export type ManualPoiSeed = {
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    category: PoiCategoryKey;
};

export const MANUAL_POI_SEEDS: ManualPoiSeed[] = [
    {
        id: "manual-oc-phat",
        name: "Ốc Phát",
        category: "hai_san",
        lat: 10.761966321575366,
        lng: 106.70210447161362,
        address: "361 Đ. Vĩnh Khánh, Phường 8, Khánh Hội, Hồ Chí Minh, Việt Nam",
    },
    {
        id: "manual-sinzien",
        name: "SINZIEN",
        category: "giai_khat",
        lat: 10.761758419761245,
        lng: 106.70231135744615,
        address: "375 Đ. Vĩnh Khánh, Phường 8, Khánh Hội, Hồ Chí Minh, Việt Nam",
    },
    {
        id: "manual-com-ga",
        name: "Cơm gà",
        category: "com",
        lat: 10.761494716346569,
        lng: 106.70223604682491,
        address: "400 Đ. Vĩnh Khánh, Phường 8, Khánh Hội, Hồ Chí Minh, Việt Nam",
    },
    {
        id: "manual-nuong-ngoi-ti-ti",
        name: "Nướng Ngói Ti Ti",
        category: "do_nuong",
        lat: 10.761583648826518,
        lng: 106.70257802845525,
        address: "57 Đ. Vĩnh Khánh, Phường 8, Khánh Hội, Hồ Chí Minh, Việt Nam",
    },
    {
        id: "manual-toan-phuong-quan",
        name: "Toàn Phương Quán",
        category: "lau",
        lat: 10.761375480903604,
        lng: 106.70253913643711,
        address: "129F/95/89 Đ. Vĩnh Khánh, Phường 8, Khánh Hội, Hồ Chí Minh, Việt Nam",
    },
    {
        id: "manual-lau-nuong-thuan-viet",
        name: "Lẩu Nướng Thuận Việt",
        category: "lau",
        lat: 10.76094860445864,
        lng: 106.70306954326443,
        address: "424 Đ. Vĩnh Khánh, Phường 8, Khánh Hội, Hồ Chí Minh, Việt Nam",
    },
];
