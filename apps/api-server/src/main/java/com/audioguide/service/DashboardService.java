package com.audioguide.service;

import com.audioguide.dto.dashboardDTO.WeeklyVisitPointResponse;
import com.audioguide.dto.dashboardDTO.WeeklyVisitsResponse;
import com.audioguide.dto.dashboardDTO.OwnerDailyMetricResponse;
import com.audioguide.dto.dashboardDTO.OwnerHomeStatsResponse;
import com.audioguide.dto.dashboardDTO.OwnerInsightsResponse;
import com.audioguide.dto.dashboardDTO.OwnerLanguageMetricResponse;
import com.audioguide.dto.dashboardDTO.OwnerRecentActivityResponse;
import com.audioguide.dto.dashboardDTO.OwnerTopDishMetricResponse;
import com.audioguide.entity.AnalyticsEvent;
import com.audioguide.entity.PoiApprovalHistory;
import com.audioguide.enums.AnalyticsEventType;
import com.audioguide.enums.Status;
import com.audioguide.exception.AppException;
import com.audioguide.exception.ErrorCode;
import com.audioguide.repository.AnalyticsEventRepository;
import com.audioguide.repository.DishRepository;
import com.audioguide.repository.OrderItemRepository;
import com.audioguide.repository.OrderRepository;
import com.audioguide.repository.PoiApprovalHistoryRepository;
import com.audioguide.repository.ShopRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DashboardService {

    OrderRepository orderRepository;
    OrderItemRepository orderItemRepository;
    AnalyticsEventRepository analyticsEventRepository;
    PoiApprovalHistoryRepository poiApprovalHistoryRepository;
    DishRepository dishRepository;
    ShopRepository shopRepository;

    public WeeklyVisitsResponse getWeeklyVisits() {
        LocalDate toDate = LocalDate.now();
        LocalDate fromDate = toDate.minusDays(6);

        List<Object[]> rows = orderRepository.countVisitsByDay(fromDate, toDate);
        Map<LocalDate, Long> visitMap = new HashMap<>();
        for (Object[] row : rows) {
            LocalDate date = (LocalDate) row[0];
            Long visits = (Long) row[1];
            visitMap.put(date, visits);
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM");
        long total = 0L;
        List<WeeklyVisitPointResponse> points = new java.util.ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate day = fromDate.plusDays(i);
            long visits = visitMap.getOrDefault(day, 0L);
            total += visits;
            points.add(WeeklyVisitPointResponse.builder()
                    .date(day.format(formatter))
                    .visits(visits)
                    .build());
        }

        return WeeklyVisitsResponse.builder()
                .totalVisits(total)
                .visitsByDay(points)
                .build();
    }

    public OwnerInsightsResponse getOwnerInsights(Integer ownerId) {
        var shop = shopRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_FOUND));

        List<AnalyticsEventType> engagementEventTypes = List.of(
                AnalyticsEventType.QR_SCAN,
                AnalyticsEventType.AUDIO_PLAY_START,
                AnalyticsEventType.AUDIO_PLAY_COMPLETE
        );

        LocalDate toDate = LocalDate.now();
        LocalDate fromDate = toDate.minusDays(6);
        LocalDateTime rangeFrom = fromDate.atStartOfDay();
        LocalDateTime rangeTo = LocalDateTime.now();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM");
        long totalVisits = 0L;
        long totalAudioCompletions = 0L;
        List<OwnerDailyMetricResponse> dailyMetrics = new java.util.ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate day = fromDate.plusDays(i);
            LocalDateTime dayFrom = day.atStartOfDay();
            LocalDateTime dayTo = day.equals(toDate)
                    ? rangeTo
                    : day.plusDays(1).atStartOfDay().minusNanos(1);

            long visits = analyticsEventRepository.countDistinctSessionIdByShopIdAndEventTypeInAndOccurredAtBetween(
                    shop.getId(),
                    engagementEventTypes,
                    dayFrom,
                    dayTo
            );
            long audioCompletions = analyticsEventRepository.countByShopIdAndEventTypeAndOccurredAtBetween(
                    shop.getId(),
                    AnalyticsEventType.AUDIO_PLAY_COMPLETE,
                    dayFrom,
                    dayTo
            );

            totalVisits += visits;
            totalAudioCompletions += audioCompletions;

            dailyMetrics.add(OwnerDailyMetricResponse.builder()
                    .date(day.format(formatter))
                    .visits(visits)
                    .audioCompletions(audioCompletions)
                    .build());
        }

        long avgDailyVisits = Math.round(totalVisits / 7.0d);
        long uniqueSessions = analyticsEventRepository.countDistinctSessionIdByShopIdAndEventTypeInAndOccurredAtBetween(
                shop.getId(),
                engagementEventTypes,
                rangeFrom,
                rangeTo
        );

        LocalDate previousToDate = fromDate.minusDays(1);
        LocalDate previousFromDate = previousToDate.minusDays(6);
        long previousTotalVisits = 0L;
        for (int i = 0; i < 7; i++) {
            LocalDate day = previousFromDate.plusDays(i);
            LocalDateTime dayFrom = day.atStartOfDay();
            LocalDateTime dayTo = day.plusDays(1).atStartOfDay().minusNanos(1);
            previousTotalVisits += analyticsEventRepository.countDistinctSessionIdByShopIdAndEventTypeInAndOccurredAtBetween(
                    shop.getId(),
                    engagementEventTypes,
                    dayFrom,
                    dayTo
            );
        }

        int growthPercent;
        if (previousTotalVisits <= 0L) {
            growthPercent = totalVisits > 0L ? 100 : 0;
        } else {
            growthPercent = (int) Math.round(((totalVisits - previousTotalVisits) * 100.0d) / previousTotalVisits);
        }

        List<OwnerLanguageMetricResponse> languageMetrics = analyticsEventRepository
                .countLanguageUsageByEventType(shop.getId(), engagementEventTypes, rangeFrom, rangeTo)
                .stream()
                .map(row -> OwnerLanguageMetricResponse.builder()
                        .language(normalizeLanguage(row[0]))
                        .count(((Number) row[1]).longValue())
                        .build())
                .limit(6)
                .toList();

        List<OwnerTopDishMetricResponse> topDishMetrics = analyticsEventRepository
                .findTopAudioDishesByShop(shop.getId(), rangeFrom, rangeTo)
                .stream()
                .map(row -> OwnerTopDishMetricResponse.builder()
                        .dishName(row[0] == null ? "Khác" : row[0].toString())
                        .quantity(((Number) row[1]).longValue())
                        .build())
                .toList();

        return OwnerInsightsResponse.builder()
                .shopId(shop.getId())
                .totalVisits7Days(totalVisits)
                .avgDailyVisits(avgDailyVisits)
                .totalAudioCompletions7Days(totalAudioCompletions)
                .uniqueSessions7Days(uniqueSessions)
                .growthPercent(growthPercent)
                .dailyMetrics(dailyMetrics)
                .languageMetrics(languageMetrics)
                .topDishMetrics(topDishMetrics)
                .build();
    }

    public OwnerHomeStatsResponse getOwnerHomeStats(Integer ownerId) {
        var shop = shopRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_FOUND));

        Integer shopId = shop.getId();
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalDateTime startOfToday = today.atStartOfDay();

        long qrScansToday = analyticsEventRepository.countByShopIdAndEventTypeAndOccurredAtBetween(
                shopId,
                AnalyticsEventType.QR_SCAN,
                startOfToday,
                now
        );

        long audioPlaysToday = analyticsEventRepository.countByShopIdAndEventTypeAndOccurredAtBetween(
                shopId,
                AnalyticsEventType.AUDIO_PLAY_COMPLETE,
                startOfToday,
                now
        );

        LocalDateTime rangeFrom = now.minusDays(30);
        String topLanguage = pickTopLanguageForHome(shopId, rangeFrom, now);
        String topDish = pickTopDishForHome(shopId, rangeFrom, now);
        List<OwnerRecentActivityResponse> recentActivities = buildOwnerRecentActivities(shopId);

        return OwnerHomeStatsResponse.builder()
                .shopId(shopId)
                .qrScansToday(qrScansToday)
                .audioPlaysToday(audioPlaysToday)
                .topLanguage(topLanguage)
                .topDish(topDish)
                .recentActivities(recentActivities)
                .build();
    }

    private String normalizeLanguage(Object rawLanguage) {
        if (rawLanguage == null) {
            return "Unknown";
        }

        String value = rawLanguage.toString().trim();
        if (value.isEmpty() || "unknown".equalsIgnoreCase(value)) {
            return "Unknown";
        }

        String normalized = value.replace('_', '-');
        if (normalized.length() <= 3) {
            return normalized.toUpperCase(Locale.ROOT);
        }
        return normalized;
    }

    private String pickTopLanguageForHome(Integer shopId, LocalDateTime fromDate, LocalDateTime toDate) {
        List<AnalyticsEventType> audioEventTypes = List.of(
                AnalyticsEventType.AUDIO_PLAY_START,
                AnalyticsEventType.AUDIO_PLAY_COMPLETE
        );

        var eventLanguageRows = analyticsEventRepository.countLanguageUsageByEventType(
                shopId,
                audioEventTypes,
                fromDate,
                toDate
        );
        if (!eventLanguageRows.isEmpty()) {
            return normalizeLanguage(eventLanguageRows.get(0)[0]);
        }

        LocalDate fallbackFromDate = toDate.toLocalDate().minusDays(6);
        var orderLanguageRows = orderRepository.countLanguageUsageForShop(shopId, fallbackFromDate, toDate.toLocalDate());
        if (!orderLanguageRows.isEmpty()) {
            return normalizeLanguage(orderLanguageRows.get(0)[0]);
        }
        return "Unknown";
    }

    private String pickTopDishForHome(Integer shopId, LocalDateTime fromDate, LocalDateTime toDate) {
        var eventDishRows = analyticsEventRepository.findTopAudioDishByShop(shopId, fromDate, toDate);
        if (!eventDishRows.isEmpty()) {
            Object dishName = eventDishRows.get(0)[0];
            if (dishName != null && !dishName.toString().isBlank()) {
                return dishName.toString();
            }
        }

        LocalDate fallbackFromDate = toDate.toLocalDate().minusDays(6);
        var orderDishRows = orderItemRepository.findTopDishesByShop(shopId, fallbackFromDate, toDate.toLocalDate(), PageRequest.of(0, 1));
        if (!orderDishRows.isEmpty()) {
            Object dishName = orderDishRows.get(0)[0];
            if (dishName != null && !dishName.toString().isBlank()) {
                return dishName.toString();
            }
        }

        return "Khác";
    }

    private List<OwnerRecentActivityResponse> buildOwnerRecentActivities(Integer shopId) {
        List<OwnerRecentActivityResponse> mergedActivities = new ArrayList<>();

        List<AnalyticsEvent> latestEvents = analyticsEventRepository.findTop20ByShopIdOrderByOccurredAtDesc(shopId);
        Set<Integer> dishIds = new HashSet<>();
        for (AnalyticsEvent event : latestEvents) {
            if (event.getDishId() != null) {
                dishIds.add(event.getDishId());
            }
        }

        Map<Integer, String> dishNameById = new HashMap<>();
        if (!dishIds.isEmpty()) {
            dishRepository.findAllById(dishIds).forEach(dish -> dishNameById.put(dish.getId(), dish.getName()));
        }

        for (AnalyticsEvent event : latestEvents) {
            mergedActivities.add(mapAnalyticsEventToActivity(event, dishNameById));
        }

        List<PoiApprovalHistory> approvalHistories = poiApprovalHistoryRepository.findTop10ByShopIdOrderBySubmittedAtDesc(shopId);
        for (PoiApprovalHistory history : approvalHistories) {
            mergedActivities.add(mapApprovalHistoryToActivity(history));
        }

        return mergedActivities.stream()
                .sorted(Comparator.comparing(OwnerRecentActivityResponse::getOccurredAt).reversed())
                .limit(8)
                .toList();
    }

    private OwnerRecentActivityResponse mapAnalyticsEventToActivity(
            AnalyticsEvent event,
            Map<Integer, String> dishNameById
    ) {
        String title;
        String subtitle;

        switch (event.getEventType()) {
            case QR_SCAN -> {
                title = "Khách quét mã QR";
                subtitle = formatEventLanguage(event.getLanguageCode());
            }
            case AUDIO_PLAY_START -> {
                title = "Bắt đầu phát audio";
                subtitle = resolveAudioSubtitle(event, dishNameById);
            }
            case AUDIO_PLAY_COMPLETE -> {
                title = "Audio phát xong";
                subtitle = resolveAudioSubtitle(event, dishNameById);
            }
            case AUDIO_PLAY_ERROR -> {
                title = "Lỗi phát audio";
                subtitle = resolveAudioSubtitle(event, dishNameById);
            }
            default -> {
                title = "Sự kiện mới";
                subtitle = "Có hoạt động mới từ khách";
            }
        }

        return OwnerRecentActivityResponse.builder()
                .type(event.getEventType().name())
                .title(title)
                .subtitle(subtitle)
                .occurredAt(event.getOccurredAt())
                .build();
    }

    private OwnerRecentActivityResponse mapApprovalHistoryToActivity(PoiApprovalHistory history) {
        String normalizedStatus = history.getStatus() == null ? "" : history.getStatus().trim().toLowerCase(Locale.ROOT);
        String title;
        String subtitle;
        String type;

        switch (normalizedStatus) {
            case "approved" -> {
                type = "POI_APPROVED";
                title = "POI đã được duyệt";
                subtitle = history.getReviewer() == null || history.getReviewer().isBlank()
                        ? "Admin đã chấp nhận nội dung POI"
                        : "Duyệt bởi " + history.getReviewer();
            }
            case "rejected" -> {
                type = "POI_REJECTED";
                title = "POI cần chỉnh sửa";
                subtitle = history.getReason() == null || history.getReason().isBlank()
                        ? "Admin yêu cầu cập nhật lại nội dung"
                        : history.getReason();
            }
            default -> {
                type = "POI_PENDING";
                title = "Đã gửi duyệt POI";
                subtitle = "Nội dung đang chờ admin xem xét";
            }
        }

        LocalDateTime occurredAt = history.getReviewedAt() != null
                ? history.getReviewedAt()
                : history.getSubmittedAt();

        return OwnerRecentActivityResponse.builder()
                .type(type)
                .title(title)
                .subtitle(subtitle)
                .occurredAt(occurredAt)
                .build();
    }

    private String resolveAudioSubtitle(AnalyticsEvent event, Map<Integer, String> dishNameById) {
        Integer dishId = event.getDishId();
        if (dishId != null) {
            String dishName = dishNameById.getOrDefault(dishId, "món #" + dishId);
            return "Món " + dishName;
        }
        return "Audio giới thiệu quán";
    }

    private String formatEventLanguage(String languageCode) {
        String normalized = normalizeLanguage(languageCode);
        if ("Unknown".equalsIgnoreCase(normalized)) {
            return "Ngôn ngữ chưa xác định";
        }
        return "Ngôn ngữ: " + normalized;
    }
}
