package com.audioguide.dto.dishDTO;

import com.audioguide.enums.Status;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DishResponse {

    Integer id;

    Integer shopId;

    String name;

    String description;

    String type;

    Double price;

    Boolean isSignature;

    String image;

    LocalDate createdAt;

    Status status;
}