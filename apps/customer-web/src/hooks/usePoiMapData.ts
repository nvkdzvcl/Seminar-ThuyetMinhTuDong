import { useEffect, useState } from "react";
import { MANUAL_POI_SEEDS } from "../data/manualPoiSeeds";
import { poiService } from "../services/poiService";
import type { MapPoi } from "../types/poi";
import { mergeMapPois, toMapPoiFromApi, toMapPoiFromManual } from "../utils/poiMap";

const POI_MAP_PAGE_SIZE = 100;
const POI_MAP_MAX_PAGES = 50;

export function usePoiMapData() {
    const [pois, setPois] = useState<MapPoi[]>([]);
    const [error, setError] = useState("");

    useEffect(() => {
        let isDisposed = false;

        const loadPois = async () => {
            try {
                const rawPois = await poiService.getAllPois({
                    pageSize: POI_MAP_PAGE_SIZE,
                    maxPages: POI_MAP_MAX_PAGES,
                });

                const apiPois = rawPois
                    .map(toMapPoiFromApi)
                    .filter((item): item is MapPoi => item !== null);
                const manualPois = MANUAL_POI_SEEDS.map(toMapPoiFromManual);

                if (!isDisposed) {
                    setPois(mergeMapPois(apiPois, manualPois));
                    setError("");
                }
            } catch (err) {
                if (!isDisposed) {
                    setPois(MANUAL_POI_SEEDS.map(toMapPoiFromManual));
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Không tải được POI từ server, đang hiển thị dữ liệu nhập tay."
                    );
                }
            }
        };

        void loadPois();

        return () => {
            isDisposed = true;
        };
    }, []);

    return {
        pois,
        error,
    };
}
