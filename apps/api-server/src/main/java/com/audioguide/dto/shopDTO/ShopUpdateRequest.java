package com.audioguide.dto.shopDTO;

import jakarta.validation.constraints.Min;
import lombok.*;
import lombok.experimental.FieldDefaults;



@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)

public class ShopUpdateRequest {

    String name;

    String address;

    String shortDescription;

    String description;

    String detailedDescription;

//     String audioURL;

    Double lat;

    Double lng;

    String coordinateRaw;

    @Min(value = 1, message = "SHOP_AVG_COST_INVALID")
    Integer avgCostPerPerson;

    @Min(value = 1, message = "SHOP_AVG_WAIT_TIME_INVALID")
    Integer avgWaitTimeMin;

    @Min(value = 1, message = "SHOP_AVG_EAT_TIME_INVALID")
    Integer avgEatTimeMin;
}
