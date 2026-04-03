package com.audioguide.utils;


import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;

public class FileStoreUtil {

    public static String saveKeepingNameWithSuffix(MultipartFile file, Path dir) {
        try {
            Files.createDirectories(dir);

            String original = normalizeOriginalFilename(file.getOriginalFilename());
            String extension = extractExtension(original);
            String baseName = sanitizeBaseName(stripExtension(original));

            if (baseName.isBlank()) {
                baseName = "file";
            }

            Path target = dir.resolve(baseName + extension).normalize();

            int i = 1;
            while (Files.exists(target)) {
                String candidate = baseName + "_" + i + extension;
                target = dir.resolve(candidate).normalize();
                i++;
            }

            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return target.getFileName().toString();
        } catch (IOException e) {
            throw new RuntimeException("Save file failed", e);
        }
    }

    public static void deleteIfExists(Path dir, String fileName) {
        if (fileName == null || fileName.isBlank()) return;
        try {
            Path p = dir.resolve(fileName).normalize();
            Files.deleteIfExists(p);
        } catch (IOException e) {
            throw new RuntimeException("Delete file failed", e);
        }
    }

    private static String normalizeOriginalFilename(String originalFileName) {
        if (originalFileName == null || originalFileName.isBlank()) {
            return "file";
        }

        String normalized = originalFileName.replace('\\', '/');
        int slashIndex = normalized.lastIndexOf('/');
        String fileName = slashIndex >= 0 ? normalized.substring(slashIndex + 1) : normalized;
        fileName = fileName.trim();
        return fileName.isBlank() ? "file" : fileName;
    }

    private static String stripExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex <= 0) {
            return fileName;
        }
        return fileName.substring(0, dotIndex);
    }

    private static String extractExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex <= 0 || dotIndex == fileName.length() - 1) {
            return "";
        }

        String extension = fileName.substring(dotIndex).toLowerCase(Locale.ROOT);
        if (!extension.matches("\\.[a-z0-9]{1,10}")) {
            return "";
        }
        return extension;
    }

    private static String sanitizeBaseName(String baseName) {
        String sanitized = baseName
                .replace('\\', '_')
                .replace('/', '_')
                .replaceAll("[^A-Za-z0-9._-]", "_")
                .replaceAll("_+", "_")
                .replaceAll("^[_\\-.]+|[_\\-.]+$", "");

        if (sanitized.length() > 100) {
            return sanitized.substring(0, 100);
        }
        return sanitized;
    }
}
