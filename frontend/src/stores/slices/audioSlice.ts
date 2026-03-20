import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AudioEntityType = "SHOP" | "DISH";
export type AudioTriggerType = "MANUAL" | "REALTIME";

export type AudioPayload = {
    id: number;
    type: AudioEntityType;
    url: string;
    title?: string;
    shopId?: number;
    trigger?: AudioTriggerType;
};

type AudioState = {
    isPlaying: boolean;
    current: AudioPayload | null;
    autoTurnOnNearbyShopAudio: boolean;
};

const AUTO_AUDIO_KEY = "autoTurnOnNearbyShopAudio";

const getStoredAutoAudio = () => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(AUTO_AUDIO_KEY) === "true";
};

const initialState: AudioState = {
    isPlaying: false,
    current: null,
    autoTurnOnNearbyShopAudio: getStoredAutoAudio(),
};

const audioSlice = createSlice({
    name: "audio",
    initialState,
    reducers: {
        setCurrentAudio: (state, action: PayloadAction<AudioPayload | null>) => {
            state.current = action.payload;
        },
        setAudioPlaying: (state, action: PayloadAction<boolean>) => {
            state.isPlaying = action.payload;
        },
        setAutoTurnOnNearbyShopAudio: (state, action: PayloadAction<boolean>) => {
            state.autoTurnOnNearbyShopAudio = action.payload;
            if (typeof window !== "undefined") {
                localStorage.setItem(AUTO_AUDIO_KEY, String(action.payload));
            }
        },
        clearAudioState: (state) => {
            state.isPlaying = false;
            state.current = null;
        },
    },
});

export const {
    setCurrentAudio,
    setAudioPlaying,
    setAutoTurnOnNearbyShopAudio,
    clearAudioState,
} = audioSlice.actions;
export default audioSlice.reducer;
