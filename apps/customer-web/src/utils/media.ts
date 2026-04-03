const ABSOLUTE_URL_PATTERN = /^(https?:)?\/\//i;

export function resolveMediaUrl(
    value: string | null | undefined,
    baseUrl: string | undefined,
    fallback: string
) {
    const normalizedValue = value?.trim();

    if (!normalizedValue) {
        return fallback;
    }

    if (
        ABSOLUTE_URL_PATTERN.test(normalizedValue) ||
        normalizedValue.startsWith("data:") ||
        normalizedValue.startsWith("blob:")
    ) {
        return normalizedValue;
    }

    if (!baseUrl) {
        return normalizedValue;
    }

    return `${baseUrl}${normalizedValue.replace(/^\/+/, "")}`;
}

export function resolveBackendAudioUrl(rawAudioPath?: string | null): string | undefined {
    if (!rawAudioPath) return undefined;
    if (ABSOLUTE_URL_PATTERN.test(rawAudioPath)) return rawAudioPath;

    const base = (import.meta.env.VITE_BACKEND_API || "").replace(/\/+$/, "");
    const normalizedPath = rawAudioPath.startsWith("/") ? rawAudioPath : `/${rawAudioPath}`;

    if (!base) {
        return normalizedPath;
    }

    return `${base}${normalizedPath}`;
}
