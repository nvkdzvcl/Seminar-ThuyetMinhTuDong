import { useEffect, useMemo, useState } from "react";
import { translationService } from "../services/translationService";
import type { UiLanguageOption } from "../types/language";
import { normalizeLocale } from "../utils/language";

export type LanguageSelectOption = {
    value: string;
    code: string;
    label: string;
    direction: string;
};

const FALLBACK_LANGUAGES: UiLanguageOption[] = [
    { code: "en", displayName: "English", nativeName: "English", direction: "ltr" },
    { code: "vi", displayName: "Vietnamese", nativeName: "Tiếng Việt", direction: "ltr" },
    { code: "ko", displayName: "Korean", nativeName: "한국어", direction: "ltr" },
    { code: "ja", displayName: "Japanese", nativeName: "日本語", direction: "ltr" },
];

function buildLabel(item: UiLanguageOption): string {
    const displayName = (item.displayName || item.code).trim();
    const nativeName = (item.nativeName || "").trim();
    if (!nativeName || nativeName.toLowerCase() === displayName.toLowerCase()) {
        return displayName;
    }
    return `${displayName} - ${nativeName}`;
}

function normalizeLabelKey(label: string): string {
    return label
        .normalize("NFKC")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

export function resolveLanguageOptionValue(
    options: LanguageSelectOption[],
    language?: string | null
): string | null {
    if (options.length === 0) return null;

    const raw = (language || "").trim();
    if (raw) {
        const exact = options.find((option) => option.value.toLowerCase() === raw.toLowerCase());
        if (exact) return exact.value;

        const canonical = normalizeLocale(raw);
        const canonicalExact = options.find(
            (option) => option.value.toLowerCase() === canonical.toLowerCase()
        );
        if (canonicalExact) return canonicalExact.value;

        const base = canonical.split("-")[0].toLowerCase();
        const baseOption =
            options.find((option) => option.value.toLowerCase() === base) ||
            options.find((option) => option.value.toLowerCase().startsWith(`${base}-`));
        if (baseOption) return baseOption.value;
    }

    const english = options.find((option) => option.value.toLowerCase() === "en");
    if (english) return english.value;
    return options[0].value;
}

export function useSupportedLanguages() {
    const [languages, setLanguages] = useState<UiLanguageOption[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let disposed = false;

        const loadLanguages = async () => {
            try {
                setLoading(true);
                const response = await translationService.getSupportedLanguages();
                const items = response.result?.items ?? [];
                if (!disposed) {
                    setLanguages(items.length > 0 ? items : FALLBACK_LANGUAGES);
                }
            } catch {
                if (!disposed) {
                    setLanguages(FALLBACK_LANGUAGES);
                }
            } finally {
                if (!disposed) {
                    setLoading(false);
                }
            }
        };

        void loadLanguages();
        return () => {
            disposed = true;
        };
    }, []);

    const options = useMemo(() => {
        const unique = new Map<string, LanguageSelectOption>();

        languages.forEach((item) => {
            const value = (item.code || "").trim();
            if (!value) return;
            const key = value.toLowerCase();

            if (unique.has(key)) {
                return;
            }

            unique.set(key, {
                value,
                code: value,
                label: buildLabel(item),
                direction: item.direction || "ltr",
            });
        });

        const ordered = Array.from(unique.values());
        ordered.sort((a, b) => {
            const aEnglish = a.code.toLowerCase() === "en" || a.value.toLowerCase().startsWith("en");
            const bEnglish = b.code.toLowerCase() === "en" || b.value.toLowerCase().startsWith("en");
            if (aEnglish && !bEnglish) return -1;
            if (!aEnglish && bEnglish) return 1;
            const byLabel = a.label.localeCompare(b.label, "en", { sensitivity: "base" });
            if (byLabel !== 0) return byLabel;
            const byLength = a.value.length - b.value.length;
            if (byLength !== 0) return byLength;
            return a.value.localeCompare(b.value, "en", { sensitivity: "base" });
        });

        const deduplicatedByLabel = new Map<string, LanguageSelectOption>();
        ordered.forEach((option) => {
            const labelKey = normalizeLabelKey(option.label);
            if (!labelKey) return;
            if (!deduplicatedByLabel.has(labelKey)) {
                deduplicatedByLabel.set(labelKey, option);
            }
        });

        return Array.from(deduplicatedByLabel.values());
    }, [languages]);

    return {
        options,
        loading,
    };
}
