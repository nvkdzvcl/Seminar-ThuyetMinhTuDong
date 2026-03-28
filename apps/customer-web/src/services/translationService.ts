import axiosClient from "./axiosClient";
import type { ApiResponse } from "../types/api";

type UiTranslationResponse = {
    targetLanguage: string;
    texts: string[];
    translated: boolean;
};

export const translationService = {
    translateUiTexts: async (texts: string[], targetLanguage: string) => {
        const res = await axiosClient.post<ApiResponse<UiTranslationResponse>>("/translation/ui", {
            texts,
            targetLanguage,
        });
        return res.data;
    },
};
