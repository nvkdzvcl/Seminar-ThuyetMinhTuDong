package com.audioguide.dto.tourStopItemDTP;


import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TourStopItemResponse {

    Integer id;
    Integer tourStopId;
    Integer dishId;
    Integer quantity;
    Integer pricePerUnit;

}
