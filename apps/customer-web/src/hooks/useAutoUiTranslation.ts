import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { translationService } from "../services/translationService";
import {
    CUSTOMER_LANGUAGE_CHANGED_EVENT,
    getStoredUserLanguage,
    isVietnameseLanguage,
    normalizeLocale,
} from "../utils/language";

const textNodeSourceMap = new WeakMap<Text, string>();
const textNodeLastAppliedMap = new WeakMap<Text, string>();
const elementAttrSourceMap = new WeakMap<Element, Map<string, string>>();
const elementAttrLastAppliedMap = new WeakMap<Element, Map<string, string>>();
const translationCache = new Map<string, Map<string, string>>();
const translatedPageKeys = new Set<string>();

const TRANSLATION_CACHE_STORAGE_KEY = "customer_ui_translation_cache_v2";
const MAX_CACHE_LANGUAGES = 8;
const MAX_CACHE_ENTRIES_PER_LANGUAGE = 1500;
let translationCacheHydrated = false;

const TRANSLATABLE_ATTRS = ["placeholder", "title", "aria-label"] as const;

type TextNodeRecord = {
    node: Text;
    lead: string;
    core: string;
    trail: string;
};

type AttrRecord = {
    element: Element;
    attr: (typeof TRANSLATABLE_ATTRS)[number];
    source: string;
};

function splitPadding(value: string) {
    const match = value.match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (!match) return { lead: "", core: value, trail: "" };
    return { lead: match[1] ?? "", core: match[2] ?? "", trail: match[3] ?? "" };
}

function getTextNodeSource(node: Text): string {
    const currentValue = node.nodeValue ?? "";
    const existing = textNodeSourceMap.get(node);
    if (existing === undefined) {
        textNodeSourceMap.set(node, currentValue);
        return currentValue;
    }

    const lastApplied = textNodeLastAppliedMap.get(node);
    if (currentValue !== existing && currentValue !== lastApplied) {
        textNodeSourceMap.set(node, currentValue);
        return currentValue;
    }

    return existing;
}

function getElementAttrLastAppliedMap(element: Element): Map<string, string> {
    let attrs = elementAttrLastAppliedMap.get(element);
    if (!attrs) {
        attrs = new Map<string, string>();
        elementAttrLastAppliedMap.set(element, attrs);
    }
    return attrs;
}

function getElementAttrSource(element: Element, attr: (typeof TRANSLATABLE_ATTRS)[number]): string {
    let attrs = elementAttrSourceMap.get(element);
    if (!attrs) {
        attrs = new Map<string, string>();
        elementAttrSourceMap.set(element, attrs);
    }

    const currentValue = element.getAttribute(attr) ?? "";
    if (!attrs.has(attr)) {
        attrs.set(attr, currentValue);
        return currentValue;
    }

    const existing = attrs.get(attr) ?? "";
    const lastApplied = getElementAttrLastAppliedMap(element).get(attr);

    if (currentValue !== existing && currentValue !== lastApplied) {
        attrs.set(attr, currentValue);
        return currentValue;
    }

    return existing;
}

function ensureLanguageCache(targetLanguage: string): Map<string, string> {
    let cache = translationCache.get(targetLanguage);
    if (!cache) {
        cache = new Map<string, string>();
        translationCache.set(targetLanguage, cache);
    }
    return cache;
}

function hydrateTranslationCacheFromStorage() {
    if (translationCacheHydrated || typeof window === "undefined") {
        return;
    }

    translationCacheHydrated = true;
    try {
        const raw = window.localStorage.getItem(TRANSLATION_CACHE_STORAGE_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw) as Record<string, Array<[string, string]>>;
        Object.entries(parsed).forEach(([language, entries]) => {
            if (!Array.isArray(entries) || !language.trim()) return;
            const map = new Map<string, string>();
            entries.forEach((pair) => {
                if (!Array.isArray(pair) || pair.length !== 2) return;
                const source = String(pair[0] || "");
                const translated = String(pair[1] || "");
                if (!source.trim()) return;
                map.set(source, translated || source);
            });
            if (map.size > 0) {
                translationCache.set(language, map);
            }
        });
    } catch {
        // ignore malformed cache payload
    }
}

