package com.audioguide.dto.shopDTO;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.web.multipart.MultipartFile;

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

    @NotNull(message = "SHOP_LAT_BLANK")
    Double lat;

    @NotNull(message = "SHOP_LNG_BLANK")
    Double lng;

    @NotNull(message = "SHOP_AVG_COST_BLANK")
    Integer avgCostPerPerson;

    @NotNull(message = "SHOP_AVG_WAIT_TIME_BLANK")
    Integer avgWaitTimeMin;

    @NotNull(message = "SHOP_AVG_EAT_TIME_BLANK")
    Integer avgEatTimeMin;

}
