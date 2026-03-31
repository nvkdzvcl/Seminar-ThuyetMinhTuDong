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
    transcript?: string;
    transcriptLanguage?: string;
};

export type AudioProgressPayload = {
    progress: number;
    currentTimeSec: number;
    durationSec: number;
};

type AudioState = {
    isPlaying: boolean;
    current: AudioPayload | null;
    progress: AudioProgressPayload;
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
    progress: {
        progress: 0,
        currentTimeSec: 0,
        durationSec: 0,
    },
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
        setAudioProgress: (state, action: PayloadAction<AudioProgressPayload>) => {
            state.progress = action.payload;
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
            state.progress = {
                progress: 0,
                currentTimeSec: 0,
                durationSec: 0,
            };
        },
    },
});

export const {
    setCurrentAudio,
    setAudioPlaying,
    setAudioProgress,
    setAutoTurnOnNearbyShopAudio,
    clearAudioState,
} = audioSlice.actions;
export default audioSlice.reducer;
