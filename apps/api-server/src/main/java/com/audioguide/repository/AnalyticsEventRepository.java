package com.audioguide.repository;

import com.audioguide.entity.AnalyticsEvent;
import com.audioguide.enums.AnalyticsEventType;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AnalyticsEventRepository extends JpaRepository<AnalyticsEvent, Long> {
    boolean existsByEventId(String eventId);

    long countByShopIdAndEventTypeAndOccurredAtBetween(
            Integer shopId,
            AnalyticsEventType eventType,
            LocalDateTime fromDate,
            LocalDateTime toDate
    );

    @Query("""
            SELECT COALESCE(NULLIF(TRIM(e.languageCode), ''), 'unknown'), COUNT(e.id)
            FROM AnalyticsEvent e
            WHERE e.shopId = :shopId
            AND e.eventType IN :eventTypes
            AND e.occurredAt BETWEEN :fromDate AND :toDate
            GROUP BY COALESCE(NULLIF(TRIM(e.languageCode), ''), 'unknown')
            ORDER BY COUNT(e.id) DESC
            """)
    List<Object[]> countLanguageUsageByEventType(
            @Param("shopId") Integer shopId,
            @Param("eventTypes") List<AnalyticsEventType> eventTypes,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate
    );

    @Query(value = """
            SELECT COALESCE(d.name, 'Khác') AS dish_name, COUNT(ae.id) AS total
            FROM analytics_event ae
            LEFT JOIN dish d ON d.id = ae.dish_id
            WHERE ae.shop_id = :shopId
            AND ae.event_type = 'AUDIO_PLAY_COMPLETE'
            AND ae.dish_id IS NOT NULL
            AND ae.occurred_at BETWEEN :fromDate AND :toDate
            GROUP BY d.name
            ORDER BY total DESC
            LIMIT 1
            """, nativeQuery = true)
    List<Object[]> findTopAudioDishByShop(
            @Param("shopId") Integer shopId,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate
    );

    List<AnalyticsEvent> findTop20ByShopIdOrderByOccurredAtDesc(Integer shopId);
}
