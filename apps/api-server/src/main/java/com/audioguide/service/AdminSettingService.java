package com.audioguide.service;

import com.audioguide.dto.adminDTO.AdminSettingResponse;
import com.audioguide.dto.adminDTO.AdminSettingUpsertRequest;
import com.audioguide.entity.AdminSetting;
import com.audioguide.repository.AdminSettingRepository;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminSettingService {

    AdminSettingRepository adminSettingRepository;

    public List<AdminSettingResponse> getSettings() {
        ensureDefaults();
        return adminSettingRepository.findAllByOrderBySettingKeyAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public List<AdminSettingResponse> upsertSettings(List<AdminSettingUpsertRequest> requests) {
        for (AdminSettingUpsertRequest request : requests) {
            AdminSetting setting = adminSettingRepository.findBySettingKey(request.getKey())
                    .orElseGet(() -> AdminSetting.builder()
                            .settingKey(request.getKey())
                            .build());
            setting.setSettingValue(request.getValue());
            setting.setUpdatedAt(LocalDateTime.now());
            adminSettingRepository.save(setting);
        }
        return getSettings();
    }

    private AdminSettingResponse toResponse(AdminSetting setting) {
        return AdminSettingResponse.builder()
                .key(setting.getSettingKey())
                .value(setting.getSettingValue())
                .updatedAt(setting.getUpdatedAt())
                .build();
    }

    private void ensureDefaults() {
        Map<String, String> defaults = new LinkedHashMap<>();
        defaults.put("request_timeout_seconds", "30");
        defaults.put("default_language", "vi");
        defaults.put("max_upload_size_mb", "10");
        defaults.put("maintenance_mode", "false");
        defaults.put("debug_mode", "false");
        defaults.put("risk_threshold_low", "30");
        defaults.put("risk_threshold_high", "70");
        defaults.put("auto_flag_enabled", "true");
        defaults.put("require_approval_above_threshold", "true");

        for (Map.Entry<String, String> item : defaults.entrySet()) {
            adminSettingRepository.findBySettingKey(item.getKey()).orElseGet(() -> adminSettingRepository.save(
                    AdminSetting.builder()
                            .settingKey(item.getKey())
                            .settingValue(item.getValue())
                            .updatedAt(LocalDateTime.now())
                            .build()
            ));
        }
    }
}
