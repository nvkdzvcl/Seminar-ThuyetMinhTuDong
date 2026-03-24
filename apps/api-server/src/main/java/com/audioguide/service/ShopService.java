package com.audioguide.service;


import com.audioguide.dto.apiDTO.PagingDto;
import com.audioguide.dto.shopDTO.ShopCreationRequest;
import com.audioguide.dto.shopDTO.ShopResponse;
import com.audioguide.dto.shopDTO.ShopUpdateRequest;
import com.audioguide.enums.Status;
import com.audioguide.enums.UserRole;
import com.audioguide.exception.AppException;
import com.audioguide.exception.ErrorCode;
import com.audioguide.mapper.ShopMapper;
import com.audioguide.repository.ShopRepository;
import com.audioguide.repository.ShopTypeRepository;
import com.audioguide.repository.UserRepository;
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


@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ShopService {

    ShopRepository shopRepository;
    ShopTypeRepository shopTypeRepository;
    ShopMapper shopMapper;
    UserRepository userRepository;

    Path IMAGE_DIR = Path.of("uploads/shop-images");
    Path AUDIO_DIR = Path.of("uploads/shop-audios");

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

        var shop = shopMapper.toShopFromShopCreateRequest(request);

        shop.setOwner(owner);
        shop.setShopType(shopType);
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
        var shop = shopRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> {
                    log.error("Shop for owner {} not found", ownerId);
                    return new AppException(ErrorCode.SHOP_NOT_FOUND);
                });
        return shopMapper.toShopResponseFromShop(shop);
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

        shopMapper.updateShopInfo(shop, request);
        var updatedShop = shopRepository.save(shop);
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






}
