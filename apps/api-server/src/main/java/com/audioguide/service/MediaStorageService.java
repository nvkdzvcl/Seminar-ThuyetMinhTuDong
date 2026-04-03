package com.audioguide.service;

import com.audioguide.utils.FileStoreUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.InputStream;
import java.net.URI;
import java.nio.file.Path;
import java.nio.file.Paths;
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
        if (isR2Configured()) {
            return uploadToR2(file, remoteFolder);
        }

        return FileStoreUtil.saveKeepingNameWithSuffix(file, localDir);
    }

    private String uploadToR2(MultipartFile file, String remoteFolder) {
        String key = buildObjectKey(file, remoteFolder);
        String contentType = file.getContentType() == null ? "application/octet-stream" : file.getContentType();

        try (S3Client s3Client = buildS3Client();
             InputStream inputStream = file.getInputStream()) {

            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(contentType)
                    .build();

            s3Client.putObject(request, RequestBody.fromInputStream(inputStream, file.getSize()));
            String publicUrl = resolvePublicUrl(key);
            log.info("Uploaded media to R2 bucket {}, key {}", bucket, key);
            return publicUrl;
        } catch (Exception exception) {
            throw new RuntimeException("Upload image to R2 failed", exception);
        }
    }

    private S3Client buildS3Client() {
        return S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(
                        StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKeyId, secretAccessKey))
                )
                .region(Region.of(resolveRegion()))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .build();
    }

    private String resolvePublicUrl(String key) {
        String normalizedBase = trimTrailingSlash(publicBaseUrl);
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
        if (originalFileName == null || originalFileName.isBlank()) {
            return "";
        }
        String fileName = Paths.get(originalFileName).getFileName().toString();
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) {
            return "";
        }
        String extension = fileName.substring(dot).toLowerCase(Locale.ROOT);
        if (extension.length() > 12) {
            return "";
        }
        return extension;
    }

    private String resolveRegion() {
        String normalizedRegion = region == null ? "" : region.trim();
        return normalizedRegion.isEmpty() ? "auto" : normalizedRegion;
    }

    private boolean isR2Configured() {
        return hasText(bucket)
                && hasText(endpoint)
                && hasText(accessKeyId)
                && hasText(secretAccessKey)
                && hasText(publicBaseUrl);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
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
