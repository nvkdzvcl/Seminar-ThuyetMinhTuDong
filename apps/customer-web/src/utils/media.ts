const ABSOLUTE_URL_PATTERN = /^(https?:)?\/\//i;
const BACKEND_API_BASE = import.meta.env.VITE_BACKEND_API ?? "";
const BACKEND_ORIGIN = (() => {
    try {
        return BACKEND_API_BASE ? new URL(BACKEND_API_BASE).origin : "";
    } catch {
        return "";
    }
})();

function trimTrailingSlash(value: string) {
    return value.replace(/\/+$/, "");
}

function trimLeadingSlash(value: string) {
    return value.replace(/^\/+/, "");
}

function trimSlashes(value: string) {
    return value.replace(/^\/+|\/+$/g, "");
}

export function resolveMediaUrl(
    value: string | null | undefined,
    baseUrl: string | undefined,
    fallback: string,
    defaultUploadDirectory?: string
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

    const normalizedBaseUrl = baseUrl?.trim() || "";
    const resolvedBase =
        normalizedBaseUrl ||
        (BACKEND_API_BASE && defaultUploadDirectory
            ? `${trimTrailingSlash(BACKEND_API_BASE)}/${trimSlashes(defaultUploadDirectory)}/`
            : "");

    if (normalizedValue.startsWith("/uploads/")) {
        if (BACKEND_API_BASE) {
            return `${trimTrailingSlash(BACKEND_API_BASE)}${normalizedValue}`;
        }
        if (resolvedBase) {
            return `${trimTrailingSlash(resolvedBase)}/${trimLeadingSlash(normalizedValue)}`;
        }
        return normalizedValue;
    }

    if (normalizedValue.startsWith("uploads/")) {
        if (BACKEND_API_BASE) {
            return `${trimTrailingSlash(BACKEND_API_BASE)}/${normalizedValue}`;
        }
        if (resolvedBase) {
            return `${trimTrailingSlash(resolvedBase)}/${normalizedValue}`;
        }
        return normalizedValue;
    }

    if (normalizedValue.startsWith("/")) {
        if (BACKEND_ORIGIN) {
            return `${BACKEND_ORIGIN}${normalizedValue}`;
        }
        return normalizedValue;
    }

    if (resolvedBase) {
        const safeValue = normalizedValue.includes("/")
            ? normalizedValue
            : encodeURIComponent(normalizedValue);
        return `${trimTrailingSlash(resolvedBase)}/${trimLeadingSlash(safeValue)}`;
    }

    if (BACKEND_API_BASE && defaultUploadDirectory) {
        return `${trimTrailingSlash(BACKEND_API_BASE)}/${trimSlashes(defaultUploadDirectory)}/${encodeURIComponent(normalizedValue)}`;
    }

    return normalizedValue;
}
