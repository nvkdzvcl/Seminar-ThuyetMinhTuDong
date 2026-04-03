import axiosClient from "./axiosClient";
import type { ApiResponse, PagingDto } from "../types/api";
import type { TourPlanCreationRequest, TourPlanResponse, TourPlanStatus } from "../types/tour";

export const tourPlanService = {
    createSuggestedTour: async (payload: TourPlanCreationRequest) => {
        const res = await axiosClient.post<ApiResponse<TourPlanResponse>>(
            "/tour-plan/generate",
            payload
        );
        return res.data;
    },

    getTourPlanById: async (tourPlanId: number) => {
        const res = await axiosClient.get<ApiResponse<TourPlanResponse>>(`/tour-plan/${tourPlanId}`);
        return res.data;
    },

    getTourPlans: async (
        page: number = 1,
        size: number = 10,
        status: TourPlanStatus = "ACTIVE"
    ) => {
        const res = await axiosClient.get<ApiResponse<PagingDto<TourPlanResponse>>>("/tour-plan", {
            params: {
                page,
                size,
                status,
            },
        });
        return res.data;
    },

    deleteTourPlan: async (tourPlanId: number) => {
        const res = await axiosClient.delete<ApiResponse<void>>(`/tour-plan/${tourPlanId}`);
        return res.data;
    },
};