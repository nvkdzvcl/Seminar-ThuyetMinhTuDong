package com.audioguide.dto.shopDTO;

import com.audioguide.entity.User;
import com.audioguide.enums.Status;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;



@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)

public class ShopResponse {

    Integer id;
    String ownerId;

    String name;
    String  address;
    String description;
    String imageName;
    String audioURL;
    Double lat;
    Double lng;

    Integer avgCostPerPerson;
    Integer avgWaitTimeMin;
    Integer avgEatTimeMin;
    LocalDate createdAt;
    Status status;

}
