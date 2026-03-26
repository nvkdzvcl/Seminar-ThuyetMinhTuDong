import axiosClient from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type { PoiResponse, PoiStatus } from "../types/poi";

type PoiPagingResult = {
    items: PoiResponse[];
    totalItems: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
};

type PoiListParams = {
    page?: number;
    size?: number;
    search?: string;
    status?: PoiStatus;
    region?: string;
    hasFlag?: boolean;
};

type FetchAllPoisOptions = {
    search?: string;
    status?: PoiStatus;
    region?: string;
    hasFlag?: boolean;
    pageSize?: number;
    maxPages?: number;
};

const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 500;
const DEFAULT_MAX_PAGES = 20;

export const poiService = {
    getPois: async (params: PoiListParams = {}) => {
        const page = params.page ?? 1;
        const size = Math.max(1, Math.min(params.size ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE));
        const res = await axiosClient.get<ApiResponse<PoiPagingResult>>("/poi", {
            params: {
                page,
                size,
                search: params.search,
                status: params.status,
                region: params.region,
                hasFlag: params.hasFlag,
            },
        });

        const result = res.data.result;
        return (
            result ?? {
                items: [],
                totalItems: 0,
                currentPage: page,
                pageSize: size,
                totalPages: 0,
            }
        );
    },

    getAllPois: async (options: FetchAllPoisOptions = {}) => {
        const pageSize = Math.max(1, Math.min(options.pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE));
        const maxPages = Math.max(1, options.maxPages ?? DEFAULT_MAX_PAGES);

        const collected: PoiResponse[] = [];
        let currentPage = 1;
        let totalPages = 1;

        while (currentPage <= totalPages && currentPage <= maxPages) {
            const page = await poiService.getPois({
                page: currentPage,
                size: pageSize,
                search: options.search,
                status: options.status,
                region: options.region,
                hasFlag: options.hasFlag,
            });

            collected.push(...page.items);
            totalPages = page.totalPages || 1;
            currentPage += 1;
        }

        return collected;
    },
};
