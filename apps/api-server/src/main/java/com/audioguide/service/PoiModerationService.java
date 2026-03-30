package com.audioguide.service;

import com.audioguide.dto.poiDTO.PoiModerationPreviewRequest;
import com.audioguide.dto.poiDTO.PoiModerationPreviewResponse;
import com.audioguide.entity.AdminSetting;
import com.audioguide.entity.Poi;
import com.audioguide.entity.PoiModerationLog;
import com.audioguide.enums.PoiStatus;
import com.audioguide.repository.AdminSettingRepository;
import com.audioguide.repository.PoiModerationLogRepository;
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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PoiModerationService {

    static final String FIELD_NAME_POI_DESCRIPTION = "poi.description";
    static final String STATUS_SAFE = "SAFE";
    static final String STATUS_NEEDS_REVIEW = "NEEDS_REVIEW";
    static final String STATUS_REVIEW_REQUIRED = "REVIEW_REQUIRED";
    static final String STATUS_FAILED = "FAILED";
    static final String DECISION_ALLOW = "ALLOW";
    static final String DECISION_WARN = "WARN";
    static final String DECISION_BLOCK = "BLOCK";
    static final List<String> PII_BLOCKING_LABELS = List.of(
            "sensitive_data_keyword",
            "contains_phone",
            "contains_email",
            "contains_national_id"
    );
    static final List<String> CONTENT_SAFETY_CATEGORIES = List.of("Hate", "Sexual", "SelfHarm", "Violence");
    static final List<String> PROHIBITED_KEYWORDS = List.of(
            "fuck", "fucking", "shit", "bitch", "sex", "porn",
            "địt", "đụ", "đm", "dm", "cc", "lồn", "cặc", "vkl", "vl", "đéo"
    );
    static final List<String> SENSITIVE_DATA_KEYWORDS = List.of(
            "cccd", "cmnd", "can cuoc", "căn cước", "passport", "id card",
            "so tai khoan", "số tài khoản", "tai khoan ngan hang", "tài khoản ngân hàng",
            "bank account", "stk", "account number"
    );
    static final Pattern URL_PATTERN = Pattern.compile("(https?://|www\\.)", Pattern.CASE_INSENSITIVE);
    static final Pattern PHONE_PATTERN = Pattern.compile("(\\+?\\d[\\d\\s\\-]{7,}\\d)");
    static final Pattern EMAIL_PATTERN = Pattern.compile("([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,})");
    static final Pattern NATIONAL_ID_PATTERN = Pattern.compile("\\b\\d{12}\\b");
    static final Pattern REPEATED_SYMBOL_PATTERN = Pattern.compile("([!?.*_#\\-])\\1{4,}");

    final ObjectMapper objectMapper;
    final AdminSettingRepository adminSettingRepository;
    final PoiModerationLogRepository poiModerationLogRepository;

    final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${moderation.poi.enabled:true}")
    boolean moderationEnabled;

    @Value("${azure.content-safety.key:}")
    String contentSafetyKey;

    @Value("${azure.content-safety.endpoint:}")
    String contentSafetyEndpoint;

    @Value("${azure.content-safety.api-version:2024-09-01}")
    String contentSafetyApiVersion;

    @Value("${llm.provider:ollama}")
    String llmProvider;

    @Value("${llm.ollama.base-url:http://localhost:11434}")
    String ollamaBaseUrl;

    @Value("${llm.ollama.model:qwen3:4b}")
    String ollamaModel;

    @Value("${llm.ollama.timeout-ms:30000}")
    int ollamaTimeoutMs;

    @Value("${llm.ollama.think:false}")
    boolean ollamaThink;

    public void evaluateAndApply(Poi poi) {
        if (poi == null || poi.getId() == null) {
            return;
        }
        if (!moderationEnabled) {
            return;
        }

        String textSnapshot = buildTextSnapshot(poi);
        ModerationPolicy policy = loadPolicy();
        HeuristicResult heuristic = evaluateHeuristics(poi);

        try {
            ContentSafetyResult contentSafety = analyzeByContentSafety(textSnapshot);
            LlmResult llmResult = analyzeByLlm(poi, textSnapshot);
            CombinedResult combined = combineResult(heuristic, contentSafety, llmResult, policy);
            applyToPoi(poi, combined, policy);
            saveModerationLog(poi, textSnapshot, combined);
        } catch (Exception exception) {
            log.warn("POI moderation failed for poiId={} - {}", poi.getId(), exception.getMessage());
            saveFailedLog(poi, textSnapshot, exception.getMessage());
        }
    }

    public PoiModerationPreviewResponse previewForShopOwner(PoiModerationPreviewRequest request) {
        Poi probe = Poi.builder()
                .name(request == null ? null : request.getName())
                .category(request == null ? null : request.getCategory())
                .address(request == null ? null : request.getAddress())
                .description(request == null ? null : request.getDescription())
                .region(request == null ? null : request.getRegion())
                .build();

        String textSnapshot = buildTextSnapshot(probe);
        ModerationPolicy policy = loadPolicy();
        HeuristicResult heuristic = evaluateHeuristics(probe);
        ContentSafetyResult contentSafety = analyzeByContentSafety(textSnapshot);
        LlmResult llmResult = analyzeByLlm(probe, textSnapshot);
        CombinedResult combined = combineResult(heuristic, contentSafety, llmResult, policy);

        return PoiModerationPreviewResponse.builder()
                .decision(resolveDecision(combined.status()))
                .status(combined.status())
                .riskScore(combined.riskScore())
                .labels(combined.labels())
                .matchedTerms(combined.matchedTerms())
                .reasons(combined.reasons())
                .suggestedRewrite(combined.suggestedRewrite())
                .modelVersion(combined.modelVersion())
                .message(resolveDecisionMessage(combined.status()))
                .build();
    }

    private HeuristicResult evaluateHeuristics(Poi poi) {
        int riskScore = 0;
        List<String> labels = new ArrayList<>();
        List<String> reasons = new ArrayList<>();
        List<String> matchedTerms = new ArrayList<>();

        String description = nullSafe(poi.getDescription());
        if (description.isBlank()) {
            riskScore = Math.max(riskScore, 45);
            labels.add("missing_description");
            reasons.add("Description is empty");
        } else if (description.length() < 20) {
            riskScore = Math.max(riskScore, 25);
            labels.add("short_description");
            reasons.add("Description is too short");
        }

        String snapshot = buildTextSnapshot(poi);
        List<String> prohibitedHits = extractKeywordHits(snapshot, PROHIBITED_KEYWORDS);
        if (!prohibitedHits.isEmpty()) {
            // Profanity list is an early warning signal; final hard-block is decided by AI or PII rules.
            riskScore = Math.max(riskScore, 55);
            labels.add("prohibited_keyword");
            reasons.add("Contains prohibited words");
            matchedTerms.addAll(prohibitedHits);
        }

        List<String> sensitiveDataHits = extractKeywordHits(snapshot, SENSITIVE_DATA_KEYWORDS);
        if (!sensitiveDataHits.isEmpty()) {
            riskScore = Math.max(riskScore, 75);
            labels.add("sensitive_data_keyword");
            reasons.add("Contains sensitive personal information keywords");
            matchedTerms.addAll(sensitiveDataHits);
        }
        if (URL_PATTERN.matcher(snapshot).find()) {
            riskScore = Math.max(riskScore, 35);
            labels.add("contains_url");
            reasons.add("Contains URL");
            matchedTerms.addAll(extractRegexMatches(URL_PATTERN, snapshot));
        }
        if (PHONE_PATTERN.matcher(snapshot).find()) {
            riskScore = Math.max(riskScore, 75);
            labels.add("contains_phone");
            reasons.add("Contains phone number");
            matchedTerms.addAll(extractRegexMatches(PHONE_PATTERN, snapshot));
        }
        if (EMAIL_PATTERN.matcher(snapshot).find()) {
            riskScore = Math.max(riskScore, 75);
            labels.add("contains_email");
            reasons.add("Contains email");
            matchedTerms.addAll(extractRegexMatches(EMAIL_PATTERN, snapshot));
        }
        if (NATIONAL_ID_PATTERN.matcher(snapshot).find()) {
            riskScore = Math.max(riskScore, 78);
            labels.add("contains_national_id");
            reasons.add("Contains 12-digit identity number");
            matchedTerms.addAll(extractRegexMatches(NATIONAL_ID_PATTERN, snapshot));
        }
        if (REPEATED_SYMBOL_PATTERN.matcher(snapshot).find()) {
            riskScore = Math.max(riskScore, 40);
            labels.add("symbol_spam");
            reasons.add("Contains repeated symbols");
            matchedTerms.addAll(extractRegexMatches(REPEATED_SYMBOL_PATTERN, snapshot));
        }

        return new HeuristicResult(riskScore, labels, reasons, matchedTerms);
    }

    private ContentSafetyResult analyzeByContentSafety(String text) {
        if (isBlank(text)) {
            return ContentSafetyResult.unavailable();
        }
        if (isBlank(contentSafetyKey) || isBlank(contentSafetyEndpoint)) {
            return ContentSafetyResult.unavailable();
        }

        try {
            String endpoint = trimTrailingSlash(contentSafetyEndpoint)
                    + "/contentsafety/text:analyze?api-version="
                    + URLEncoder.encode(contentSafetyApiVersion, StandardCharsets.UTF_8);

            String requestBody = objectMapper.writeValueAsString(Map.of(
                    "text", text,
                    "categories", CONTENT_SAFETY_CATEGORIES,
                    "haltOnBlocklistHit", false,
                    "outputType", "FourSeverityLevels"
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .timeout(Duration.ofSeconds(20))
                    .header("Content-Type", "application/json")
                    .header("Ocp-Apim-Subscription-Key", contentSafetyKey)
                    .header("x-ms-client-request-id", UUID.randomUUID().toString())
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("Content Safety call failed. status={}, body={}", response.statusCode(), response.body());
                return ContentSafetyResult.unavailable();
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode categoriesNode = root.path("categoriesAnalysis");

            int maxSeverity = 0;
            List<String> labels = new ArrayList<>();
            if (categoriesNode.isArray()) {
                for (JsonNode item : categoriesNode) {
                    int severity = item.path("severity").asInt(0);
                    maxSeverity = Math.max(maxSeverity, severity);
                    if (severity > 0) {
                        String category = item.path("category").asText("").trim();
                        if (!category.isEmpty()) {
                            labels.add("content_safety_" + category.toLowerCase(Locale.ROOT));
                        }
                    }
                }
            }

            List<String> matchedTerms = new ArrayList<>();
            JsonNode blockMatchesNode = root.path("blocklistsMatch");
            if (blockMatchesNode.isArray()) {
                for (JsonNode item : blockMatchesNode) {
                    String matched = item.path("blocklistItemText").asText("").trim();
                    if (!matched.isEmpty()) {
                        matchedTerms.add(matched);
                    }
                }
            }

            int riskScore = severityToRisk(maxSeverity);
            return ContentSafetyResult.available(riskScore, labels, matchedTerms);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            log.warn("Content Safety call interrupted", exception);
            return ContentSafetyResult.unavailable();
        } catch (IOException exception) {
            log.warn("Content Safety call failed unexpectedly", exception);
            return ContentSafetyResult.unavailable();
        }
    }

    private LlmResult analyzeByLlm(Poi poi, String snapshot) {
        if (isBlank(snapshot)) {
            return LlmResult.unavailable();
        }
        if (!"ollama".equalsIgnoreCase(nullSafe(llmProvider))) {
            return LlmResult.unavailable();
        }
        if (isBlank(ollamaBaseUrl) || isBlank(ollamaModel)) {
            return LlmResult.unavailable();
        }

        try {
            String prompt = buildOllamaPrompt(poi, snapshot);
            String systemPrompt = """
                    You are a strict POI moderation assistant for a food-tour application.
                    Return only a valid JSON object and no extra text.
                    Required JSON keys:
                    - isValid (boolean)
                    - riskScore (integer 0-100)
                    - labels (array of strings)
                    - reasons (array of strings)
                    - suggestedRewrite (string)
                    """;

            String body = objectMapper.writeValueAsString(Map.of(
                    "model", ollamaModel,
                    "think", ollamaThink,
                    "stream", false,
                    "messages", List.of(
                            Map.of("role", "system", "content", systemPrompt),
                            Map.of("role", "user", "content", prompt)
                    ),
                    "options", Map.of("temperature", 0.1)
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(trimTrailingSlash(ollamaBaseUrl) + "/api/chat"))
                    .timeout(Duration.ofMillis(Math.max(ollamaTimeoutMs, 3000)))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("Ollama moderation call failed. status={}, body={}", response.statusCode(), response.body());
                return LlmResult.unavailable();
            }

            JsonNode root = objectMapper.readTree(response.body());
            String content = root.path("message").path("content").asText("").trim();
            if (content.isEmpty()) {
                return LlmResult.unavailable();
            }

            String jsonPayload = extractFirstJsonObject(content);
            if (jsonPayload == null) {
                return LlmResult.unavailable();
            }

            JsonNode result = objectMapper.readTree(jsonPayload);
            Integer score = result.has("riskScore") ? result.path("riskScore").asInt() : null;
            boolean isValid = !result.has("isValid") || result.path("isValid").asBoolean(true);
            List<String> labels = toStringList(result.path("labels"));
            List<String> reasons = toStringList(result.path("reasons"));
            String suggestedRewrite = truncate(result.path("suggestedRewrite").asText(""), 2000);

            int normalizedScore;
            if (score == null) {
                normalizedScore = isValid ? 20 : 70;
            } else {
                normalizedScore = clamp(score, 0, 100);
            }
            if (!isValid) {
                normalizedScore = Math.max(normalizedScore, 70);
                labels.add("llm_invalid_content");
            }

            return LlmResult.available(normalizedScore, labels, reasons, suggestedRewrite);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            log.warn("Ollama moderation call interrupted", exception);
            return LlmResult.unavailable();
        } catch (IOException exception) {
            log.warn("Ollama moderation call failed unexpectedly", exception);
            return LlmResult.unavailable();
        }
    }

    private CombinedResult combineResult(
            HeuristicResult heuristic,
            ContentSafetyResult contentSafety,
            LlmResult llmResult,
            ModerationPolicy policy
    ) {
        int riskScore = heuristic.riskScore();
        if (contentSafety.available()) {
            riskScore = Math.max(riskScore, contentSafety.riskScore());
        }
        if (llmResult.available()) {
            riskScore = Math.max(riskScore, llmResult.riskScore());
        }
        riskScore = clamp(riskScore, 0, 100);

        LinkedHashSet<String> labels = new LinkedHashSet<>();
        labels.addAll(heuristic.labels());
        labels.addAll(contentSafety.labels());
        labels.addAll(llmResult.labels());

        LinkedHashSet<String> reasons = new LinkedHashSet<>();
        reasons.addAll(heuristic.reasons());
        reasons.addAll(llmResult.reasons());

        LinkedHashSet<String> matchedTerms = new LinkedHashSet<>();
        matchedTerms.addAll(heuristic.matchedTerms());
        matchedTerms.addAll(contentSafety.matchedTerms());

        String status = STATUS_SAFE;
        boolean piiHardBlock = labels.stream().anyMatch(PII_BLOCKING_LABELS::contains);
        boolean llmHighRisk = llmResult.available() && llmResult.riskScore() >= policy.highThreshold();
        boolean contentSafetyHighRisk = contentSafety.available() && contentSafety.riskScore() >= policy.highThreshold();
        if (piiHardBlock || llmHighRisk || contentSafetyHighRisk) {
            status = STATUS_REVIEW_REQUIRED;
        } else if (riskScore >= policy.lowThreshold() || !labels.isEmpty() || !reasons.isEmpty()) {
            status = STATUS_NEEDS_REVIEW;
        }

        return new CombinedResult(
                riskScore,
                new ArrayList<>(labels),
                new ArrayList<>(reasons),
                llmResult.suggestedRewrite(),
                new ArrayList<>(matchedTerms),
                status,
                buildModelVersion(contentSafety.available(), llmResult.available())
        );
    }

    private void applyToPoi(Poi poi, CombinedResult combined, ModerationPolicy policy) {
        poi.setRiskScore(combined.riskScore());
        poi.setRiskFlag(combined.riskScore() >= policy.lowThreshold() || !combined.labels().isEmpty());

        if (policy.autoFlagEnabled() && STATUS_REVIEW_REQUIRED.equalsIgnoreCase(combined.status())) {
            poi.setStatus(PoiStatus.FLAGGED);
            poi.setRejectionReason(buildRejectionReason(combined.reasons(), combined.riskScore()));
        } else if (poi.getStatus() == null) {
            poi.setStatus(PoiStatus.DRAFT);
        }
    }

    private void saveModerationLog(Poi poi, String textSnapshot, CombinedResult combined) {
        PoiModerationLog logEntry = PoiModerationLog.builder()
                .poi(poi)
                .menuItemId(null)
                .fieldName(FIELD_NAME_POI_DESCRIPTION)
                .textSnapshot(textSnapshot)
                .riskScore(combined.riskScore())
                .labels(truncate(joinList(combined.labels()), 255))
                .matchedTerms(truncate(joinList(combined.matchedTerms()), 255))
                .suggestedRewrite(truncate(combined.suggestedRewrite(), 2000))
                .modelVersion(truncate(combined.modelVersion(), 100))
                .status(truncate(combined.status(), 20))
                .createdAt(LocalDateTime.now())
                .build();
        poiModerationLogRepository.save(logEntry);
    }

    private void saveFailedLog(Poi poi, String textSnapshot, String errorMessage) {
        try {
            PoiModerationLog failedLog = PoiModerationLog.builder()
                    .poi(poi)
                    .menuItemId(null)
                    .fieldName(FIELD_NAME_POI_DESCRIPTION)
                    .textSnapshot(textSnapshot)
                    .riskScore(null)
                    .labels("moderation_error")
                    .matchedTerms(null)
                    .suggestedRewrite(truncate(errorMessage, 2000))
                    .modelVersion("moderation-pipeline")
                    .status(STATUS_FAILED)
                    .createdAt(LocalDateTime.now())
                    .build();
            poiModerationLogRepository.save(failedLog);
        } catch (Exception ignored) {
            log.debug("Cannot persist failed moderation log for poiId={}", poi.getId());
        }
    }

    private ModerationPolicy loadPolicy() {
        int low = readIntSetting("risk_threshold_low", 30, 0, 100);
        int high = readIntSetting("risk_threshold_high", 70, 0, 100);
        if (low > high) {
            int temp = low;
            low = high;
            high = temp;
        }
        boolean autoFlagEnabled = readBooleanSetting("auto_flag_enabled", true);
        return new ModerationPolicy(low, high, autoFlagEnabled);
    }

    private int readIntSetting(String key, int defaultValue, int min, int max) {
        Optional<AdminSetting> setting = adminSettingRepository.findBySettingKey(key);
        if (setting.isEmpty()) {
            return defaultValue;
        }

        try {
            int parsed = Integer.parseInt(nullSafe(setting.get().getSettingValue()).trim());
            return clamp(parsed, min, max);
        } catch (NumberFormatException exception) {
            return defaultValue;
        }
    }

    private boolean readBooleanSetting(String key, boolean defaultValue) {
        Optional<AdminSetting> setting = adminSettingRepository.findBySettingKey(key);
        if (setting.isEmpty()) {
            return defaultValue;
        }
        String rawValue = nullSafe(setting.get().getSettingValue()).trim().toLowerCase(Locale.ROOT);
        if ("true".equals(rawValue)) {
            return true;
        }
        if ("false".equals(rawValue)) {
            return false;
        }
        return defaultValue;
    }

    private String buildTextSnapshot(Poi poi) {
        List<String> parts = new ArrayList<>();
        appendPart(parts, "name", poi.getName());
        appendPart(parts, "category", poi.getCategory());
        appendPart(parts, "address", poi.getAddress());
        appendPart(parts, "description", poi.getDescription());
        appendPart(parts, "region", poi.getRegion());
        return String.join("\n", parts).trim();
    }

    private String buildOllamaPrompt(Poi poi, String snapshot) {
        return """
                Evaluate this POI content for a food-tour platform.
                Focus on:
                1) Safety and policy violations.
                2) Spam/scam/low quality signs.
                3) Whether the content is relevant to a real food POI.

                POI:
                - name: %s
                - category: %s
                - address: %s
                - region: %s
                - description: %s

                full_text:
                %s
                """.formatted(
                safePromptValue(poi.getName()),
                safePromptValue(poi.getCategory()),
                safePromptValue(poi.getAddress()),
                safePromptValue(poi.getRegion()),
                safePromptValue(poi.getDescription()),
                safePromptValue(snapshot)
        );
    }

    private List<String> toStringList(JsonNode node) {
        List<String> values = new ArrayList<>();
        if (!node.isArray()) {
            return values;
        }
        for (JsonNode item : node) {
            String value = item.asText("").trim();
            if (!value.isEmpty()) {
                values.add(truncate(value, 120));
            }
        }
        return values;
    }

    private String extractFirstJsonObject(String text) {
        int start = text.indexOf('{');
        if (start < 0) {
            return null;
        }

        int depth = 0;
        boolean inString = false;
        boolean escaped = false;
        for (int i = start; i < text.length(); i++) {
            char ch = text.charAt(i);
            if (inString) {
                if (escaped) {
                    escaped = false;
                } else if (ch == '\\') {
                    escaped = true;
                } else if (ch == '"') {
                    inString = false;
                }
                continue;
            }

            if (ch == '"') {
                inString = true;
                continue;
            }
            if (ch == '{') {
                depth++;
                continue;
            }
            if (ch == '}') {
                depth--;
                if (depth == 0) {
                    return text.substring(start, i + 1);
                }
            }
        }
        return null;
    }

    private List<String> extractKeywordHits(String text, List<String> keywords) {
        if (isBlank(text) || keywords == null || keywords.isEmpty()) {
            return List.of();
        }
        String normalized = text.toLowerCase(Locale.ROOT);
        LinkedHashSet<String> hits = new LinkedHashSet<>();
        for (String keyword : keywords) {
            if (normalized.contains(keyword.toLowerCase(Locale.ROOT))) {
                hits.add(keyword);
            }
        }
        return new ArrayList<>(hits);
    }

    private List<String> extractRegexMatches(Pattern pattern, String text) {
        if (pattern == null || isBlank(text)) {
            return List.of();
        }
        LinkedHashSet<String> matches = new LinkedHashSet<>();
        var matcher = pattern.matcher(text);
        while (matcher.find()) {
            String matched = nullSafe(matcher.group()).trim();
            if (!matched.isEmpty()) {
                matches.add(truncate(matched, 60));
            }
            if (matches.size() >= 8) {
                break;
            }
        }
        return new ArrayList<>(matches);
    }

    private String resolveDecision(String moderationStatus) {
        if (STATUS_REVIEW_REQUIRED.equalsIgnoreCase(moderationStatus)) {
            return DECISION_BLOCK;
        }
        if (STATUS_NEEDS_REVIEW.equalsIgnoreCase(moderationStatus)) {
            return DECISION_WARN;
        }
        return DECISION_ALLOW;
    }

    private String resolveDecisionMessage(String moderationStatus) {
        if (STATUS_REVIEW_REQUIRED.equalsIgnoreCase(moderationStatus)) {
            return "Mô tả có dấu hiệu vi phạm rõ ràng, vui lòng chỉnh sửa trước khi gửi.";
        }
        if (STATUS_NEEDS_REVIEW.equalsIgnoreCase(moderationStatus)) {
            return "Mô tả có thể chứa nội dung nhạy cảm hoặc chưa phù hợp, bạn nên chỉnh sửa trước khi gửi.";
        }
        return "Nội dung mô tả đang an toàn.";
    }

    private String buildRejectionReason(List<String> reasons, int riskScore) {
        String reasonText = reasons.isEmpty()
                ? "Auto-flagged by AI moderation"
                : "Auto-flagged by AI moderation: " + String.join("; ", reasons);
        return truncate(reasonText + " (riskScore=" + riskScore + ")", 1000);
    }

    private String buildModelVersion(boolean contentSafetyAvailable, boolean llmAvailable) {
        List<String> parts = new ArrayList<>();
        if (contentSafetyAvailable) {
            parts.add("azure-content-safety");
        }
        if (llmAvailable) {
            parts.add("ollama:" + ollamaModel);
        }
        if (parts.isEmpty()) {
            parts.add("heuristic-only");
        }
        return String.join("+", parts);
    }

    private int severityToRisk(int severity) {
        int safeSeverity = clamp(severity, 0, 7);
        return Math.round((safeSeverity / 7.0f) * 100f);
    }

    private void appendPart(List<String> parts, String key, String value) {
        String normalized = nullSafe(value).trim();
        if (!normalized.isEmpty()) {
            parts.add(key + ": " + normalized);
        }
    }

    private String safePromptValue(String value) {
        String normalized = nullSafe(value).trim();
        return normalized.isEmpty() ? "(empty)" : normalized;
    }

    private String joinList(List<String> values) {
        if (values == null || values.isEmpty()) {
            return "";
        }
        LinkedHashSet<String> unique = new LinkedHashSet<>();
        for (String value : values) {
            String normalized = nullSafe(value).trim();
            if (!normalized.isEmpty()) {
                unique.add(normalized);
            }
        }
        return String.join(",", unique);
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

    private String truncate(String value, int maxLength) {
        String normalized = nullSafe(value);
        if (normalized.length() <= maxLength) {
            return normalized;
        }
        return normalized.substring(0, maxLength);
    }

    private int clamp(int value, int min, int max) {
        return Math.min(max, Math.max(min, value));
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String nullSafe(String value) {
        return value == null ? "" : value;
    }

    private record HeuristicResult(
            int riskScore,
            List<String> labels,
            List<String> reasons,
            List<String> matchedTerms
    ) {
    }

    private record ContentSafetyResult(
            boolean available,
            int riskScore,
            List<String> labels,
            List<String> matchedTerms
    ) {
        static ContentSafetyResult available(int riskScore, List<String> labels, List<String> matchedTerms) {
            return new ContentSafetyResult(
                    true,
                    riskScore,
                    labels == null ? List.of() : labels,
                    matchedTerms == null ? List.of() : matchedTerms
            );
        }

        static ContentSafetyResult unavailable() {
            return new ContentSafetyResult(false, 0, List.of(), List.of());
        }
    }

    private record LlmResult(
            boolean available,
            int riskScore,
            List<String> labels,
            List<String> reasons,
            String suggestedRewrite
    ) {
        static LlmResult available(int riskScore, List<String> labels, List<String> reasons, String suggestedRewrite) {
            return new LlmResult(
                    true,
                    riskScore,
                    labels == null ? List.of() : labels,
                    reasons == null ? List.of() : reasons,
                    suggestedRewrite == null ? "" : suggestedRewrite
            );
        }

        static LlmResult unavailable() {
            return new LlmResult(false, 0, List.of(), List.of(), "");
        }
    }

    private record ModerationPolicy(int lowThreshold, int highThreshold, boolean autoFlagEnabled) {
    }

    private record CombinedResult(
            int riskScore,
            List<String> labels,
            List<String> reasons,
            String suggestedRewrite,
            List<String> matchedTerms,
            String status,
            String modelVersion
    ) {
    }
}
