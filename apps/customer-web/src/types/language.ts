export type UiLanguageOption = {
    code: string;
    displayName: string;
    nativeName: string;
    direction: "ltr" | "rtl" | string;
};

export type UiLanguageListResponse = {
    items: UiLanguageOption[];
    total: number;
};

