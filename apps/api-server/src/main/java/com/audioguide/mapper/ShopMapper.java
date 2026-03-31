package com.audioguide.mapper;


import com.audioguide.dto.shopDTO.ShopCreationRequest;
import com.audioguide.dto.shopDTO.ShopResponse;
import com.audioguide.dto.shopDTO.ShopUpdateRequest;
import com.audioguide.entity.Shop;
import org.mapstruct.*;
import org.springframework.data.domain.Page;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ShopMapper {


    Shop toShopFromShopCreateRequest(ShopCreationRequest request);

    @Mapping(target = "ownerId", source = "shop.owner.id")
    @Mapping(target = "shopTypeId", source = "shop.shopType.id")
    @Mapping(target = "shopTypeName", source = "shop.shopType.name")
    ShopResponse toShopResponseFromShop(Shop shop);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "imageName", ignore = true)
    @Mapping(target = "audioURL", ignore = true)
    void updateShopInfo(@MappingTarget Shop shop, ShopUpdateRequest request);

    List<ShopResponse> toShopResponseFromShopList(List<Shop> shops);
}

