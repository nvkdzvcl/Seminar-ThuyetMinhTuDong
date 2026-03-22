package com.audioguide.service;

import com.audioguide.dto.apiDTO.PagingDto;
import com.audioguide.dto.poiDTO.PoiCreateRequest;
import com.audioguide.dto.poiDTO.PoiResponse;
import com.audioguide.dto.poiDTO.PoiStatusUpdateRequest;
import com.audioguide.dto.poiDTO.PoiUpdateRequest;
import com.audioguide.entity.Poi;
import com.audioguide.enums.PoiStatus;
import com.audioguide.exception.AppException;
import com.audioguide.exception.ErrorCode;
import com.audioguide.repository.PoiRepository;
import com.audioguide.repository.ShopRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PoiService {

    PoiRepository poiRepository;
    ShopRepository shopRepository;

    public PagingDto<PoiResponse> getAll(
            int page,
            int size,
            String search,
            PoiStatus status,
            String region,
            Boolean hasFlag
    ) {
        var pageable = PageRequest.of(page - 1, size);
        var poiPage = poiRepository.search(
                normalizeBlank(search),
                status,
                normalizeBlank(region),
                hasFlag,
                pageable
        );

        return PagingDto.<PoiResponse>builder()
                .items(poiPage.getContent().stream().map(this::toResponse).toList())
                .totalItems(poiPage.getTotalElements())
                .currentPage(page)
                .pageSize(size)
                .totalPages(poiPage.getTotalPages())
                .build();
    }

    public PoiResponse getById(Integer id) {
        return toResponse(findByIdOrThrow(id));
    }

    public PoiResponse create(PoiCreateRequest request) {
        var shop = shopRepository.findById(request.getShopId())
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_FOUND));
        var now = LocalDateTime.now();
        var poi = Poi.builder()
                .shopId(shop.getId())
                .name(shop.getName())
                .description(null)
                .address(shop.getAddress())
                .lat(shop.getLat())
                .lng(shop.getLng())
                .region(null)
                .category(shop.getShopType() != null ? shop.getShopType().getName() : null)
                .ownerId(shop.getOwner() != null ? shop.getOwner().getId() : null)
                .ownerName(shop.getOwner() != null ? shop.getOwner().getFullName() : null)
                .coverImage(shop.getImageName())
                .riskFlag(Boolean.TRUE.equals(request.getRiskFlag()))
                .riskScore(request.getRiskScore())
                .status(PoiStatus.DRAFT)
                .createdAt(now)
                .updatedAt(now)
                .build();

        return toResponse(poiRepository.save(poi));
    }

    public PoiResponse update(Integer id, PoiUpdateRequest request) {
        var poi = findByIdOrThrow(id);
        var shop = shopRepository.findById(request.getShopId())
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_FOUND));
        poi.setShopId(shop.getId());
        poi.setName(shop.getName());
        poi.setAddress(shop.getAddress());
        poi.setLat(shop.getLat());
        poi.setLng(shop.getLng());
        poi.setCategory(shop.getShopType() != null ? shop.getShopType().getName() : null);
        poi.setOwnerId(shop.getOwner() != null ? shop.getOwner().getId() : null);
        poi.setOwnerName(shop.getOwner() != null ? shop.getOwner().getFullName() : null);
        poi.setCoverImage(shop.getImageName());
        poi.setRiskFlag(Boolean.TRUE.equals(request.getRiskFlag()));
        poi.setRiskScore(request.getRiskScore());
        poi.setUpdatedAt(LocalDateTime.now());
        return toResponse(poiRepository.save(poi));
    }

    public PoiResponse updateStatus(Integer id, PoiStatusUpdateRequest request) {
        var poi = findByIdOrThrow(id);
        poi.setStatus(request.getStatus());
        poi.setUpdatedAt(LocalDateTime.now());
        return toResponse(poiRepository.save(poi));
    }

    public void delete(Integer id) {
        var poi = findByIdOrThrow(id);
        poiRepository.delete(poi);
    }

    private Poi findByIdOrThrow(Integer id) {
        return poiRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.POI_NOT_FOUND));
    }

    private String normalizeBlank(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private PoiResponse toResponse(Poi poi) {
        return PoiResponse.builder()
                .id(poi.getId())
                .shopId(poi.getShopId())
                .name(poi.getName())
                .description(poi.getDescription())
                .address(poi.getAddress())
                .lat(poi.getLat())
                .lng(poi.getLng())
                .region(poi.getRegion())
                .category(poi.getCategory())
                .ownerId(poi.getOwnerId())
                .ownerName(poi.getOwnerName())
                .coverImage(poi.getCoverImage())
                .riskFlag(Boolean.TRUE.equals(poi.getRiskFlag()))
                .riskScore(poi.getRiskScore())
                .status(poi.getStatus())
                .createdAt(poi.getCreatedAt())
                .updatedAt(poi.getUpdatedAt())
                .build();
    }
}
