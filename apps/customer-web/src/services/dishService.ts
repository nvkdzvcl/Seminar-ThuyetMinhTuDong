import axiosClient from "./axiosClient";
import type { ApiResponse, PagingDto } from "../types/api";
import type { Dish, DishCreationRequest, DishUpdateRequest } from "../types/dish";

export const dishService = {
    createDish: async (payload: DishCreationRequest) => {
        const res = await axiosClient.post<ApiResponse<Dish>>("/dish/create", payload);
        return res.data;
    },

    updateDish: async (dishId: number, payload: DishUpdateRequest) => {
        const res = await axiosClient.patch<ApiResponse<Dish>>(`/dish/${dishId}`, payload);
        return res.data;
    },

    deleteDish: async (dishId: number) => {
        const res = await axiosClient.delete<ApiResponse<void>>(`/dish/${dishId}`);
        return res.data;
    },

    uploadImage: async (dishId: number, file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        const res = await axiosClient.post<ApiResponse<string>>(`/dish/${dishId}/image`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return res.data;
    },

    getDishById: async (dishId: number) => {
        const res = await axiosClient.get<ApiResponse<Dish>>(`/dish/${dishId}`);
        return res.data;
    },

    searchDishes: async (
        name: string,
        status: string = "ACTIVE",
        page: number = 1,
        size: number = 10
    ) => {
        const res = await axiosClient.get<ApiResponse<PagingDto<Dish>>>(`/dish/${name}/search`, {
            params: {
                status,
                page,
                size,
            },
        });

        return res.data;
    },

    getByIsSignatureDish: async (
        isSignatureDish: boolean,
        status: string = "ACTIVE",
        page: number = 1,
        size: number = 10
    ) => {
        const res = await axiosClient.get<ApiResponse<PagingDto<Dish>>>("/dish", {
            params: {
                isSignatureDish,
                status,
                page,
                size,
            },
        });

        return res.data;
    },

    getByShopId: async (
        shopId: number,
        status: string = "ACTIVE",
        page: number = 1,
        size: number = 10
    ) => {
        const res = await axiosClient.get<ApiResponse<PagingDto<Dish>>>(`/dish/shop/${shopId}`, {
            params: {
                status,
                page,
                size,
            },
        });

        return res.data;
    },
};
