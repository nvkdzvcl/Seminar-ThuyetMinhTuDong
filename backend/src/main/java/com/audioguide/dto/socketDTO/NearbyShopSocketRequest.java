package com.audioguide.dto.socketDTO;


import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class NearbyShopSocketRequest {
    Double lat;
    Double lng;
    Double radius;
    Integer page;
    Integer size;
}
