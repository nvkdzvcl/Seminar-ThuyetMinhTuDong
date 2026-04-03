import { useEffect, useState } from "react";
import { poiService } from "../services/poiService";
import type { MapPoi } from "../types/poi";
import { toMapPoiFromApi } from "../utils/poiMap";

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
                    status: "PUBLISHED",
                    pageSize: POI_MAP_PAGE_SIZE,
                    maxPages: POI_MAP_MAX_PAGES,
                });

                const apiPois = rawPois
                    .map(toMapPoiFromApi)
                    .filter((item): item is MapPoi => item !== null);

                if (!isDisposed) {
                    setPois(apiPois);
                    setError("");
                }
            } catch (err) {
                if (!isDisposed) {
                    setPois([]);
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Không tải được POI đã duyệt từ server."
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
