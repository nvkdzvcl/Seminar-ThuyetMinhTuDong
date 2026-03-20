package com.audioguide.dto.dishDTO;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DishUpdateRequest {

    String name;

    String description;

    String type;

    Double price;

    Boolean isSignature;
}
