package com.audioguide.repository;

import com.audioguide.entity.AdminSetting;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminSettingRepository extends JpaRepository<AdminSetting, Long> {
    Optional<AdminSetting> findBySettingKey(String settingKey);
    List<AdminSetting> findAllByOrderBySettingKeyAsc();
}
