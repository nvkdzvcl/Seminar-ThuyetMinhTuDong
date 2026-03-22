package com.audioguide.service;

import com.audioguide.dto.dashboardDTO.WeeklyVisitPointResponse;
import com.audioguide.dto.dashboardDTO.WeeklyVisitsResponse;
import com.audioguide.repository.OrderRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DashboardService {

    OrderRepository orderRepository;

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
}
