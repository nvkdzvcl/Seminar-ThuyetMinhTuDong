package com.audioguide.repository;

import com.audioguide.entity.PoiModerationLog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PoiModerationLogRepository extends JpaRepository<PoiModerationLog, Integer> {
    List<PoiModerationLog> findByPoi_IdOrderByCreatedAtDesc(Integer poiId);
}
