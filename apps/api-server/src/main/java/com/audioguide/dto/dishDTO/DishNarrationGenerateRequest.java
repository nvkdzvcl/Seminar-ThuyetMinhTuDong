package com.audioguide.dto.dishDTO;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DishNarrationGenerateRequest {
    String lang;
    String description;
}

