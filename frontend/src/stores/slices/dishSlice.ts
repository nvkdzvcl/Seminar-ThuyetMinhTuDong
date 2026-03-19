/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { dishService } from "../../services/dishService";
import type { Dish } from "../../types/dish";

type DishState = {
    dishes: Dish[];
    currentDish: Dish | null;
    loading: boolean;
    error: string | null;
};

const initialState: DishState = {
    dishes: [],
    currentDish: null,
    loading: false,
    error: null,
};

export const fetchDishById = createAsyncThunk<Dish, number, { rejectValue: string }>(
    "dish/fetchDishById",
    async (dishId, { rejectWithValue }) => {
        try {
            const res = await dishService.getDishById(dishId);
            if (!res.result) {
                return rejectWithValue("Invalid response format");
            }
            return res.result;
        } catch (err: any) {
            return rejectWithValue(
                err?.response?.data?.message ?? err?.message ?? "Get dish failed"
            );
        }
    }
);

export const searchDishes = createAsyncThunk<
    Dish[],
    {
        name: string;
        status?: string;
        page?: number;
        size?: number;
    },
    { rejectValue: string }
>("dish/searchDishes", async ({ name, status, page, size }, { rejectWithValue }) => {
    try {
        const res = await dishService.searchDishes(name, status, page, size);
        if (!res.result) {
            return rejectWithValue("Invalid response format");
        }
        return res.result.items;
    } catch (err: any) {
        return rejectWithValue(
            err?.response?.data?.message ?? err?.message ?? "Search dishes failed"
        );
    }
});

export const getByIsSignatureDish = createAsyncThunk<
    Dish[],
    {
        isSignatureDish: boolean;
        status?: string;
        page?: number;
        size?: number;
    },
    { rejectValue: string }
>(
    "dish/getByIsSignatureDish",
    async ({ isSignatureDish, status, page, size }, { rejectWithValue }) => {
        try {
            const res = await dishService.getByIsSignatureDish(isSignatureDish, status, page, size);
            if (!res.result) {
                return rejectWithValue("Invalid response format");
            }
            return res.result.items;
        } catch (err: any) {
            return rejectWithValue(
                err?.response?.data?.message ?? err?.message ?? "Get signature dishes failed"
            );
        }
    }
);

const dishSlice = createSlice({
    name: "dish",
    initialState,
    reducers: {
        clearDishError: (state) => {
            state.error = null;
        },
        clearDishes: (state) => {
            state.dishes = [];
        },
        clearCurrentDish: (state) => {
            state.currentDish = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDishById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDishById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentDish = action.payload;
            })
            .addCase(fetchDishById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload ?? "Get dish failed";
            })

            .addCase(searchDishes.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(searchDishes.fulfilled, (state, action) => {
                state.loading = false;
                state.dishes = action.payload;
            })
            .addCase(searchDishes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload ?? "Search dishes failed";
            })

            .addCase(getByIsSignatureDish.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getByIsSignatureDish.fulfilled, (state, action) => {
                state.loading = false;
                state.dishes = action.payload;
            })
            .addCase(getByIsSignatureDish.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload ?? "Get signature dishes failed";
            });
    },
});

export const { clearDishError, clearDishes, clearCurrentDish } = dishSlice.actions;
export default dishSlice.reducer;
