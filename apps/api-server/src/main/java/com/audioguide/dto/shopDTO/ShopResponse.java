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
    String shortDescription;
    String description;
    String detailedDescription;
    String imageName;
    String audioURL;
    Integer shopTypeId;
    String shopTypeName;
    Double lat;
    Double lng;

    Integer avgCostPerPerson;
    Integer avgWaitTimeMin;
    Integer avgEatTimeMin;
    LocalDate createdAt;
    Status status;

}
