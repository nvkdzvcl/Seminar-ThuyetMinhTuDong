package com.audioguide.utils;


import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;

public class FileStoreUtil {

    public static String saveKeepingNameWithSuffix(MultipartFile file, Path dir) {
        try {
            Files.createDirectories(dir);

            String original = Objects.requireNonNull(file.getOriginalFilename(), "file");
            original = Paths.get(original).getFileName().toString();

            // tách name + ext
            String base = original;
            String ext = "";
            int dot = original.lastIndexOf('.');
            if (dot > 0) {
                base = original.substring(0, dot);
                ext = original.substring(dot);
            }

            Path target = dir.resolve(original).normalize();

            int i = 1;
            while (Files.exists(target)) {
                String candidate = base + "_" + i + ext;
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
}
