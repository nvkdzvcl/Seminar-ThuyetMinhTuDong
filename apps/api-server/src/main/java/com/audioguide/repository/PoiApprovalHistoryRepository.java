package com.audioguide.repository;

import com.audioguide.entity.PoiApprovalHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PoiApprovalHistoryRepository extends JpaRepository<PoiApprovalHistory, Integer> {
    List<PoiApprovalHistory> findByShopIdOrderBySubmittedAtDesc(Integer shopId);
    List<PoiApprovalHistory> findTop10ByShopIdOrderBySubmittedAtDesc(Integer shopId);
    List<PoiApprovalHistory> findByPoiIdOrderBySubmittedAtDesc(Integer poiId);
}
