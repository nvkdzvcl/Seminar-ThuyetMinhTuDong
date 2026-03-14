package com.audioguide.mapper;


import com.audioguide.dto.tourPlanDTO.TourPlanCreationRequest;
import com.audioguide.dto.tourPlanDTO.TourPlanResponse;
import com.audioguide.entity.TourPlan;
import org.mapstruct.*;


@Mapper(componentModel = "spring")
public interface TourPlanMapper {


    TourPlan toTourPlanFromTourPlanCreateRequest(TourPlanCreationRequest request);

    @Mapping(target = "customerId", source = "tourPlan.customer.id")
    TourPlanResponse toTourPlanResponseFromTourPlan(TourPlan tourPlan);

}



