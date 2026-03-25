package com.audioguide.service;

import com.audioguide.dto.apiDTO.PagingDto;
import com.audioguide.dto.poiDTO.PoiCreateRequest;
import com.audioguide.dto.poiDTO.PoiApprovalHistoryItemResponse;
import com.audioguide.dto.poiDTO.PoiDetailResponse;
import com.audioguide.dto.poiDTO.PoiMenuItemResponse;
import com.audioguide.dto.poiDTO.PoiMenuItemUpsertRequest;
import com.audioguide.dto.poiDTO.PoiModerationLogResponse;
import com.audioguide.dto.poiDTO.PoiApprovalSummaryResponse;
import com.audioguide.dto.poiDTO.PoiResponse;
import com.audioguide.dto.poiDTO.PoiStatusUpdateRequest;
import com.audioguide.dto.poiDTO.PoiUpdateRequest;
import com.audioguide.entity.PoiApprovalHistory;
import com.audioguide.entity.Poi;
import com.audioguide.entity.PoiMenuItem;
import com.audioguide.enums.PoiStatus;
import com.audioguide.exception.AppException;
import com.audioguide.exception.ErrorCode;
import com.audioguide.repository.PoiApprovalHistoryRepository;
import com.audioguide.repository.PoiMenuItemRepository;
import com.audioguide.repository.PoiModerationLogRepository;
import com.audioguide.repository.PoiRepository;
import com.audioguide.repository.ShopRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PoiService {

    PoiRepository poiRepository;
    PoiApprovalHistoryRepository poiApprovalHistoryRepository;
    PoiMenuItemRepository poiMenuItemRepository;
    PoiModerationLogRepository poiModerationLogRepository;
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

    public PoiDetailResponse getDetailById(Integer id) {
        Poi poi = findByIdOrThrow(id);
        var menuItems = poiMenuItemRepository.findByPoi_IdOrderByCreatedAtDesc(id)
                .stream()
                .map(this::toMenuItemResponse)
                .toList();
        var moderationLogs = poiModerationLogRepository.findByPoi_IdOrderByCreatedAtDesc(id)
                .stream()
                .map(item -> PoiModerationLogResponse.builder()
                        .id(item.getId())
                        .menuItemId(item.getMenuItemId())
                        .fieldName(item.getFieldName())
                        .textSnapshot(item.getTextSnapshot())
                        .riskScore(item.getRiskScore())
                        .labels(item.getLabels())
                        .matchedTerms(item.getMatchedTerms())
                        .suggestedRewrite(item.getSuggestedRewrite())
                        .modelVersion(item.getModelVersion())
                        .status(item.getStatus())
                        .reviewedBy(item.getReviewedBy())
                        .reviewedAt(item.getReviewedAt())
                        .createdAt(item.getCreatedAt())
                        .build())
                .toList();

        return PoiDetailResponse.builder()
                .poi(toResponse(poi))
                .menuItems(menuItems)
                .moderationLogs(moderationLogs)
                .approvalHistory(getApprovalHistoryByPoiId(id))
                .build();
    }

    public PoiResponse create(PoiCreateRequest request) {
        var shop = shopRepository.findById(request.getShopId())
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_FOUND));
        var now = LocalDateTime.now();
        var poi = Poi.builder()
                .shopId(shop.getId())
                .name(shop.getName())
                .description(request.getDescription())
                .address(shop.getAddress())
                .lat(shop.getLat())
                .lng(shop.getLng())
                .region(request.getRegion())
                .category(request.getCategory() != null ? request.getCategory() :
                        (shop.getShopType() != null ? shop.getShopType().getName() : null))
                .ownerId(shop.getOwner() != null ? shop.getOwner().getId() : null)
                .ownerName(shop.getOwner() != null ? shop.getOwner().getFullName() : null)
                .coverImage(shop.getImageName())
                .qrCode(null)
                .riskFlag(Boolean.TRUE.equals(request.getRiskFlag()))
                .riskScore(request.getRiskScore())
                .rejectionReason(null)
                .status(PoiStatus.DRAFT)
                .createdAt(now)
                .updatedAt(now)
                .build();
        var saved = poiRepository.save(poi);
        saveHistory(saved.getShopId(), saved.getId(), "pending", null, null);
        return toResponse(saved);
    }

    public PoiResponse update(Integer id, PoiUpdateRequest request) {
        var poi = findByIdOrThrow(id);
        var shop = shopRepository.findById(request.getShopId())
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_FOUND));
        poi.setShopId(shop.getId());
        poi.setName(shop.getName());
        poi.setDescription(request.getDescription());
        poi.setAddress(shop.getAddress());
        poi.setLat(shop.getLat());
        poi.setLng(shop.getLng());
        poi.setRegion(request.getRegion());
        poi.setCategory(request.getCategory() != null ? request.getCategory() :
                (shop.getShopType() != null ? shop.getShopType().getName() : null));
        poi.setOwnerId(shop.getOwner() != null ? shop.getOwner().getId() : null);
        poi.setOwnerName(shop.getOwner() != null ? shop.getOwner().getFullName() : null);
        poi.setCoverImage(shop.getImageName());
        poi.setQrCode(request.getQrCode());
        poi.setRiskFlag(Boolean.TRUE.equals(request.getRiskFlag()));
        poi.setRiskScore(request.getRiskScore());
        poi.setUpdatedAt(LocalDateTime.now());
        return toResponse(poiRepository.save(poi));
    }

    public PoiResponse updateStatus(Integer id, PoiStatusUpdateRequest request) {
        var poi = findByIdOrThrow(id);
        var normalizedReason = normalizeBlank(request.getReason());
        poi.setStatus(request.getStatus());
        if (request.getStatus() == PoiStatus.FLAGGED || request.getStatus() == PoiStatus.HIDDEN) {
            poi.setRejectionReason(normalizedReason);
            saveHistory(poi.getShopId(), poi.getId(), "rejected", "Admin", normalizedReason);
        } else if (request.getStatus() == PoiStatus.PUBLISHED) {
            poi.setRejectionReason(null);
            saveHistory(poi.getShopId(), poi.getId(), "approved", "Admin", null);
        }
        poi.setUpdatedAt(LocalDateTime.now());
        return toResponse(poiRepository.save(poi));
    }

    public PoiApprovalSummaryResponse getApprovalSummaryByShopId(Integer shopId) {
        var shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_FOUND));
        var poiOptional = poiRepository.findByShopId(shopId);
        var history = poiApprovalHistoryRepository.findByShopIdOrderBySubmittedAtDesc(shopId);
        if (poiOptional.isEmpty()) {
            return PoiApprovalSummaryResponse.builder()
                    .shopId(shopId)
                    .status("unregistered")
                    .history(history.stream().map(this::toHistoryResponse).toList())
                    .build();
        }

        var poi = poiOptional.get();
        return PoiApprovalSummaryResponse.builder()
                .shopId(shop.getId())
                .poiId(poi.getId())
                .status(mapToOwnerStatus(poi.getStatus()))
                .rejectionReason(poi.getRejectionReason())
                .history(history.stream().map(this::toHistoryResponse).toList())
                .build();
    }

    public PoiApprovalSummaryResponse submitRegistration(Integer shopId) {
        var shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_FOUND));
        var now = LocalDateTime.now();
        var poi = poiRepository.findByShopId(shopId).orElseGet(() -> Poi.builder()
                .region(null)
                .qrCode(null)
                .riskFlag(false)
                .riskScore(null)
                .createdAt(now)
                .build());

        poi.setShopId(shop.getId());
        poi.setName(shop.getName());
        poi.setDescription(shop.getDescription());
        poi.setAddress(shop.getAddress());
        poi.setLat(shop.getLat());
        poi.setLng(shop.getLng());
        poi.setCategory(shop.getShopType() != null ? shop.getShopType().getName() : null);
        poi.setOwnerId(shop.getOwner() != null ? shop.getOwner().getId() : null);
        poi.setOwnerName(shop.getOwner() != null ? shop.getOwner().getFullName() : null);
        poi.setCoverImage(shop.getImageName());
        poi.setStatus(PoiStatus.DRAFT);
        poi.setRejectionReason(null);
        poi.setUpdatedAt(now);
        var saved = poiRepository.save(poi);
        saveHistory(shopId, saved.getId(), "pending", null, null);
        return getApprovalSummaryByShopId(shopId);
    }

    public List<PoiApprovalHistoryItemResponse> getApprovalHistoryByPoiId(Integer poiId) {
        findByIdOrThrow(poiId);
        return poiApprovalHistoryRepository.findByPoiIdOrderBySubmittedAtDesc(poiId)
                .stream()
                .map(this::toHistoryResponse)
                .toList();
    }

    public List<PoiMenuItemResponse> getMenuItemsByPoiId(Integer poiId) {
        findByIdOrThrow(poiId);
        return poiMenuItemRepository.findByPoi_IdOrderByCreatedAtDesc(poiId)
                .stream()
                .map(this::toMenuItemResponse)
                .toList();
    }

    public PoiMenuItemResponse createMenuItem(Integer poiId, PoiMenuItemUpsertRequest request) {
        Poi poi = findByIdOrThrow(poiId);
        var now = LocalDateTime.now();
        PoiMenuItem item = PoiMenuItem.builder()
                .poi(poi)
                .name(request.getName())
                .descriptionText(request.getDescriptionText())
                .price(request.getPrice())
                .rating(request.getRating())
                .moderationStatus(request.getModerationStatus() != null ? request.getModerationStatus() : "AN_TOAN")
                .isSignature(Boolean.TRUE.equals(request.getIsSignature()))
                .imageUrl(request.getImageUrl())
                .audioScriptText(request.getAudioScriptText())
                .riskScore(null)
                .riskFlags(null)
                .status("ACTIVE")
                .createdAt(now)
                .updatedAt(now)
                .build();
        return toMenuItemResponse(poiMenuItemRepository.save(item));
    }

    public PoiMenuItemResponse updateMenuItem(Integer poiId, Integer itemId, PoiMenuItemUpsertRequest request) {
        findByIdOrThrow(poiId);
        PoiMenuItem item = poiMenuItemRepository.findById(itemId)
                .orElseThrow(() -> new AppException(ErrorCode.NO_RESOURCE_FOUND));
        if (!item.getPoi().getId().equals(poiId)) {
            throw new AppException(ErrorCode.NO_RESOURCE_FOUND);
        }
        item.setName(request.getName());
        item.setDescriptionText(request.getDescriptionText());
        item.setPrice(request.getPrice());
        item.setRating(request.getRating());
        item.setModerationStatus(request.getModerationStatus() != null ? request.getModerationStatus() : "AN_TOAN");
        item.setIsSignature(Boolean.TRUE.equals(request.getIsSignature()));
        item.setImageUrl(request.getImageUrl());
        item.setAudioScriptText(request.getAudioScriptText());
        item.setUpdatedAt(LocalDateTime.now());
        return toMenuItemResponse(poiMenuItemRepository.save(item));
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
                .qrCode(poi.getQrCode())
                .riskFlag(Boolean.TRUE.equals(poi.getRiskFlag()))
                .riskScore(poi.getRiskScore())
                .rejectionReason(poi.getRejectionReason())
                .status(poi.getStatus())
                .createdAt(poi.getCreatedAt())
                .updatedAt(poi.getUpdatedAt())
                .build();
    }

    private PoiMenuItemResponse toMenuItemResponse(PoiMenuItem item) {
        return PoiMenuItemResponse.builder()
                .id(item.getId())
                .name(item.getName())
                .descriptionText(item.getDescriptionText())
                .price(item.getPrice())
                .rating(item.getRating())
                .moderationStatus(item.getModerationStatus())
                .isSignature(item.getIsSignature())
                .imageUrl(item.getImageUrl())
                .audioScriptText(item.getAudioScriptText())
                .riskScore(item.getRiskScore())
                .riskFlags(item.getRiskFlags())
                .status(item.getStatus())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }

    private PoiApprovalHistoryItemResponse toHistoryResponse(PoiApprovalHistory item) {
        return PoiApprovalHistoryItemResponse.builder()
                .id(item.getId())
                .shopId(item.getShopId())
                .poiId(item.getPoiId())
                .status(item.getStatus())
                .submittedAt(item.getSubmittedAt())
                .reviewer(item.getReviewer())
                .reviewedAt(item.getReviewedAt())
                .reason(item.getReason())
                .build();
    }

    private String mapToOwnerStatus(PoiStatus status) {
        if (status == PoiStatus.DRAFT) return "pending";
        if (status == PoiStatus.PUBLISHED) return "approved";
        return "rejected";
    }

    private void saveHistory(Integer shopId, Integer poiId, String status, String reviewer, String reason) {
        var now = LocalDateTime.now();
        poiApprovalHistoryRepository.save(PoiApprovalHistory.builder()
                .shopId(shopId)
                .poiId(poiId)
                .status(status)
                .submittedAt(now)
                .reviewer(reviewer)
                .reviewedAt(reviewer != null ? now : null)
                .reason(reason)
                .build());
    }
}
