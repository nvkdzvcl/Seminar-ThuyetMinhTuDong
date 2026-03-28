import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { translationService } from "../services/translationService";
import {
    CUSTOMER_LANGUAGE_CHANGED_EVENT,
    getStoredUserLanguage,
    isEnglishLanguage,
    isVietnameseLanguage,
    normalizeLocale,
} from "../utils/language";

const textNodeSourceMap = new WeakMap<Text, string>();
const textNodeLastAppliedMap = new WeakMap<Text, string>();
const elementAttrSourceMap = new WeakMap<Element, Map<string, string>>();
const elementAttrLastAppliedMap = new WeakMap<Element, Map<string, string>>();
const translationCache = new Map<string, Map<string, string>>();

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
    if (missing.length === 0) return;

    const batches = chunkArray(missing, 40);
    for (const batch of batches) {
        try {
            const response = await translationService.translateUiTexts(batch, targetLanguage);
            const translated = response.result?.texts ?? [];

            batch.forEach((source, index) => {
                cache.set(source, translated[index] || source);
            });
        } catch {
            batch.forEach((source) => {
                cache.set(source, source);
            });
        }
    }
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

    useEffect(() => {
        const root = document.body;
        if (!root) return;

        let disposed = false;
        let timer: number | undefined;

        document.documentElement.lang = normalizeLocale(targetLanguage);

        const applyTranslation = async () => {
            if (disposed || isApplyingRef.current) return;
            isApplyingRef.current = true;

            try {
                if (location.pathname === "/login") {
                    return;
                }

                if (!isEnglishLanguage(targetLanguage) && isVietnameseLanguage(targetLanguage)) {
                    restoreOriginalTexts(root);
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

                if (uniqueTexts.length === 0) return;

                await translateMissingTexts(targetLanguage, uniqueTexts);
                const cache = ensureLanguageCache(targetLanguage);

                textNodes.forEach(({ node, lead, core, trail }) => {
                    const translated = cache.get(core) || core;
                    const nextValue = `${lead}${translated}${trail}`;
                    if (node.nodeValue !== nextValue) {
                        node.nodeValue = nextValue;
                    }
                    textNodeLastAppliedMap.set(node, nextValue);
                });

                attrs.forEach(({ element, attr, source }) => {
                    const translated = cache.get(source) || source;
                    if (element.getAttribute(attr) !== translated) {
                        element.setAttribute(attr, translated);
                    }
                    getElementAttrLastAppliedMap(element).set(attr, translated);
                });
            } finally {
                isApplyingRef.current = false;
            }
        };

        const scheduleApply = () => {
            if (disposed) return;
            if (timer) window.clearTimeout(timer);
            timer = window.setTimeout(() => {
                void applyTranslation();
            }, 120);
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

        scheduleApply();

        return () => {
            disposed = true;
            if (timer) window.clearTimeout(timer);
            observer.disconnect();
        };
    }, [targetLanguage, location.pathname]);
}
