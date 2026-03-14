package com.audioguide.dto.tourPlanDTO;


import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TourPlanCreationRequest {

    Integer budgetTotal;

    Integer tourStopCount;

    Integer timeTotalMin;

    Integer peopleCount;

    Integer shopTypeId;
}