function persistTranslationCacheToStorage(preferredLanguage?: string) {
    if (typeof window === "undefined") {
        return;
    }

    try {
        const entries = Array.from(translationCache.entries());
        entries.sort(([a], [b]) => {
            if (preferredLanguage && a === preferredLanguage && b !== preferredLanguage) return -1;
            if (preferredLanguage && b === preferredLanguage && a !== preferredLanguage) return 1;
            return 0;
        });

        const limited = entries.slice(0, MAX_CACHE_LANGUAGES);
        const payload: Record<string, Array<[string, string]>> = {};

        limited.forEach(([language, map]) => {
            const items = Array.from(map.entries());
            const sliced =
                items.length > MAX_CACHE_ENTRIES_PER_LANGUAGE
                    ? items.slice(items.length - MAX_CACHE_ENTRIES_PER_LANGUAGE)
                    : items;
            payload[language] = sliced;
        });

        window.localStorage.setItem(TRANSLATION_CACHE_STORAGE_KEY, JSON.stringify(payload));
    } catch {
        // ignore storage errors (quota / private mode)
    }
}

function setUiTranslatingState(isTranslating: boolean) {
    if (typeof document === "undefined") {
        return;
    }
    if (isTranslating) {
        document.body.setAttribute("data-ui-translating", "true");
        return;
    }
    document.body.removeAttribute("data-ui-translating");
}

function chunkArray<T>(items: T[], size: number): T[][] {
    if (items.length === 0) return [];
    const result: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
        result.push(items.slice(i, i + size));
    }
    return result;
}

async function translateMissingTexts(targetLanguage: string, texts: string[]) {
    const cache = ensureLanguageCache(targetLanguage);
    const missing = texts.filter((text) => !cache.has(text));
    if (missing.length === 0) return false;

    const batches = chunkArray(missing, 40);
    for (const batch of batches) {
        try {
            const response = await translationService.translateUiTexts(batch, targetLanguage);
            const translated = response.result?.texts ?? [];
            const translatedSuccessfully = response.result?.translated === true;

            if (!translatedSuccessfully) {
                continue;
            }

            batch.forEach((source, index) => {
                cache.set(source, translated[index] || source);
            });
        } catch {
            // Keep untranslated text out of persistent cache so the UI can recover
            // automatically after backend translation/Azure config is fixed.
        }
    }

    persistTranslationCacheToStorage(targetLanguage);
    return true;
}

function shouldSkipElement(element: Element | null): boolean {
    if (!element) return true;
    const tag = element.tagName.toUpperCase();
    if (["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE"].includes(tag)) return true;
    return Boolean(element.closest("[data-no-auto-translate='true']"));
}

