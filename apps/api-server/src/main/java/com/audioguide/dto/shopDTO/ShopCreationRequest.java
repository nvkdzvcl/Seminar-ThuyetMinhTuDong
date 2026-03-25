package com.audioguide.dto.shopDTO;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ShopCreationRequest {

    @NotBlank(message = "SHOP_NAME_BLANK")
    String name;

    @NotBlank(message = "SHOP_ADDRESS_BLANK")
    String address;

    @NotBlank(message = "SHOP_DESCRIPTION_BLANK")
    String description;


//    @NotBlank(message = "SHOP_AUDIO_URL_BLANK")
//    String audioURL;

    Double lat;

    Double lng;

    String coordinateRaw;

    @NotNull(message = "SHOP_AVG_COST_BLANK")
    @Min(value = 1, message = "SHOP_AVG_COST_INVALID")
    Integer avgCostPerPerson;

    @NotNull(message = "SHOP_AVG_WAIT_TIME_BLANK")
    @Min(value = 1, message = "SHOP_AVG_WAIT_TIME_INVALID")
    Integer avgWaitTimeMin;

    @NotNull(message = "SHOP_AVG_EAT_TIME_BLANK")
    @Min(value = 1, message = "SHOP_AVG_EAT_TIME_INVALID")
    Integer avgEatTimeMin;

    Integer shopTypeId;

}
