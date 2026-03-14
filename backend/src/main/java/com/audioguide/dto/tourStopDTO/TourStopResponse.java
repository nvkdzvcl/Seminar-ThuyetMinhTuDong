package com.audioguide.dto.tourStopDTO;


import com.audioguide.dto.tourStopItemDTP.TourStopItemResponse;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TourStopResponse {


    Integer Id;
    Integer tourPlanId;
    Integer shopId;
    Integer stopIndex;
    Integer plannedCost;
    Integer timeToSpendInMinutes;

    List<TourStopItemResponse> tourStopItems;

}
