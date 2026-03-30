package com.audioguide.service;


import com.audioguide.dto.apiDTO.PagingDto;
import com.audioguide.dto.shopDTO.ShopCreationRequest;
import com.audioguide.dto.shopDTO.ShopResponse;
import com.audioguide.dto.shopDTO.ShopTypeResponse;
import com.audioguide.dto.shopDTO.ShopUpdateRequest;
import com.audioguide.entity.ShopType;
import com.audioguide.dto.poiDTO.PoiModerationPreviewRequest;
import com.audioguide.enums.Status;
import com.audioguide.enums.PoiStatus;
import com.audioguide.enums.UserRole;
import com.audioguide.exception.AppException;
import com.audioguide.exception.ErrorCode;
import com.audioguide.mapper.ShopMapper;
import com.audioguide.repository.PoiApprovalHistoryRepository;
import com.audioguide.repository.PoiRepository;
import com.audioguide.repository.ShopRepository;
import com.audioguide.repository.ShopTypeRepository;
import com.audioguide.repository.UserRepository;
import com.audioguide.utils.CoordinateParserUtil;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.audioguide.utils.FileStoreUtil;

import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;


@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ShopService {

    ShopRepository shopRepository;
    ShopTypeRepository shopTypeRepository;
    ShopMapper shopMapper;
    UserRepository userRepository;
    PoiRepository poiRepository;
    PoiApprovalHistoryRepository poiApprovalHistoryRepository;
    PoiModerationService poiModerationService;

    Path IMAGE_DIR = Path.of("uploads/shop-images");
    Path AUDIO_DIR = Path.of("uploads/shop-audios");
    static final List<RequiredShopType> REQUIRED_SHOP_TYPES = List.of(
            new RequiredShopType("Hải sản", "Quán chuyên hải sản, ốc và các món biển."),
            new RequiredShopType("Lẩu", "Quán lẩu và món nước dùng nóng."),
            new RequiredShopType("Đồ nướng", "Quán nướng, BBQ, món nướng than/lửa."),
            new RequiredShopType("Cơm", "Quán cơm bình dân, cơm văn phòng, cơm gà."),
            new RequiredShopType("Phở", "Phở, bún, mì, hủ tiếu và món sợi."),
            new RequiredShopType("Giải khát", "Trà sữa, cà phê, nước ép, đồ uống.")
    );

    public ShopResponse createShop(Integer ownerId, ShopCreationRequest request) {

        var owner = userRepository.findById(ownerId)
                .orElseThrow(() -> {
                    log.error("User {} not found", ownerId);
                    return new AppException(ErrorCode.USER_NOT_FOUND);
                });

        if(shopRepository.existsByOwnerId(owner.getId())){
            log.error("User {} already has a shop", ownerId);
            throw new AppException(ErrorCode.USER_ALREADY_HAS_SHOP);
        }

        var shopType = request.getShopTypeId() != null
                ? shopTypeRepository.findById(request.getShopTypeId())
                    .orElseThrow(() -> new AppException(ErrorCode.SHOP_TYPE_NOT_FOUND))
                : shopTypeRepository.findFirstByOrderByIdAsc()
                    .orElseThrow(() -> new AppException(ErrorCode.SHOP_TYPE_NOT_FOUND));

        ensureShopContentAllowedForOwner(request.getName(), request.getAddress(), request.getDescription(), shopType.getName(), null);

        var coordinates = resolveCoordinatesForCreate(request);
        var shop = shopMapper.toShopFromShopCreateRequest(request);

        shop.setOwner(owner);
        shop.setShopType(shopType);
        shop.setLat(coordinates.lat());
        shop.setLng(coordinates.lng());
        shop.setCreatedAt(LocalDate.now());
        shop.setStatus(Status.ACTIVE);

        var savedShop = shopRepository.save(shop);

        log.info("Shop {} created successfully", savedShop.getName());

        return shopMapper.toShopResponseFromShop(savedShop);
    }


    public PagingDto<ShopResponse> getAllShops(int page, int size, Status status) {
        var pageable = PageRequest.of(page - 1, size);
        var shopPage = shopRepository.findAllByStatus(status, pageable);
        var shopResponses = shopMapper.toShopResponseFromShopList(shopPage.getContent());
        return PagingDto.<ShopResponse>builder()
                .items(shopResponses)
                .currentPage(page)
                .totalItems(shopPage.getTotalElements())
                .totalPages(shopPage.getTotalPages())
                .build();
    }





    public ShopResponse getShopById(Integer shopId) {
        var shop = shopRepository.findById(shopId)
                .orElseThrow(() -> {
                    log.error("Shop {} not found", shopId);
                    return new AppException(ErrorCode.SHOP_NOT_FOUND);
                });
        return shopMapper.toShopResponseFromShop(shop);
    }

    public ShopResponse getMyShop() {
        Integer ownerId = getCurrentUserId();
        var shopOptional = shopRepository.findByOwnerId(ownerId);
        if (shopOptional.isEmpty()) {
            log.info("Shop for owner {} not found", ownerId);
            return null;
        }
        return shopMapper.toShopResponseFromShop(shopOptional.get());
    }

    public List<ShopTypeResponse> getAllShopTypes() {
        ensureRequiredShopTypes();
        return REQUIRED_SHOP_TYPES.stream()
                .map(required -> shopTypeRepository.findByNameIgnoreCase(required.name()).orElse(null))
                .filter(Objects::nonNull)
                .map(this::toShopTypeResponse)
                .toList();
    }


    public ShopResponse updateShop(Integer shopId,  ShopUpdateRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        var currentUser = userRepository.findById(Integer.parseInt(authentication.getName()))

                .orElseThrow(() -> {
                    log.error("User {} not found", authentication.getName());
                    return new AppException(ErrorCode.USER_NOT_FOUND);
                });
        var shop = shopRepository.findById(shopId)
                .orElseThrow(() -> {
                    log.error("Shop {} not found", shopId);
                    return new AppException(ErrorCode.SHOP_NOT_FOUND);
                });

        var coordinates = resolveCoordinatesForUpdate(request);
        if (coordinates != null) {
            request.setLat(coordinates.lat());
            request.setLng(coordinates.lng());
        }
        shopMapper.updateShopInfo(shop, request);
        var updatedShop = shopRepository.save(shop);
        log.info("Shop {} updated successfully", shopId);
        return shopMapper.toShopResponseFromShop(updatedShop);
    }

    public ShopResponse updateMyShop(ShopUpdateRequest request) {
        Integer ownerId = getCurrentUserId();
        userRepository.findById(ownerId)
                .orElseThrow(() -> {
                    log.error("User {} not found", ownerId);
                    return new AppException(ErrorCode.USER_NOT_FOUND);
                });

        var shop = shopRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> {
                    log.error("Shop for owner {} not found", ownerId);
                    return new AppException(ErrorCode.SHOP_NOT_FOUND);
                });

        String effectiveName = hasText(request.getName()) ? request.getName().trim() : shop.getName();
        String effectiveAddress = hasText(request.getAddress()) ? request.getAddress().trim() : shop.getAddress();
        String effectiveDescription = hasText(request.getDescription()) ? request.getDescription().trim() : shop.getDescription();
        String effectiveCategory = shop.getShopType() != null ? shop.getShopType().getName() : null;
        ensureShopContentAllowedForOwner(
                effectiveName,
                effectiveAddress,
                effectiveDescription,
                effectiveCategory,
                null
        );

        var coordinates = resolveCoordinatesForUpdate(request);
        if (coordinates != null) {
            request.setLat(coordinates.lat());
            request.setLng(coordinates.lng());
        }
        shopMapper.updateShopInfo(shop, request);
        var updatedShop = shopRepository.save(shop);
        syncPoiAfterShopUpdate(updatedShop, true);
        log.info("Shop {} updated successfully by owner {}", updatedShop.getId(), ownerId);
        return shopMapper.toShopResponseFromShop(updatedShop);
    }


    public void deleteShop(Integer shopId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        var currentUser = userRepository.findById(Integer.parseInt(authentication.getName()))
                .orElseThrow(() -> {
                    log.error("User {} not found", authentication.getName());
                    return new AppException(ErrorCode.USER_NOT_FOUND);
                });
        var shop = shopRepository.findById(shopId)
                .orElseThrow(() -> {
                    log.error("Shop {} not found", shopId);
                    return new AppException(ErrorCode.SHOP_NOT_FOUND);
                });

//        FileStoreUtil.deleteIfExists(SHOP_DIR, shop.getImageName());

        shop.setStatus(Status.DELETED);
        shopRepository.save(shop);
        log.info("Shop {} deleted successfully", shopId);
    }

    public String uploadShopImage(Integer shopId, MultipartFile file) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        var currentUser = userRepository.findById(Integer.parseInt(authentication.getName()))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        var shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_FOUND));

        if (!currentUser.getRole().equals(UserRole.ADMIN)
                && !shop.getOwner().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        String imageUrl =  FileStoreUtil.saveKeepingNameWithSuffix(file, IMAGE_DIR);

        shop.setImageName(imageUrl);
        shopRepository.save(shop);
        log.info("Image uploaded for shop {}", shopId);

        return imageUrl;
    }


    public String uploadShopAudio(Integer shopId, MultipartFile file) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        var currentUser = userRepository.findById(Integer.parseInt(authentication.getName()))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        var shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_FOUND));

        if (!currentUser.getRole().equals(UserRole.ADMIN)
                && !shop.getOwner().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        String audioUrl = FileStoreUtil.saveKeepingNameWithSuffix(file, AUDIO_DIR);

        shop.setAudioURL(audioUrl);

        shopRepository.save(shop);

        log.info("Audio uploaded for shop {}", shopId);

        return audioUrl;
    }


    public PagingDto<ShopResponse> searchShops(String name, Status status, int page, int size) {
        var pageable = PageRequest.of(page - 1, size);
        var shopPage = shopRepository.findByNameContainingIgnoreCaseAndStatus(name, status, pageable);
        var shopResponses = shopMapper.toShopResponseFromShopList(shopPage.getContent());
        return PagingDto.<ShopResponse>builder()
                .items(shopResponses)
                .currentPage(page)
                .totalItems(shopPage.getTotalElements())
                .totalPages(shopPage.getTotalPages())
                .build();
    }


    public PagingDto<ShopResponse> getShopNearLocation(double lat, double lng, double radius, Integer page, Integer size) {
        var pageable = PageRequest.of(page - 1, size);
        var shopPage = shopRepository.findNearbyShops(lat, lng, radius, Status.ACTIVE, pageable);
        var shopResponses = shopMapper.toShopResponseFromShopList(shopPage.getContent());
        return PagingDto.<ShopResponse>builder()
                .items(shopResponses)
                .currentPage(page)
                .totalItems(shopPage.getTotalElements())
                .totalPages(shopPage.getTotalPages())
                .build();
    }

    private Integer getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        try {
            return Integer.parseInt(authentication.getName());
        } catch (NumberFormatException exception) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }

    private CoordinateParserUtil.ParsedCoordinate resolveCoordinatesForCreate(ShopCreationRequest request) {
        if (hasText(request.getCoordinateRaw())) {
            return parseRawCoordinate(request.getCoordinateRaw());
        }
        if (request.getLat() == null || request.getLng() == null) {
            throw new AppException(ErrorCode.INVALID_LAT_LNG);
        }
        if (!isValidRange(request.getLat(), request.getLng())) {
            throw new AppException(ErrorCode.INVALID_LAT_LNG);
        }
        return new CoordinateParserUtil.ParsedCoordinate(request.getLat(), request.getLng());
    }

    private CoordinateParserUtil.ParsedCoordinate resolveCoordinatesForUpdate(ShopUpdateRequest request) {
        if (hasText(request.getCoordinateRaw())) {
            return parseRawCoordinate(request.getCoordinateRaw());
        }
        if (request.getLat() == null && request.getLng() == null) {
            return null;
        }
        if (request.getLat() == null || request.getLng() == null) {
            throw new AppException(ErrorCode.INVALID_LAT_LNG);
        }
        if (!isValidRange(request.getLat(), request.getLng())) {
            throw new AppException(ErrorCode.INVALID_LAT_LNG);
        }
        return new CoordinateParserUtil.ParsedCoordinate(request.getLat(), request.getLng());
    }

    private CoordinateParserUtil.ParsedCoordinate parseRawCoordinate(String rawCoordinate) {
        return CoordinateParserUtil.parseFlexible(rawCoordinate)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_LAT_LNG));
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private boolean isValidRange(Double lat, Double lng) {
        return lat >= -90.0 && lat <= 90.0 && lng >= -180.0 && lng <= 180.0;
    }

    private void ensureRequiredShopTypes() {
        for (RequiredShopType required : REQUIRED_SHOP_TYPES) {
            if (shopTypeRepository.findByNameIgnoreCase(required.name()).isPresent()) {
                continue;
            }
            shopTypeRepository.save(ShopType.builder()
                    .name(required.name())
                    .description(required.description())
                    .build());
        }
    }

    private ShopTypeResponse toShopTypeResponse(ShopType shopType) {
        return ShopTypeResponse.builder()
                .id(shopType.getId())
                .name(shopType.getName())
                .description(shopType.getDescription())
                .build();
    }

    private void ensureShopContentAllowedForOwner(
            String name,
            String address,
            String description,
            String category,
            String region
    ) {
        var preview = poiModerationService.previewForShopOwner(
                PoiModerationPreviewRequest.builder()
                        .name(name)
                        .address(address)
                        .description(description)
                        .category(category)
                        .region(region)
                        .build()
        );

        if ("BLOCK".equalsIgnoreCase(preview.getDecision())) {
            throw new AppException(ErrorCode.SHOP_CONTENT_BLOCKED_BY_AI);
        }
    }

    private void syncPoiAfterShopUpdate(com.audioguide.entity.Shop shop, boolean savePendingHistory) {
        var poiOptional = poiRepository.findByShopId(shop.getId());
        if (poiOptional.isEmpty()) {
            return;
        }

        var poi = poiOptional.get();
        poi.setName(shop.getName());
        poi.setDescription(shop.getDescription());
        poi.setAddress(shop.getAddress());
        poi.setLat(shop.getLat());
        poi.setLng(shop.getLng());
        poi.setCategory(shop.getShopType() != null ? shop.getShopType().getName() : poi.getCategory());
        poi.setOwnerId(shop.getOwner() != null ? shop.getOwner().getId() : poi.getOwnerId());
        poi.setOwnerName(shop.getOwner() != null ? shop.getOwner().getFullName() : poi.getOwnerName());
        poi.setCoverImage(shop.getImageName());
        poi.setStatus(PoiStatus.DRAFT);
        poi.setRejectionReason(null);
        poi.setUpdatedAt(LocalDateTime.now());

        poiModerationService.evaluateAndApply(poi);
        poi.setUpdatedAt(LocalDateTime.now());
        poi = poiRepository.save(poi);

        if (poi.getStatus() == PoiStatus.FLAGGED) {
            saveApprovalHistory(shop.getId(), poi.getId(), "rejected", "AI Moderation", poi.getRejectionReason());
        } else if (savePendingHistory) {
            saveApprovalHistory(shop.getId(), poi.getId(), "pending", null, null);
        }
    }

    private void saveApprovalHistory(Integer shopId, Integer poiId, String status, String reviewer, String reason) {
        var now = LocalDateTime.now();
        poiApprovalHistoryRepository.save(com.audioguide.entity.PoiApprovalHistory.builder()
                .shopId(shopId)
                .poiId(poiId)
                .status(status)
                .submittedAt(now)
                .reviewer(reviewer)
                .reviewedAt(reviewer != null ? now : null)
                .reason(reason)
                .build());
    }

    private record RequiredShopType(String name, String description) {}






}
