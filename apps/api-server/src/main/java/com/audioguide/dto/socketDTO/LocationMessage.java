package com.audioguide.dto.socketDTO;

import lombok.Data;

@Data
public class LocationMessage {
    private double lat;
    private double lng;
    private double radius;
}