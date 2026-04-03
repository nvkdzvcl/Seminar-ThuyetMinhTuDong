package com.audioguide.service;

import com.audioguide.utils.FileStoreUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.client.config.ClientOverrideConfiguration;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.InputStream;
import java.net.URI;
import java.nio.file.Path;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.UUID;

@Service
@Slf4j
public class MediaStorageService {

    @Value("${r2.bucket:}")
    String bucket;

    @Value("${r2.endpoint:}")
    String endpoint;

    @Value("${r2.access-key-id:}")
    String accessKeyId;

    @Value("${r2.secret-access-key:}")
    String secretAccessKey;

    @Value("${r2.region:auto}")
    String region;

    @Value("${r2.public-base-url:}")
    String publicBaseUrl;

    public String storeImage(MultipartFile file, Path localDir, String remoteFolder) {
        log.info("storeImage called. fileSize={}, originalName={}, remoteFolder={}, r2Configured={}",
                file.getSize(), file.getOriginalFilename(), remoteFolder, isR2Configured());

        if (isR2Configured()) {
            try {
                return uploadToR2(file, remoteFolder);
            } catch (Exception exception) {
                log.warn("R2 unavailable, falling back to local storage. reason={}", exception.getMessage());
            }
        } else {
            log.warn("R2 is NOT configured. bucket={}, endpoint={}, accessKeyId={}, publicBaseUrl={}",
                    hasText(normalizeConfigValue(bucket)),
                    hasText(normalizeConfigValue(endpoint)),
                    hasText(normalizeConfigValue(accessKeyId)),
                    hasText(normalizeConfigValue(publicBaseUrl)));
        }

        log.info("Falling back to local storage. localDir={}", localDir);
        return FileStoreUtil.saveKeepingNameWithSuffix(file, localDir);
    }

    private String uploadToR2(MultipartFile file, String remoteFolder) {
        String resolvedBucket = normalizeConfigValue(bucket);
        String resolvedEndpoint = normalizeConfigValue(endpoint);
        String key = buildObjectKey(file, remoteFolder);
        String contentType = file.getContentType() == null ? "application/octet-stream" : file.getContentType();

        log.info("Uploading to R2. endpoint={}, bucket={}, key={}, contentType={}, size={}",
                resolvedEndpoint, resolvedBucket, key, contentType, file.getSize());

        try (S3Client s3Client = buildS3Client();
             InputStream inputStream = file.getInputStream()) {

            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(resolvedBucket)
                    .key(key)
                    .contentType(contentType)
                    .build();

            s3Client.putObject(request, RequestBody.fromInputStream(inputStream, file.getSize()));
            String publicUrl = resolvePublicUrl(key);
            log.info("Uploaded media to R2 bucket {}, key {}", resolvedBucket, key);
            return publicUrl;
        } catch (Exception exception) {
            log.error("R2 upload failed. endpoint={}, bucket={}, key={}, reason={}",
                    resolvedEndpoint, resolvedBucket, key, exception.getMessage(), exception);
            throw new RuntimeException("Upload image to R2 failed", exception);
        }
    }

    private S3Client buildS3Client() {
        String resolvedEndpoint = normalizeConfigValue(endpoint);
        String resolvedAccessKeyId = normalizeConfigValue(accessKeyId);
        String resolvedSecretAccessKey = normalizeConfigValue(secretAccessKey);
        return S3Client.builder()
                .endpointOverride(URI.create(resolvedEndpoint))
                .credentialsProvider(
                        StaticCredentialsProvider.create(AwsBasicCredentials.create(resolvedAccessKeyId, resolvedSecretAccessKey))
                )
                .region(Region.of(resolveRegion()))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .overrideConfiguration(ClientOverrideConfiguration.builder()
                        .apiCallTimeout(Duration.ofSeconds(30))
                        .apiCallAttemptTimeout(Duration.ofSeconds(15))
                        .build())
                .build();
    }

    private String resolvePublicUrl(String key) {
        String normalizedBase = trimTrailingSlash(normalizeConfigValue(publicBaseUrl));
        if (normalizedBase.isEmpty()) {
            throw new IllegalStateException("R2_PUBLIC_BASE_URL is required when R2 is configured");
        }
        return normalizedBase + "/" + key;
    }

    private String buildObjectKey(MultipartFile file, String remoteFolder) {
        String folder = trimSlashes(remoteFolder);
        if (folder.isEmpty()) {
            folder = "uploads";
        }

        String extension = extractExtension(file.getOriginalFilename());
        String dateSegment = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        return folder + "/" + dateSegment + "/" + UUID.randomUUID() + extension;
    }

    private String extractExtension(String originalFileName) {
        String fileName = normalizeOriginalFilename(originalFileName);
        if (fileName.isBlank()) {
            return "";
        }

        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) {
            return "";
        }

        String extension = fileName.substring(dot).toLowerCase(Locale.ROOT);
        if (!extension.matches("\\.[a-z0-9]{1,10}")) {
            return "";
        }
        return extension;
    }

    private String normalizeOriginalFilename(String originalFileName) {
        if (originalFileName == null || originalFileName.isBlank()) {
            return "";
        }
        String normalized = originalFileName.replace('\\', '/');
        int slashIndex = normalized.lastIndexOf('/');
        String fileName = slashIndex >= 0 ? normalized.substring(slashIndex + 1) : normalized;
        return fileName.trim();
    }

    private String resolveRegion() {
        String normalizedRegion = normalizeConfigValue(region);
        return normalizedRegion.isEmpty() ? "auto" : normalizedRegion;
    }

    private boolean isR2Configured() {
        return hasText(normalizeConfigValue(bucket))
                && hasText(normalizeConfigValue(endpoint))
                && hasText(normalizeConfigValue(accessKeyId))
                && hasText(normalizeConfigValue(secretAccessKey))
                && hasText(normalizeConfigValue(publicBaseUrl));
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private String normalizeConfigValue(String value) {
        if (value == null) {
            return "";
        }

        String normalized = value.trim();
        if (normalized.length() >= 2) {
            boolean wrappedByDoubleQuotes = normalized.startsWith("\"") && normalized.endsWith("\"");
            boolean wrappedBySingleQuotes = normalized.startsWith("'") && normalized.endsWith("'");
            if (wrappedByDoubleQuotes || wrappedBySingleQuotes) {
                normalized = normalized.substring(1, normalized.length() - 1).trim();
            }
        }

        return normalized;
    }

    private String trimTrailingSlash(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("/+$", "");
    }

    private String trimSlashes(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("^/+|/+$", "");
    }
}
