import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import modalReducer from "./slices/modalSlice";
import shopReducer from "./slices/shopSlice";
import audioReducer from "./slices/audioSlice";
import tourReducer from "./slices/tourSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        modal: modalReducer,
        shop: shopReducer,
        audio: audioReducer,
        tour: tourReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;