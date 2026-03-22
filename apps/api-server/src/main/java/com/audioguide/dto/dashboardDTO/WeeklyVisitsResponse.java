package com.audioguide.dto.dashboardDTO;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WeeklyVisitsResponse {
    Long totalVisits;
    List<WeeklyVisitPointResponse> visitsByDay;
}
