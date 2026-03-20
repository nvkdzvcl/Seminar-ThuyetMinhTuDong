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

public class ShopUpdateRequest {

    String name;

    String address;

    String description;

//     String audioURL;

    Double lat;

    Double lng;

    Integer avgCostPerPerson;

    Integer avgWaitTimeMin;

    Integer avgEatTimeMin;
}
