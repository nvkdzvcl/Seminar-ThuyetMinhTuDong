package com.audioguide.mapper;


import com.audioguide.dto.tourStopDTO.TourStopResponse;
import com.audioguide.entity.TourStop;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;


@Mapper(componentModel = "spring")
public interface TourStopMapper {



    @Mapping(target = "shopId", source = "shop.id")
    @Mapping(target = "tourPlanId", source = "tourPlan.id")
    TourStopResponse toTourStopResponseFromTourStop(TourStop tourStop);

}



