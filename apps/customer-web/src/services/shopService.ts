import axiosClient from "./axiosClient";
import type { ShopCreationRequest, ShopNarrationResponse, ShopResponse } from "../types/shop";
import type { ApiResponse, PagingDto } from "../types/api";

export const shopService = {
    getShops: async (page: number = 1, size: number = 10, status?: string) => {
        const res = await axiosClient.get<ApiResponse<PagingDto<ShopResponse>>>("/shop", {
            params: {
                page,
                size,
                status,
            },
        });
        return res.data;
    },

    getShopById: async (shopId: number) => {
        const res = await axiosClient.get<ApiResponse<ShopResponse>>(`/shop/${shopId}`);
        return res.data;
    },

    getShopNarration: async (shopId: number, lang?: string) => {
        const res = await axiosClient.get<ApiResponse<ShopNarrationResponse>>(`/shop/${shopId}/narration`, {
            params: {
                lang,
            },
        });
        return res.data;
    },

    createShop: async (payload: ShopCreationRequest) => {
        const res = await axiosClient.post<ApiResponse<ShopResponse>>("/shop/create", payload);
        return res.data;
    },

    updateShop: async (shopId: number, payload: Partial<ShopCreationRequest>) => {
        const res = await axiosClient.patch<ApiResponse<ShopResponse>>(`/shop/${shopId}`, payload);
        return res.data;
    },

    deleteShop: async (shopId: number) => {
        const res = await axiosClient.delete<ApiResponse<void>>(`/shop/${shopId}`);
        return res.data;
    },

    uploadImage: async (shopId: number, file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        const res = await axiosClient.post<ApiResponse<string>>(
            `/shop/${shopId}/upload-image`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        return res.data;
    },

    uploadAudio: async (shopId: number, file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        const res = await axiosClient.post<ApiResponse<string>>(
            `/shop/${shopId}/upload-audio`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        return res.data;
    },

    searchShops: async (name: string, status?: string, page: number = 1, size: number = 10) => {
        const res = await axiosClient.get<ApiResponse<PagingDto<ShopResponse>>>("/shop/search", {
            params: {
                name,
                status,
                page,
                size,
            },
        });

        return res.data;
    },

    getNearbyShops: async (
        latitude: number,
        longitude: number,
        radius: number = 2,
        page: number = 1,
        size: number = 10
    ) => {
        const res = await axiosClient.get<ApiResponse<PagingDto<ShopResponse>>>("/shop/nearby", {
            params: {
                latitude,
                longitude,
                radius,
                page,
                size,
            },
        });

        return res.data;
    },
};
