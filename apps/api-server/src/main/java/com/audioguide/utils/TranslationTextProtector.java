package com.audioguide.utils;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class TranslationTextProtector {

    private TranslationTextProtector() {
    }

    public static ProtectedText protectText(String sourceText, Collection<String> protectedTerms) {
        if (isBlank(sourceText)) {
            return new ProtectedText(defaultText(sourceText), defaultText(sourceText), Map.of());
        }

        List<String> normalizedTerms = normalizeTerms(protectedTerms);
        if (normalizedTerms.isEmpty()) {
            return new ProtectedText(sourceText, sourceText, Map.of());
        }

        String sourceLowerCase = sourceText.toLowerCase(Locale.ROOT);
        List<TermMatch> rawMatches = new ArrayList<>();

        for (String term : normalizedTerms) {
            if (!sourceLowerCase.contains(term.toLowerCase(Locale.ROOT))) {
                continue;
            }

            Matcher matcher = Pattern.compile(Pattern.quote(term), Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE)
                    .matcher(sourceText);

            while (matcher.find()) {
                if (matcher.start() == matcher.end()) {
                    continue;
                }
                rawMatches.add(new TermMatch(matcher.start(), matcher.end()));
            }
        }

        if (rawMatches.isEmpty()) {
            return new ProtectedText(sourceText, sourceText, Map.of());
        }

        rawMatches.sort(Comparator
                .comparingInt(TermMatch::start)
                .thenComparing((left, right) -> Integer.compare(right.length(), left.length())));

        List<TermMatch> selectedMatches = new ArrayList<>();
        int cursor = 0;
        for (TermMatch candidate : rawMatches) {
            if (selectedMatches.isEmpty()) {
                selectedMatches.add(candidate);
                cursor = candidate.end();
                continue;
            }
            if (candidate.start() >= cursor) {
                selectedMatches.add(candidate);
                cursor = candidate.end();
            }
        }

        StringBuilder masked = new StringBuilder();
        Map<String, String> tokenMap = new LinkedHashMap<>();
        int lastIndex = 0;

        for (int index = 0; index < selectedMatches.size(); index++) {
            TermMatch match = selectedMatches.get(index);
            if (match.start() > lastIndex) {
                masked.append(sourceText, lastIndex, match.start());
            }

            String token = "__VKPN_" + index + "__";
            String originalText = sourceText.substring(match.start(), match.end());
            masked.append(token);
            tokenMap.put(token, originalText);

            lastIndex = match.end();
        }

        if (lastIndex < sourceText.length()) {
            masked.append(sourceText.substring(lastIndex));
        }

        return new ProtectedText(sourceText, masked.toString(), tokenMap);
    }

    public static ProtectedBatch protectTexts(List<String> sourceTexts, Collection<String> protectedTerms) {
        if (sourceTexts == null || sourceTexts.isEmpty()) {
            return new ProtectedBatch(List.of(), List.of());
        }

        List<ProtectedText> protectedItems = new ArrayList<>(sourceTexts.size());
        List<String> maskedTexts = new ArrayList<>(sourceTexts.size());

        for (String sourceText : sourceTexts) {
            ProtectedText protectedText = protectText(defaultText(sourceText), protectedTerms);
            protectedItems.add(protectedText);
            maskedTexts.add(protectedText.maskedText());
        }

        return new ProtectedBatch(maskedTexts, protectedItems);
    }

    private static List<String> normalizeTerms(Collection<String> terms) {
        if (terms == null || terms.isEmpty()) {
            return List.of();
        }

        Map<String, String> uniqueByLowerCase = new LinkedHashMap<>();
        for (String term : terms) {
            if (isBlank(term)) {
                continue;
            }
            String normalized = term.trim();
            if (normalized.length() < 2) {
                continue;
            }
            String lowerCaseKey = normalized.toLowerCase(Locale.ROOT);
            uniqueByLowerCase.putIfAbsent(lowerCaseKey, normalized);
        }

        if (uniqueByLowerCase.isEmpty()) {
            return List.of();
        }

        List<String> normalizedTerms = new ArrayList<>(new LinkedHashSet<>(uniqueByLowerCase.values()));
        normalizedTerms.sort(Comparator.comparingInt(String::length).reversed());
        return normalizedTerms;
    }

    private static String defaultText(String value) {
        return value == null ? "" : value;
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private record TermMatch(int start, int end) {
        private int length() {
            return Math.max(0, end - start);
        }
    }

    public record ProtectedText(String sourceText, String maskedText, Map<String, String> tokenMap) {

        public String restore(String translatedText) {
            if (tokenMap == null || tokenMap.isEmpty()) {
                return translatedText == null ? "" : translatedText;
            }

            String restored = translatedText == null ? "" : translatedText;
            for (Map.Entry<String, String> entry : tokenMap.entrySet()) {
                restored = restored.replace(entry.getKey(), entry.getValue());
            }
            return restored;
        }
    }

    public record ProtectedBatch(List<String> maskedTexts, List<ProtectedText> protectedItems) {

        public List<String> restore(List<String> translatedTexts) {
            if (translatedTexts == null || translatedTexts.isEmpty()) {
                return List.of();
            }

            List<String> restored = new ArrayList<>(translatedTexts.size());
            for (int i = 0; i < translatedTexts.size(); i++) {
                String translatedText = translatedTexts.get(i);
                if (i >= protectedItems.size()) {
                    restored.add(translatedText);
                    continue;
                }
                restored.add(protectedItems.get(i).restore(translatedText));
            }
            return restored;
        }
    }
}
