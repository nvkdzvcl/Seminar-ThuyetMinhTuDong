package com.audioguide.service;

import com.audioguide.dto.shopDTO.ShopNarrationResponse;
import com.audioguide.entity.Dish;
import com.audioguide.entity.Shop;
import com.audioguide.enums.Status;
import com.audioguide.exception.AppException;
import com.audioguide.exception.ErrorCode;
import com.audioguide.repository.DishRepository;
import com.audioguide.repository.ShopRepository;
import com.audioguide.utils.TranslationTextProtector;
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
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Predicate;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ShopNarrationService {

    static final Map<String, VoiceProfile> FALLBACK_VOICE_BY_LANGUAGE = Map.ofEntries(
            Map.entry("en", new VoiceProfile("en-US", "en-US-JennyNeural", "en", false)),
            Map.entry("vi", new VoiceProfile("vi-VN", "vi-VN-HoaiMyNeural", "vi", false)),
            Map.entry("fr", new VoiceProfile("fr-FR", "fr-FR-DeniseNeural", "fr", false)),
            Map.entry("de", new VoiceProfile("de-DE", "de-DE-KatjaNeural", "de", false)),
            Map.entry("es", new VoiceProfile("es-ES", "es-ES-ElviraNeural", "es", false)),
            Map.entry("it", new VoiceProfile("it-IT", "it-IT-ElsaNeural", "it", false)),
            Map.entry("pt", new VoiceProfile("pt-BR", "pt-BR-FranciscaNeural", "pt", false)),
            Map.entry("ja", new VoiceProfile("ja-JP", "ja-JP-NanamiNeural", "ja", false)),
            Map.entry("ko", new VoiceProfile("ko-KR", "ko-KR-SunHiNeural", "ko", false)),
            Map.entry("zh", new VoiceProfile("zh-CN", "zh-CN-XiaoxiaoNeural", "zh-Hans", false)),
            Map.entry("ru", new VoiceProfile("ru-RU", "ru-RU-SvetlanaNeural", "ru", false)),
            Map.entry("th", new VoiceProfile("th-TH", "th-TH-PremwadeeNeural", "th", false)),
            Map.entry("id", new VoiceProfile("id-ID", "id-ID-GadisNeural", "id", false)),
            Map.entry("ar", new VoiceProfile("ar-EG", "ar-EG-SalmaNeural", "ar", false)),
            Map.entry("hi", new VoiceProfile("hi-IN", "hi-IN-SwaraNeural", "hi", false))
    );

    static final VoiceProfile DEFAULT_ENGLISH_VOICE = FALLBACK_VOICE_BY_LANGUAGE.get("en");
    static final Set<String> TRADITIONAL_CHINESE_COUNTRIES = Set.of("TW", "HK", "MO");
    static final Duration VOICE_CACHE_TTL = Duration.ofHours(6);
    static final String SPEECH_OUTPUT_FORMAT = "audio-16khz-64kbitrate-mono-mp3";

    final ShopRepository shopRepository;
    final DishRepository dishRepository;
    final ObjectMapper objectMapper;
    final AtomicLong voiceCacheLoadedAtMillis = new AtomicLong(0L);
    final Object voiceCacheLock = new Object();
    volatile List<AzureVoice> cachedVoices = List.of();

    @Value("${file.upload-dir}")
    String uploadDir;

    @Value("${azure.translator.key:}")
    String translatorKey;

    @Value("${azure.translator.region:}")
    String translatorRegion;

    @Value("${azure.translator.endpoint:https://api.cognitive.microsofttranslator.com}")
    String translatorEndpoint;

    @Value("${azure.speech.key:}")
    String speechKey;

    @Value("${azure.speech.region:}")
    String speechRegion;

    @Value("${azure.speech.endpoint:}")
    String speechEndpoint;

    @Value("${azure.speech.tts-endpoint:}")
    String speechTtsEndpoint;

    final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public ShopNarrationResponse getOrCreateNarration(Integer shopId, String requestedLanguage) {
        ensureAzureConfigPresent();

        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_FOUND));

        String requestedLanguageTag = normalizeLanguageTag(requestedLanguage);
        VoiceProfile voice = resolveVoice(requestedLanguageTag);
        String effectiveLanguageTag = voice.locale();

        String sourceText = buildShopNarrationText(shop);
        TranslationTextProtector.ProtectedText protectedText = TranslationTextProtector.protectText(
                sourceText,
                collectShopProtectedTerms(shop)
        );
        TranslationResult translationResult = translateWithFallback(protectedText.maskedText(), voice.translatorCode());
        String translatedNarrationText = protectedText.restore(translationResult.translatedText());
        boolean fallbackApplied = voice.fallbackApplied() || translationResult.fallbackApplied();

        if (translationResult.fallbackApplied() && !isEnglishLocale(effectiveLanguageTag)) {
            // If translation already fell back to English, force an English voice for natural pronunciation.
            voice = DEFAULT_ENGLISH_VOICE.withFallback(true);
            effectiveLanguageTag = voice.locale();
            fallbackApplied = true;
        }

        String contentSignature = createContentSignature(shop, effectiveLanguageTag, translatedNarrationText, voice.voiceName());
        String safeLanguage = effectiveLanguageTag.replace("-", "_").toLowerCase(Locale.ROOT);
        String fileName = "shop-" + shopId + "-" + safeLanguage + "-" + contentSignature + ".mp3";

        Path targetDir = Paths.get(uploadDir, "shop-audios", "tts");
        Path targetFile = targetDir.resolve(fileName).normalize();

        try {
            Files.createDirectories(targetDir);
            if (Files.exists(targetFile)) {
                return ShopNarrationResponse.builder()
                        .shopId(shopId)
                        .language(effectiveLanguageTag)
                        .requestedLanguage(requestedLanguageTag)
                        .voice(voice.voiceName())
                        .audioUrl("/uploads/shop-audios/tts/" + fileName)
                        .cached(true)
                        .fallbackApplied(fallbackApplied)
                        .build();
            }

            byte[] audioBytes = synthesizeSpeech(translatedNarrationText, voice);
            Files.write(targetFile, audioBytes);

            return ShopNarrationResponse.builder()
                    .shopId(shopId)
                    .language(effectiveLanguageTag)
                    .requestedLanguage(requestedLanguageTag)
                    .voice(voice.voiceName())
                    .audioUrl("/uploads/shop-audios/tts/" + fileName)
                    .cached(false)
                    .fallbackApplied(fallbackApplied)
                    .build();
        } catch (IOException exception) {
            log.error("Cannot store generated narration audio for shop {}", shopId, exception);
            throw new AppException(ErrorCode.AZURE_TTS_FAILED);
        }
    }

    private List<String> collectShopProtectedTerms(Shop shop) {
        LinkedHashSet<String> terms = new LinkedHashSet<>();
        addProtectedTerm(terms, shop.getName());
        addProtectedTerm(terms, shop.getAddress());

        if (shop.getId() != null) {
            List<Dish> dishes = dishRepository.findByShopIdAndStatus(shop.getId(), Status.ACTIVE);
            for (Dish dish : dishes) {
                addProtectedTerm(terms, dish.getName());
            }
        }
        return new ArrayList<>(terms);
    }

    private void addProtectedTerm(LinkedHashSet<String> terms, String value) {
        if (isBlank(value)) {
            return;
        }
        String normalized = value.trim();
        if (normalized.length() < 2) {
            return;
        }
        terms.add(normalized);
    }

    private void ensureAzureConfigPresent() {
        List<String> missing = new ArrayList<>();
        if (isBlank(translatorKey)) {
            missing.add("AZURE_TRANSLATOR_KEY");
        }
        if (isBlank(translatorRegion)) {
            missing.add("AZURE_TRANSLATOR_REGION");
        }
        if (isBlank(speechKey)) {
            missing.add("AZURE_SPEECH_KEY");
        }
        if (isBlank(speechRegion)) {
            missing.add("AZURE_SPEECH_REGION");
        }
        if (isBlank(speechTtsEndpoint)) {
            missing.add("AZURE_SPEECH_TTS_ENDPOINT");
        }
        if (!missing.isEmpty()) {
            log.error("Azure configuration is missing required values: {}", missing);
            throw new AppException(ErrorCode.AZURE_CONFIG_MISSING);
        }
    }

    private String buildShopNarrationText(Shop shop) {
        if (!isBlank(shop.getDescription())) {
            return shop.getDescription().trim();
        }
        return "Quán hiện chưa có mô tả chi tiết.";
    }

    private TranslationResult translateWithFallback(String text, String preferredTargetLanguageCode) {
        String safeTarget = isBlank(preferredTargetLanguageCode) ? "en" : preferredTargetLanguageCode;
        try {
            return new TranslationResult(translateToLanguage(text, safeTarget), safeTarget, false);
        } catch (AppException exception) {
            if ("en".equalsIgnoreCase(safeTarget)) {
                throw exception;
            }
            log.warn("Translator failed for target '{}', fallback to English translation", safeTarget);
            String englishText = translateToLanguage(text, "en");
            return new TranslationResult(englishText, "en", true);
        }
    }

    private String translateToLanguage(String text, String targetLanguageCode) {
        try {
            String url = trimTrailingSlash(translatorEndpoint)
                    + "/translate?api-version=3.0&to="
                    + URLEncoder.encode(targetLanguageCode, StandardCharsets.UTF_8);

            String requestBody = objectMapper.writeValueAsString(
                    java.util.List.of(Map.of("Text", text))
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(20))
                    .header("Content-Type", "application/json")
                    .header("Ocp-Apim-Subscription-Key", translatorKey)
                    .header("Ocp-Apim-Subscription-Region", translatorRegion)
                    .header("X-ClientTraceId", UUID.randomUUID().toString())
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.error("Translator call failed. Status: {}, body: {}", response.statusCode(), response.body());
                throw new AppException(ErrorCode.AZURE_TTS_FAILED);
            }

            JsonNode body = objectMapper.readTree(response.body());
            String translated = body.path(0)
                    .path("translations")
                    .path(0)
                    .path("text")
                    .asText();

            if (isBlank(translated)) {
                log.error("Translator response missing translated text: {}", response.body());
                throw new AppException(ErrorCode.AZURE_TTS_FAILED);
            }
            return translated;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            log.error("Translator call interrupted", exception);
            throw new AppException(ErrorCode.AZURE_TTS_FAILED);
        } catch (IOException exception) {
            log.error("Translator call failed unexpectedly", exception);
            throw new AppException(ErrorCode.AZURE_TTS_FAILED);
        }
    }

    private byte[] synthesizeSpeech(String translatedText, VoiceProfile voiceProfile) {
        try {
            String ssml = "<speak version=\"1.0\" xml:lang=\"" + voiceProfile.locale() + "\">"
                    + "<voice name=\"" + voiceProfile.voiceName() + "\">"
                    + escapeXml(translatedText)
                    + "</voice></speak>";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(speechTtsEndpoint))
                    .timeout(Duration.ofSeconds(20))
                    .header("Ocp-Apim-Subscription-Key", speechKey)
                    .header("Ocp-Apim-Subscription-Region", speechRegion)
                    .header("Content-Type", "application/ssml+xml")
                    .header("X-Microsoft-OutputFormat", SPEECH_OUTPUT_FORMAT)
                    .header("User-Agent", "vinhkhanhfoodtour-api")
                    .POST(HttpRequest.BodyPublishers.ofString(ssml, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                String errorBody = new String(response.body(), StandardCharsets.UTF_8);
                log.error("Speech TTS call failed. Status: {}, body: {}", response.statusCode(), errorBody);
                throw new AppException(ErrorCode.AZURE_TTS_FAILED);
            }
            return response.body();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            log.error("Speech TTS call interrupted", exception);
            throw new AppException(ErrorCode.AZURE_TTS_FAILED);
        } catch (IOException exception) {
            log.error("Speech TTS call failed unexpectedly", exception);
            throw new AppException(ErrorCode.AZURE_TTS_FAILED);
        }
    }

    private VoiceProfile resolveVoice(String languageTag) {
        String normalizedLanguageTag = normalizeLanguageTag(languageTag);
        List<AzureVoice> voices = getOrRefreshVoices();

        Optional<AzureVoice> selectedVoice = pickBestVoice(voices, normalizedLanguageTag);
        if (selectedVoice.isPresent()) {
            AzureVoice voice = selectedVoice.get();
            String normalizedLocale = normalizeLanguageTag(voice.locale());
            return new VoiceProfile(
                    normalizedLocale,
                    voice.shortName(),
                    resolveTranslatorCode(normalizedLocale),
                    !isSameLanguage(normalizedLanguageTag, normalizedLocale)
            );
        }

        String language = normalizedLanguageTag.split("-")[0].toLowerCase(Locale.ROOT);
        VoiceProfile fallback = FALLBACK_VOICE_BY_LANGUAGE.getOrDefault(language, DEFAULT_ENGLISH_VOICE);
        return fallback.withFallback(!isSameLanguage(normalizedLanguageTag, fallback.locale()));
    }

    private List<AzureVoice> getOrRefreshVoices() {
        long now = System.currentTimeMillis();
        long loadedAt = voiceCacheLoadedAtMillis.get();
        if (!cachedVoices.isEmpty() && now - loadedAt < VOICE_CACHE_TTL.toMillis()) {
            return cachedVoices;
        }

        synchronized (voiceCacheLock) {
            now = System.currentTimeMillis();
            loadedAt = voiceCacheLoadedAtMillis.get();
            if (!cachedVoices.isEmpty() && now - loadedAt < VOICE_CACHE_TTL.toMillis()) {
                return cachedVoices;
            }

            List<AzureVoice> freshVoices = fetchVoicesFromAzure();
            if (!freshVoices.isEmpty()) {
                cachedVoices = freshVoices;
                voiceCacheLoadedAtMillis.set(now);
                return cachedVoices;
            }

            return cachedVoices;
        }
    }

    private List<AzureVoice> fetchVoicesFromAzure() {
        String metadataEndpoint = resolveSpeechMetadataEndpoint();
        if (isBlank(metadataEndpoint)) {
            log.warn("Speech endpoint is blank, skip loading Azure voice list");
            return List.of();
        }

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(metadataEndpoint + "/cognitiveservices/voices/list"))
                    .timeout(Duration.ofSeconds(20))
                    .header("Ocp-Apim-Subscription-Key", speechKey)
                    .header("Ocp-Apim-Subscription-Region", speechRegion)
                    .header("User-Agent", "vinhkhanhfoodtour-api")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("Cannot load Azure voice list. Status: {}, body: {}", response.statusCode(), response.body());
                return List.of();
            }

            JsonNode body = objectMapper.readTree(response.body());
            if (!body.isArray()) {
                log.warn("Azure voice list response is not an array");
                return List.of();
            }

            List<AzureVoice> voices = new ArrayList<>();
            for (JsonNode node : body) {
                String shortName = node.path("ShortName").asText();
                String locale = node.path("Locale").asText();

                if (isBlank(shortName) || isBlank(locale)) {
                    continue;
                }

                String status = node.path("Status").asText("");
                if ("Deprecated".equalsIgnoreCase(status)) {
                    continue;
                }

                boolean neural = shortName.toLowerCase(Locale.ROOT).contains("neural");
                voices.add(new AzureVoice(locale, shortName, neural));
            }

            voices.sort(Comparator.comparing(AzureVoice::locale).thenComparing(AzureVoice::shortName));
            return voices;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            log.warn("Loading Azure voice list interrupted", exception);
            return List.of();
        } catch (Exception exception) {
            log.warn("Cannot load Azure voice list", exception);
            return List.of();
        }
    }

    private Optional<AzureVoice> pickBestVoice(List<AzureVoice> voices, String requestedLanguageTag) {
        if (voices == null || voices.isEmpty()) {
            return Optional.empty();
        }

        String requestedTag = normalizeLanguageTag(requestedLanguageTag).toLowerCase(Locale.ROOT);
        String requestedLanguage = requestedTag.split("-")[0];

        return firstVoice(voices, voice -> voice.neural() && voice.locale().equalsIgnoreCase(requestedTag))
                .or(() -> firstVoice(voices, voice -> voice.locale().equalsIgnoreCase(requestedTag)))
                .or(() -> firstVoice(voices, voice -> voice.neural() && sameLanguage(requestedLanguage, voice.locale())))
                .or(() -> firstVoice(voices, voice -> sameLanguage(requestedLanguage, voice.locale())))
                .or(() -> firstVoice(voices, voice -> voice.neural() && "en-us".equalsIgnoreCase(voice.locale())))
                .or(() -> firstVoice(voices, voice -> voice.neural() && sameLanguage("en", voice.locale())))
                .or(() -> firstVoice(voices, AzureVoice::neural))
                .or(() -> firstVoice(voices, voice -> true));
    }

    private Optional<AzureVoice> firstVoice(List<AzureVoice> voices, Predicate<AzureVoice> predicate) {
        return voices.stream().filter(predicate).findFirst();
    }

    private String resolveTranslatorCode(String languageTag) {
        Locale locale = Locale.forLanguageTag(normalizeLanguageTag(languageTag));
        String language = locale.getLanguage().toLowerCase(Locale.ROOT);
        String country = locale.getCountry().toUpperCase(Locale.ROOT);
        String script = locale.getScript();

        if (isBlank(language)) {
            return "en";
        }
        if ("zh".equals(language)) {
            if (TRADITIONAL_CHINESE_COUNTRIES.contains(country) || "Hant".equalsIgnoreCase(script)) {
                return "zh-Hant";
            }
            return "zh-Hans";
        }
        if ("sr".equals(language)) {
            return "Latn".equalsIgnoreCase(script) ? "sr-Latn" : "sr-Cyrl";
        }
        if ("nb".equals(language) || "nn".equals(language)) {
            return "nb";
        }
        return language;
    }

    private String resolveSpeechMetadataEndpoint() {
        if (!isBlank(speechEndpoint)) {
            return trimTrailingSlash(speechEndpoint);
        }
        if (!isBlank(speechRegion)) {
            return "https://" + speechRegion + ".api.cognitive.microsoft.com";
        }
        return "";
    }

    private String normalizeLanguageTag(String rawLanguage) {
        if (isBlank(rawLanguage)) {
            return "en-US";
        }
        Locale locale = Locale.forLanguageTag(rawLanguage.trim());
        String language = isBlank(locale.getLanguage()) ? "en" : locale.getLanguage().toLowerCase(Locale.ROOT);
        String script = locale.getScript();
        String country = locale.getCountry().toUpperCase(Locale.ROOT);

        if (!isBlank(script) && !country.isBlank()) {
            return language + "-" + normalizeScript(script) + "-" + country;
        }
        if (!isBlank(script)) {
            return language + "-" + normalizeScript(script);
        }
        return country.isBlank() ? language : language + "-" + country;
    }

    private String normalizeScript(String script) {
        if (isBlank(script)) {
            return "";
        }
        String trimmed = script.trim();
        if (trimmed.length() == 1) {
            return trimmed.toUpperCase(Locale.ROOT);
        }
        return trimmed.substring(0, 1).toUpperCase(Locale.ROOT)
                + trimmed.substring(1).toLowerCase(Locale.ROOT);
    }

    private boolean isSameLanguage(String leftTag, String rightTag) {
        String leftLanguage = normalizeLanguageTag(leftTag).split("-")[0].toLowerCase(Locale.ROOT);
        String rightLanguage = normalizeLanguageTag(rightTag).split("-")[0].toLowerCase(Locale.ROOT);
        return leftLanguage.equals(rightLanguage);
    }

    private boolean sameLanguage(String language, String localeTag) {
        String localeLanguage = normalizeLanguageTag(localeTag).split("-")[0].toLowerCase(Locale.ROOT);
        return language.equalsIgnoreCase(localeLanguage);
    }

    private boolean isEnglishLocale(String languageTag) {
        return normalizeLanguageTag(languageTag).toLowerCase(Locale.ROOT).startsWith("en");
    }

    private String createContentSignature(Shop shop, String languageTag, String translatedText, String voiceName) {
        String payload = String.join("|",
                defaultText(shop.getDescription(), ""),
                languageTag,
                voiceName,
                translatedText
        );
        return sha256(payload).substring(0, 16);
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 algorithm is unavailable", exception);
        }
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

    private String escapeXml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String defaultText(String value, String fallback) {
        return isBlank(value) ? fallback : value.trim();
    }

    private record TranslationResult(String translatedText, String translatedLanguageCode, boolean fallbackApplied) {}

    private record AzureVoice(String locale, String shortName, boolean neural) {}

    private record VoiceProfile(String locale, String voiceName, String translatorCode, boolean fallbackApplied) {
        private VoiceProfile withFallback(boolean fallback) {
            return new VoiceProfile(locale, voiceName, translatorCode, fallback);
        }
    }
}
