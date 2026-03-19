package com.audioguide.service;

import com.audioguide.dto.apiDTO.PagingDto;
import com.audioguide.dto.shopDTO.ShopResponse;
import com.audioguide.entity.Shop;
import com.audioguide.enums.Status;
import com.audioguide.exception.AppException;
import com.audioguide.exception.ErrorCode;
import com.audioguide.mapper.ShopMapper;
import com.audioguide.repository.ShopRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;


@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class LocationSocketService {

    ShopRepository shopRepository;
    ShopMapper shopMapper;

    public PagingDto<ShopResponse> getNearbyShops(Double lat, Double lng, Double radius, Integer page, Integer size) {
        validate(lat, lng, radius);

        int currentPage = (page == null || page < 1) ? 1 : page;
        int pageSize = (size == null || size < 1) ? 10 : size;

        var pageable = PageRequest.of(currentPage - 1, pageSize);

        var shopPage = shopRepository.findNearbyShops(
                lat,
                lng,
                radius,
                Status.ACTIVE,
                pageable
        );

        List<ShopResponse> items = shopPage.getContent()
                .stream()
                .map(shopMapper::toShopResponseFromShop)
                .toList();

        return PagingDto.<ShopResponse>builder()
                .items(items)
                .totalItems(shopPage.getTotalElements())
                .currentPage(currentPage)
                .pageSize(pageSize)
                .totalPages(shopPage.getTotalPages())
                .build();
    }

    private void validate(Double lat, Double lng, Double radius) {
        if (lat == null || lng == null) {
            throw new AppException(ErrorCode.REQUEST_BODY_INVALID);
        }

        if (radius == null || radius <= 0) {
            throw new AppException(ErrorCode.REQUEST_BODY_INVALID);
        }
    }


}