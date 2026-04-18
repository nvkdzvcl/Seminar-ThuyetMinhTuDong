/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { tourPlanService } from "../../services/tourPlanService";
import type { PagingDto } from "../../types/api";
import type {
    TourPlanCreationRequest,
    TourPlanResponse,
    TourPlanStatus,
} from "../../types/tour";

type TourState = {
    suggestedTour: TourPlanResponse | null;
    currentTour: TourPlanResponse | null;
    historyTours: TourPlanResponse[];
    pagination: {
        currentPage: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
    };
    creating: boolean;
    loadingList: boolean;
    loadingDetail: boolean;
    deleting: boolean;
    error: string | null;
};

const initialState: TourState = {
    suggestedTour: null,
    currentTour: null,
    historyTours: [],
    pagination: {
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
    },
    creating: false,
    loadingList: false,
    loadingDetail: false,
    deleting: false,
    error: null,
};

export const createSuggestedTourThunk = createAsyncThunk<
    TourPlanResponse,
    TourPlanCreationRequest,
    { rejectValue: string }
>("tour/createSuggestedTour", async (payload, { rejectWithValue }) => {
    try {
        const res = await tourPlanService.createSuggestedTour(payload);
        if (!res.result) {
            return rejectWithValue("Không tạo được tour");
        }
        return res.result;
    } catch (err: any) {
        return rejectWithValue(
            err?.response?.data?.message ?? err?.message ?? "Không tạo được tour"
        );
    }
});

export const fetchTourPlansThunk = createAsyncThunk<
    PagingDto<TourPlanResponse>,
    {
        page?: number;
        size?: number;
        status?: TourPlanStatus;
    },
    { rejectValue: string }
>("tour/fetchTourPlans", async ({ page = 1, size = 10, status = "ACTIVE" }, { rejectWithValue }) => {
    try {
        const res = await tourPlanService.getTourPlans(page, size, status);
        if (!res.result) {
            return rejectWithValue("Không tải được danh sách tour");
        }
        return res.result;
    } catch (err: any) {
        return rejectWithValue(
            err?.response?.data?.message ?? err?.message ?? "Không tải được danh sách tour"
        );
    }
});

export const fetchTourPlanByIdThunk = createAsyncThunk<
    TourPlanResponse,
    number,
    { rejectValue: string }
>("tour/fetchTourPlanById", async (tourPlanId, { rejectWithValue }) => {
    try {
        const res = await tourPlanService.getTourPlanById(tourPlanId);
        if (!res.result) {
            return rejectWithValue("Không tải được chi tiết tour");
        }
        return res.result;
    } catch (err: any) {
        return rejectWithValue(
            err?.response?.data?.message ?? err?.message ?? "Không tải được chi tiết tour"
        );
    }
});

export const deleteTourPlanThunk = createAsyncThunk<
    number,
    number,
    { rejectValue: string }
>("tour/deleteTourPlan", async (tourPlanId, { rejectWithValue }) => {
    try {
        await tourPlanService.deleteTourPlan(tourPlanId);
        return tourPlanId;
    } catch (err: any) {
        return rejectWithValue(
            err?.response?.data?.message ?? err?.message ?? "Không xóa được tour"
        );
    }
});

const tourSlice = createSlice({
    name: "tour",
    initialState,
    reducers: {
        clearTourError: (state) => {
            state.error = null;
        },
        clearSuggestedTour: (state) => {
            state.suggestedTour = null;
        },
        clearCurrentTour: (state) => {
            state.currentTour = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createSuggestedTourThunk.pending, (state) => {
                state.creating = true;
                state.error = null;
            })
            .addCase(createSuggestedTourThunk.fulfilled, (state, action) => {
                state.creating = false;
                state.suggestedTour = action.payload;
            })
            .addCase(createSuggestedTourThunk.rejected, (state, action) => {
                state.creating = false;
                state.error = action.payload ?? "Không tạo được tour";
            })

            .addCase(fetchTourPlansThunk.pending, (state) => {
                state.loadingList = true;
                state.error = null;
            })
            .addCase(fetchTourPlansThunk.fulfilled, (state, action) => {
                state.loadingList = false;
                state.historyTours = action.payload.items;
                state.pagination = {
                    currentPage: action.payload.currentPage,
                    pageSize: action.payload.pageSize,
                    totalItems: action.payload.totalItems,
                    totalPages: action.payload.totalPages,
                };
            })
            .addCase(fetchTourPlansThunk.rejected, (state, action) => {
                state.loadingList = false;
                state.error = action.payload ?? "Không tải được danh sách tour";
            })

            .addCase(fetchTourPlanByIdThunk.pending, (state) => {
                state.loadingDetail = true;
                state.error = null;
            })
            .addCase(fetchTourPlanByIdThunk.fulfilled, (state, action) => {
                state.loadingDetail = false;
                state.currentTour = action.payload;
            })
            .addCase(fetchTourPlanByIdThunk.rejected, (state, action) => {
                state.loadingDetail = false;
                state.error = action.payload ?? "Không tải được chi tiết tour";
            })

            .addCase(deleteTourPlanThunk.pending, (state) => {
                state.deleting = true;
                state.error = null;
            })
            .addCase(deleteTourPlanThunk.fulfilled, (state, action) => {
                state.deleting = false;
                state.historyTours = state.historyTours.filter((tour) => tour.id !== action.payload);

                if (state.suggestedTour?.id === action.payload) {
                    state.suggestedTour = null;
                }

                if (state.currentTour?.id === action.payload) {
                    state.currentTour = null;
                }
            })
            .addCase(deleteTourPlanThunk.rejected, (state, action) => {
                state.deleting = false;
                state.error = action.payload ?? "Không xóa được tour";
            });
    },
});

export const { clearTourError, clearSuggestedTour, clearCurrentTour } = tourSlice.actions;
export default tourSlice.reducer;