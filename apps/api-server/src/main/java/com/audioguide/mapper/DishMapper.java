package com.audioguide.mapper;

import com.audioguide.dto.dishDTO.DishCreationRequest;
import com.audioguide.dto.dishDTO.DishResponse;
import com.audioguide.dto.dishDTO.DishUpdateRequest;
import com.audioguide.entity.Dish;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring")
public interface DishMapper {

    Dish toDishFromDishCreateRequest(DishCreationRequest request);

    @Mapping(target = "shopId", source = "dish.shop.id")
    DishResponse toDishResponseFromDish(Dish dish);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "image", ignore = true)
    void updateDishInfo(@MappingTarget Dish dish, DishUpdateRequest request);

    List<DishResponse> toDishResponseFromDishList(List<Dish> dishes);
}