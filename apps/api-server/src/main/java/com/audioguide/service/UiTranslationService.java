package com.audioguide.service;

import com.audioguide.dto.translationDTO.UiTranslationRequest;
import com.audioguide.dto.translationDTO.UiTranslationResponse;
import com.audioguide.dto.translationDTO.UiLanguageListResponse;
import com.audioguide.dto.translationDTO.UiLanguageOption;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UiTranslationService {

    static final Set<String> TRADITIONAL_CHINESE_COUNTRIES = Set.of("TW", "HK", "MO");
    static final Duration UI_LANGUAGE_CACHE_TTL = Duration.ofHours(24);

    final ObjectMapper objectMapper;
    final AtomicLong uiLanguageCacheLoadedAtMillis = new AtomicLong(0L);
    final Object uiLanguageCacheLock = new Object();
    volatile List<UiLanguageOption> cachedUiLanguages = List.of();

    @Value("${azure.translator.key:}")
    String translatorKey;

    @Value("${azure.translator.region:}")
    String translatorRegion;

    @Value("${azure.translator.endpoint:https://api.cognitive.microsofttranslator.com}")
    String translatorEndpoint;

    final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public UiLanguageListResponse getSupportedUiLanguages() {
        List<UiLanguageOption> items = getOrRefreshUiLanguages();
        return UiLanguageListResponse.builder()
                .items(items)
                .total(items.size())
                .build();
    }

    public UiTranslationResponse translateUiTexts(UiTranslationRequest request) {
        List<String> sourceTexts = sanitizeInput(request == null ? null : request.getTexts());
        String targetLanguage = normalizeLanguageTag(request == null ? null : request.getTargetLanguage());
        String targetCode = resolveTranslatorCode(targetLanguage);

        if (sourceTexts.isEmpty() || isBlank(targetCode)) {
            return UiTranslationResponse.builder()
                    .targetLanguage(targetLanguage)
                    .texts(sourceTexts)
                    .translated(false)
                    .build();
        }

        if (isBlank(translatorKey) || isBlank(translatorRegion)) {
            log.warn("Translator key/region missing. Skip UI translation.");
            return UiTranslationResponse.builder()
                    .targetLanguage(targetLanguage)
                    .texts(sourceTexts)
                    .translated(false)
                    .build();
        }

        List<String> translated = callTranslator(sourceTexts, targetCode);
        if (translated == null && !"en".equalsIgnoreCase(targetCode)) {
            log.warn("Target language '{}' is unavailable for UI translation, fallback to English", targetCode);
            translated = callTranslator(sourceTexts, "en");
        }
        if (translated == null) {
            translated = sourceTexts;
        }

        return UiTranslationResponse.builder()
                .targetLanguage(targetLanguage)
                .texts(translated)
                .translated(!translated.equals(sourceTexts))
                .build();
    }

    private List<String> callTranslator(List<String> sourceTexts, String targetCode) {
        try {
            String url = trimTrailingSlash(translatorEndpoint)
                    + "/translate?api-version=3.0&to="
                    + URLEncoder.encode(targetCode, StandardCharsets.UTF_8);

            List<Map<String, String>> payload = sourceTexts.stream()
                    .map(text -> Map.of("Text", text))
                    .toList();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(20))
                    .header("Content-Type", "application/json")
                    .header("Ocp-Apim-Subscription-Key", translatorKey)
                    .header("Ocp-Apim-Subscription-Region", translatorRegion)
                    .header("X-ClientTraceId", UUID.randomUUID().toString())
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload), StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("UI translator call failed. Status: {}, body: {}", response.statusCode(), response.body());
                return null;
            }

            JsonNode body = objectMapper.readTree(response.body());
            if (!body.isArray()) {
                return null;
            }

            List<String> translated = new ArrayList<>();
            for (int i = 0; i < sourceTexts.size(); i++) {
                JsonNode item = body.path(i);
                String translatedText = item.path("translations").path(0).path("text").asText();
                translated.add(isBlank(translatedText) ? sourceTexts.get(i) : translatedText);
            }
            return translated;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            log.warn("UI translator call interrupted", exception);
            return null;
        } catch (IOException exception) {
            log.warn("UI translator call failed unexpectedly", exception);
            return null;
        }
    }

    private List<UiLanguageOption> getOrRefreshUiLanguages() {
        long now = System.currentTimeMillis();
        long loadedAt = uiLanguageCacheLoadedAtMillis.get();
        if (!cachedUiLanguages.isEmpty() && now - loadedAt < UI_LANGUAGE_CACHE_TTL.toMillis()) {
            return cachedUiLanguages;
        }

        synchronized (uiLanguageCacheLock) {
            now = System.currentTimeMillis();
            loadedAt = uiLanguageCacheLoadedAtMillis.get();
            if (!cachedUiLanguages.isEmpty() && now - loadedAt < UI_LANGUAGE_CACHE_TTL.toMillis()) {
                return cachedUiLanguages;
            }

            List<UiLanguageOption> fresh = fetchUiLanguagesFromAzure();
            if (!fresh.isEmpty()) {
                cachedUiLanguages = fresh;
                uiLanguageCacheLoadedAtMillis.set(now);
                return cachedUiLanguages;
            }

            if (cachedUiLanguages.isEmpty()) {
                cachedUiLanguages = getDefaultUiLanguages();
                uiLanguageCacheLoadedAtMillis.set(now);
            }
            return cachedUiLanguages;
        }
    }

    private List<UiLanguageOption> fetchUiLanguagesFromAzure() {
        try {
            String url = trimTrailingSlash(translatorEndpoint) + "/languages?api-version=3.0&scope=translation";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(20))
                    .header("Accept-Language", "en")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("Load translator languages failed. Status: {}, body: {}", response.statusCode(), response.body());
                return List.of();
            }

            JsonNode translationNode = objectMapper.readTree(response.body()).path("translation");
            if (!translationNode.isObject()) {
                log.warn("Translator languages response missing 'translation' object");
                return List.of();
            }

            List<UiLanguageOption> items = new ArrayList<>();
            Iterator<Map.Entry<String, JsonNode>> iterator = translationNode.fields();
            while (iterator.hasNext()) {
                Map.Entry<String, JsonNode> entry = iterator.next();
                String code = entry.getKey();
                JsonNode detail = entry.getValue();
                String displayName = detail.path("name").asText(code);
                String nativeName = detail.path("nativeName").asText(displayName);
                String direction = detail.path("dir").asText("ltr");

                items.add(UiLanguageOption.builder()
                        .code(code)
                        .displayName(displayName)
                        .nativeName(nativeName)
                        .direction(direction)
                        .build());
            }

            items.sort(Comparator.comparing(UiLanguageOption::getDisplayName, String.CASE_INSENSITIVE_ORDER));
            return items;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            log.warn("Load translator languages interrupted", exception);
            return List.of();
        } catch (IOException exception) {
            log.warn("Load translator languages failed unexpectedly", exception);
            return List.of();
        }
    }

    private List<UiLanguageOption> getDefaultUiLanguages() {
        List<UiLanguageOption> defaults = new ArrayList<>();
        defaults.add(UiLanguageOption.builder()
                .code("en")
                .displayName("English")
                .nativeName("English")
                .direction("ltr")
                .build());
        defaults.add(UiLanguageOption.builder()
                .code("vi")
                .displayName("Vietnamese")
                .nativeName("Tiếng Việt")
                .direction("ltr")
                .build());
        return defaults;
    }

    private List<String> sanitizeInput(List<String> texts) {
        if (texts == null || texts.isEmpty()) {
            return List.of();
        }
        List<String> result = new ArrayList<>();
        for (String text : texts) {
            if (text == null) {
                continue;
            }
            String trimmed = text.trim();
            if (!trimmed.isEmpty()) {
                result.add(trimmed);
            }
        }
        return result;
    }

    private String normalizeLanguageTag(String rawLanguage) {
        if (isBlank(rawLanguage)) {
            return "en-US";
        }
        Locale locale = Locale.forLanguageTag(rawLanguage.trim());
        String language = isBlank(locale.getLanguage()) ? "en" : locale.getLanguage().toLowerCase(Locale.ROOT);
        String country = locale.getCountry().toUpperCase(Locale.ROOT);
        return country.isBlank() ? language : language + "-" + country;
    }

    private String resolveTranslatorCode(String languageTag) {
        Locale locale = Locale.forLanguageTag(normalizeLanguageTag(languageTag));
        String language = locale.getLanguage().toLowerCase(Locale.ROOT);
        String country = locale.getCountry().toUpperCase(Locale.ROOT);

        if (isBlank(language)) {
            return "en";
        }
        if ("zh".equals(language)) {
            return TRADITIONAL_CHINESE_COUNTRIES.contains(country) ? "zh-Hant" : "zh-Hans";
        }
        if ("nb".equals(language) || "nn".equals(language)) {
            return "nb";
        }
        return language;
    }

    private String trimTrailingSlash(String value) {
        if (isBlank(value)) {
            return "";
        }
        String normalized = value.trim();
        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
