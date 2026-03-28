import axiosClient from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type { UiLanguageListResponse } from "../types/language";

type UiTranslationResponse = {
    targetLanguage: string;
    texts: string[];
    translated: boolean;
};

export const translationService = {
    getSupportedLanguages: async () => {
        const res = await axiosClient.get<ApiResponse<UiLanguageListResponse>>("/translation/languages");
        return res.data;
    },

    translateUiTexts: async (texts: string[], targetLanguage: string) => {
        const res = await axiosClient.post<ApiResponse<UiTranslationResponse>>("/translation/ui", {
            texts,
            targetLanguage,
        });
        return res.data;
    },
};
