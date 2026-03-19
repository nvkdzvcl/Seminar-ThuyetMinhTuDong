/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { shopService } from "../../services/shopService";
import type { ShopResponse } from "../../types/shop";

const AUTO_AUDIO_KEY = "autoTurnOnAudio";

const getStoredAutoAudio = () => {
    return localStorage.getItem(AUTO_AUDIO_KEY) === "true";
};

type ShopState = {
    shops: ShopResponse[];
    currentShop: ShopResponse | null;
    loading: boolean;
    error: string | null;
    autoTurnOnAudio: boolean;
    isAudioPlaying: boolean;
    currentAudioShopId: number | null;
};

const initialState: ShopState = {
    shops: [],
    currentShop: null,
    loading: false,
    error: null,
    autoTurnOnAudio: getStoredAutoAudio(),
    isAudioPlaying: false,
    currentAudioShopId: null,
};

export const fetchShops = createAsyncThunk<
    ShopResponse[],
    {
        page?: number;
        size?: number;
        status?: string;
    } | void,
    { rejectValue: string }
>("shop/fetchShops", async (params, { rejectWithValue }) => {
    try {
        const res = await shopService.getShops(
            params?.page ?? 1,
            params?.size ?? 10,
            params?.status
        );
        return res.result?.items ?? [];
    } catch (err: any) {
        return rejectWithValue(err?.response?.data?.message ?? err?.message ?? "Get shops failed");
    }
});

export const fetchShopById = createAsyncThunk<ShopResponse, number, { rejectValue: string }>(
    "shop/fetchShopById",
    async (shopId, { rejectWithValue }) => {
        try {
            const res = await shopService.getShopById(shopId);
            if (!res.result) {
                return rejectWithValue("Invalid response format");
            }
            return res.result;
        } catch (err: any) {
            return rejectWithValue(
                err?.response?.data?.message ?? err?.message ?? "Get shop failed"
            );
        }
    }
);

export const searchShops = createAsyncThunk<
    ShopResponse[],
    {
        name: string;
        status?: string;
        page?: number;
        size?: number;
    },
    { rejectValue: string }
>("shop/searchShops", async ({ name, status, page, size }, { rejectWithValue }) => {
    try {
        const res = await shopService.searchShops(name, status, page, size);
        return res.result?.items ?? [];
    } catch (err: any) {
        return rejectWithValue(
            err?.response?.data?.message ?? err?.message ?? "Search shops failed"
        );
    }
});

export const getNearbyShops = createAsyncThunk<
    ShopResponse[],
    {
        latitude: number;
        longitude: number;
        radius?: number;
        page?: number;
        size?: number;
    },
    { rejectValue: string }
>(
    "shop/getNearbyShops",
    async ({ latitude, longitude, radius, page, size }, { rejectWithValue }) => {
        try {
            const res = await shopService.getNearbyShops(latitude, longitude, radius, page, size);
            return res.result?.items ?? [];
        } catch (err: any) {
            return rejectWithValue(
                err?.response?.data?.message ?? err?.message ?? "Get nearby shops failed"
            );
        }
    }
);

const shopSlice = createSlice({
    name: "shop",
    initialState,
    reducers: {
        clearShopError: (state) => {
            state.error = null;
        },
        clearCurrentShop: (state) => {
            state.currentShop = null;
        },
        setNearbyShops: (state, action: PayloadAction<ShopResponse[]>) => {
            state.shops = action.payload;
        },
        setCurrentShop: (state, action: PayloadAction<ShopResponse | null>) => {
            state.currentShop = action.payload;
        },
        setAudioPlaying: (state, action: PayloadAction<boolean>) => {
            state.isAudioPlaying = action.payload;
        },
        setCurrentAudioShopId: (state, action: PayloadAction<number | null>) => {
            state.currentAudioShopId = action.payload;
        },
        setAutoTurnOnAudio: (state, action: PayloadAction<boolean>) => {
            state.autoTurnOnAudio = action.payload;
            localStorage.setItem(AUTO_AUDIO_KEY, String(action.payload));
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchShops.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchShops.fulfilled, (state, action) => {
                state.loading = false;
                state.shops = action.payload;
            })
            .addCase(fetchShops.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload ?? "Get shops failed";
            })

            .addCase(fetchShopById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchShopById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentShop = action.payload;
            })
            .addCase(fetchShopById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload ?? "Get shop failed";
            })

            .addCase(searchShops.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(searchShops.fulfilled, (state, action) => {
                state.loading = false;
                state.shops = action.payload;
            })
            .addCase(searchShops.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload ?? "Search shops failed";
            })

            .addCase(getNearbyShops.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getNearbyShops.fulfilled, (state, action) => {
                state.loading = false;
                state.shops = action.payload;
            })
            .addCase(getNearbyShops.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload ?? "Get nearby shops failed";
            });
    },
});

export const {
    clearShopError,
    clearCurrentShop,
    setNearbyShops,
    setCurrentShop,
    setAudioPlaying,
    setCurrentAudioShopId,
    setAutoTurnOnAudio,
} = shopSlice.actions;

export default shopSlice.reducer;
