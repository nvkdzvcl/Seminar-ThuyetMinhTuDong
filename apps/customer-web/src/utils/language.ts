const LS_USER = "VINH_KHANH_FOOD_TOUR_USER";
export const CUSTOMER_LANGUAGE_CHANGED_EVENT = "customer-language-changed";

function toCanonicalLocale(value?: string | null): string {
    if (!value || !value.trim()) {
        return "en-US";
    }

    const raw = value.trim();
    try {
        const canonical = Intl.getCanonicalLocales(raw)[0];
        if (!canonical) return "en-US";
        if (!canonical.includes("-")) {
            if (canonical === "en") return "en-US";
            if (canonical === "vi") return "vi-VN";
        }
        return canonical;
    } catch {
        const lower = raw.toLowerCase();
        if (lower === "en") return "en-US";
        if (lower === "vi") return "vi-VN";
        return "en-US";
    }
}

export function getStoredUserLanguage(): string | null {
    try {
        const rawUser = localStorage.getItem(LS_USER);
        if (!rawUser) return null;

        const user = JSON.parse(rawUser) as { language?: string };
        if (!user?.language || !user.language.trim()) return null;
        return toCanonicalLocale(user.language);
    } catch {
        return null;
    }
}

export function resolvePreferredLanguage(explicitLanguage?: string | null): string {
    const userLanguage = getStoredUserLanguage();
    if (userLanguage) {
        return userLanguage;
    }

    if (explicitLanguage && explicitLanguage.trim()) {
        return toCanonicalLocale(explicitLanguage);
    }

    return toCanonicalLocale(navigator.language || "en-US");
}

export function isEnglishLanguage(language?: string | null): boolean {
    return toCanonicalLocale(language).toLowerCase().startsWith("en");
}

export function isVietnameseLanguage(language?: string | null): boolean {
    return toCanonicalLocale(language).toLowerCase().startsWith("vi");
}

export function normalizeLocale(language?: string | null): string {
    return toCanonicalLocale(language);
}

export function notifyLanguageChanged() {
    window.dispatchEvent(new Event(CUSTOMER_LANGUAGE_CHANGED_EVENT));
}
