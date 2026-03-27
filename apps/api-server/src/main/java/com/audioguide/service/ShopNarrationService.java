package com.audioguide.service;

import com.audioguide.dto.shopDTO.ShopNarrationResponse;
import com.audioguide.entity.Shop;
import com.audioguide.exception.AppException;
import com.audioguide.exception.ErrorCode;
import com.audioguide.repository.ShopRepository;
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
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ShopNarrationService {

    static final Map<String, VoiceProfile> VOICE_BY_LANGUAGE = Map.ofEntries(
            Map.entry("en", new VoiceProfile("en-US", "en-US-JennyNeural", "en")),
            Map.entry("vi", new VoiceProfile("vi-VN", "vi-VN-HoaiMyNeural", "vi")),
            Map.entry("fr", new VoiceProfile("fr-FR", "fr-FR-DeniseNeural", "fr")),
            Map.entry("de", new VoiceProfile("de-DE", "de-DE-KatjaNeural", "de")),
            Map.entry("es", new VoiceProfile("es-ES", "es-ES-ElviraNeural", "es")),
            Map.entry("it", new VoiceProfile("it-IT", "it-IT-ElsaNeural", "it")),
            Map.entry("pt", new VoiceProfile("pt-BR", "pt-BR-FranciscaNeural", "pt")),
            Map.entry("ja", new VoiceProfile("ja-JP", "ja-JP-NanamiNeural", "ja")),
            Map.entry("ko", new VoiceProfile("ko-KR", "ko-KR-SunHiNeural", "ko")),
            Map.entry("zh", new VoiceProfile("zh-CN", "zh-CN-XiaoxiaoNeural", "zh-Hans")),
            Map.entry("ru", new VoiceProfile("ru-RU", "ru-RU-SvetlanaNeural", "ru")),
            Map.entry("th", new VoiceProfile("th-TH", "th-TH-PremwadeeNeural", "th")),
            Map.entry("id", new VoiceProfile("id-ID", "id-ID-GadisNeural", "id")),
            Map.entry("ar", new VoiceProfile("ar-EG", "ar-EG-SalmaNeural", "ar")),
            Map.entry("hi", new VoiceProfile("hi-IN", "hi-IN-SwaraNeural", "hi"))
    );

    static final String SPEECH_OUTPUT_FORMAT = "audio-16khz-64kbitrate-mono-mp3";

    final ShopRepository shopRepository;
    final ObjectMapper objectMapper;

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

    @Value("${azure.speech.tts-endpoint:}")
    String speechTtsEndpoint;

    final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public ShopNarrationResponse getOrCreateNarration(Integer shopId, String requestedLanguage) {
        ensureAzureConfigPresent();

        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_FOUND));

        String languageTag = normalizeLanguageTag(requestedLanguage);
        VoiceProfile voice = resolveVoice(languageTag);

        String sourceText = buildShopNarrationText(shop);
        String translatedText = translateToLanguage(sourceText, voice.translatorCode());

        String contentSignature = createContentSignature(shop, languageTag, translatedText, voice.voiceName());
        String safeLanguage = languageTag.replace("-", "_").toLowerCase(Locale.ROOT);
        String fileName = "shop-" + shopId + "-" + safeLanguage + "-" + contentSignature + ".mp3";

        Path targetDir = Paths.get(uploadDir, "shop-audios", "tts");
        Path targetFile = targetDir.resolve(fileName).normalize();

        try {
            Files.createDirectories(targetDir);
            if (Files.exists(targetFile)) {
                return ShopNarrationResponse.builder()
                        .shopId(shopId)
                        .language(languageTag)
                        .voice(voice.voiceName())
                        .audioUrl("/uploads/shop-audios/tts/" + fileName)
                        .cached(true)
                        .build();
            }

            byte[] audioBytes = synthesizeSpeech(translatedText, voice);
            Files.write(targetFile, audioBytes);

            return ShopNarrationResponse.builder()
                    .shopId(shopId)
                    .language(languageTag)
                    .voice(voice.voiceName())
                    .audioUrl("/uploads/shop-audios/tts/" + fileName)
                    .cached(false)
                    .build();
        } catch (IOException exception) {
            log.error("Cannot store generated narration audio for shop {}", shopId, exception);
            throw new AppException(ErrorCode.AZURE_TTS_FAILED);
        }
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
        String language = languageTag.split("-")[0].toLowerCase(Locale.ROOT);
        return VOICE_BY_LANGUAGE.getOrDefault(language, VOICE_BY_LANGUAGE.get("en"));
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

    private record VoiceProfile(String locale, String voiceName, String translatorCode) {}
}
