package com.audioguide.dto.tourPlanDTO;


import com.audioguide.dto.tourStopDTO.TourStopResponse;
import com.audioguide.enums.Status;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TourPlanResponse {

    Integer id;

    Integer customerId;

    Integer budgetTotal;

    Integer tourStopCount;

    Integer timeTotalMin;

    Integer peopleCount;

    Integer estCost;

    LocalDate createdAt;

    Status status;

    List<TourStopResponse> tourStops;

}