function collectTextNodes(root: Element): TextNodeRecord[] {
    const records: TextNodeRecord[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

    let currentNode = walker.nextNode();
    while (currentNode) {
        const node = currentNode as Text;
        const parent = node.parentElement;

        if (!shouldSkipElement(parent)) {
            const source = getTextNodeSource(node);
            const { lead, core, trail } = splitPadding(source);
            const normalizedCore = core.trim();

            if (normalizedCore && /[A-Za-zÀ-ỹ]/.test(normalizedCore)) {
                records.push({ node, lead, core: normalizedCore, trail });
            }
        }

        currentNode = walker.nextNode();
    }

    return records;
}

function collectAttrs(root: Element): AttrRecord[] {
    const records: AttrRecord[] = [];

    const elements = root.querySelectorAll<HTMLElement>("input, textarea, button, [aria-label], [title]");
    elements.forEach((element) => {
        if (shouldSkipElement(element)) return;

        TRANSLATABLE_ATTRS.forEach((attr) => {
            const value = element.getAttribute(attr);
            if (!value || !value.trim()) return;
            const source = getElementAttrSource(element, attr).trim();
            if (!source || !/[A-Za-zÀ-ỹ]/.test(source)) return;
            records.push({ element, attr, source });
        });
    });

    return records;
}

function restoreOriginalTexts(root: Element) {
    const textRecords = collectTextNodes(root);
    textRecords.forEach(({ node }) => {
        const source = getTextNodeSource(node);
        if (node.nodeValue !== source) {
            node.nodeValue = source;
        }
        textNodeLastAppliedMap.set(node, source);
    });

    const attrRecords = collectAttrs(root);
    attrRecords.forEach(({ element, attr }) => {
        const source = getElementAttrSource(element, attr);
        if (source) {
            element.setAttribute(attr, source);
        }
        getElementAttrLastAppliedMap(element).set(attr, source);
    });
}

export function useAutoUiTranslation() {
    const location = useLocation();
    const isApplyingRef = useRef(false);
    const [storedLanguage, setStoredLanguage] = useState(() =>
        normalizeLocale(getStoredUserLanguage() || "en-US")
    );
    hydrateTranslationCacheFromStorage();

    useEffect(() => {
        const syncLanguageFromStorage = () => {
            setStoredLanguage(normalizeLocale(getStoredUserLanguage() || "en-US"));
        };

        const handleStorage = () => {
            syncLanguageFromStorage();
        };

        syncLanguageFromStorage();
        window.addEventListener("storage", handleStorage);
        window.addEventListener(CUSTOMER_LANGUAGE_CHANGED_EVENT, syncLanguageFromStorage);

        return () => {
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener(CUSTOMER_LANGUAGE_CHANGED_EVENT, syncLanguageFromStorage);
        };
    }, []);

    const targetLanguage = useMemo(() => {
        if (location.pathname === "/login") {
            return "en-US";
        }
        return normalizeLocale(storedLanguage);
    }, [location.pathname, storedLanguage]);

    useLayoutEffect(() => {
        const root = document.body;
        if (!root) return;

        let disposed = false;
        let timer: number | undefined;
        const pageKey = `${targetLanguage}|${location.pathname}`;

        document.documentElement.lang = normalizeLocale(targetLanguage);

        const applyTranslation = async (trigger: "initial" | "mutation" = "initial") => {
            if (disposed || isApplyingRef.current) return;
            isApplyingRef.current = true;
            let hideUntilApplied = false;

            try {
                if (location.pathname === "/login") {
                    setUiTranslatingState(false);
                    return;
                }

                if (isVietnameseLanguage(targetLanguage)) {
                    restoreOriginalTexts(root);
                    translatedPageKeys.add(pageKey);
                    setUiTranslatingState(false);
                    return;
                }

                const textNodes = collectTextNodes(root);
                const attrs = collectAttrs(root);

                const uniqueTexts = Array.from(
                    new Set([
                        ...textNodes.map((record) => record.core),
                        ...attrs.map((record) => record.source),
                    ])
                );

                if (uniqueTexts.length === 0) {
                    translatedPageKeys.add(pageKey);
                    setUiTranslatingState(false);
                    return;
                }

                const cache = ensureLanguageCache(targetLanguage);
                const missingTexts = uniqueTexts.filter((text) => !cache.has(text));
                const shouldHideForInitialPaint =
                    trigger === "initial" &&
                    missingTexts.length > 0 &&
                    !translatedPageKeys.has(pageKey);

                if (shouldHideForInitialPaint) {
                    hideUntilApplied = true;
                    setUiTranslatingState(true);
                }

                await translateMissingTexts(targetLanguage, uniqueTexts);
                if (disposed) {
                    return;
                }
                const latestCache = ensureLanguageCache(targetLanguage);

                textNodes.forEach(({ node, lead, core, trail }) => {
                    const translated = latestCache.get(core) || core;
                    const nextValue = `${lead}${translated}${trail}`;
                    if (node.nodeValue !== nextValue) {
                        node.nodeValue = nextValue;
                    }
                    textNodeLastAppliedMap.set(node, nextValue);
                });

                attrs.forEach(({ element, attr, source }) => {
                    const translated = latestCache.get(source) || source;
                    if (element.getAttribute(attr) !== translated) {
                        element.setAttribute(attr, translated);
                    }
                    getElementAttrLastAppliedMap(element).set(attr, translated);
                });

                translatedPageKeys.add(pageKey);
            } finally {
                isApplyingRef.current = false;
                if (hideUntilApplied) {
                    setUiTranslatingState(false);
                }
            }
        };

        const scheduleApply = () => {
            if (disposed) return;
            if (timer) window.clearTimeout(timer);
            timer = window.setTimeout(() => {
                void applyTranslation("mutation");
            }, 40);
        };

        const observer = new MutationObserver(() => {
            if (isApplyingRef.current) return;
            scheduleApply();
        });

        observer.observe(root, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
            attributeFilter: TRANSLATABLE_ATTRS as unknown as string[],
        });

        void applyTranslation("initial");

        return () => {
            disposed = true;
            if (timer) window.clearTimeout(timer);
            observer.disconnect();
            setUiTranslatingState(false);
        };
    }, [targetLanguage, location.pathname]);
}
