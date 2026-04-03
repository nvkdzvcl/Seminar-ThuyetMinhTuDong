package com.audioguide.controller;


import com.audioguide.dto.apiDTO.ApiResponse;
import com.audioguide.dto.apiDTO.PagingDto;
import com.audioguide.dto.shopDTO.ShopCreationRequest;
import com.audioguide.dto.shopDTO.ShopNarrationGenerateRequest;
import com.audioguide.dto.shopDTO.ShopNarrationResponse;
import com.audioguide.dto.shopDTO.ShopResponse;
import com.audioguide.dto.shopDTO.ShopTypeResponse;
import com.audioguide.dto.shopDTO.ShopUpdateRequest;
import com.audioguide.enums.Status;
import com.audioguide.service.ShopNarrationService;
import com.audioguide.service.ShopService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/shop")
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ShopController {

    ShopService shopService;
    ShopNarrationService shopNarrationService;

    @PostMapping(value = "/create")
    @PreAuthorize("hasAnyAuthority('OWNER_SHOP','ADMIN','SUPER_ADMIN')")
    ApiResponse<ShopResponse> createShop(@RequestBody @Valid ShopCreationRequest request) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Integer ownerId = Integer.parseInt(authentication.getName());

        ShopResponse shopResponse = shopService.createShop(ownerId, request);

        return ApiResponse.<ShopResponse>builder()
                .message("Shop created successfully")
                .result(shopResponse)
                .build();
    }

    @GetMapping("/types")
    @PreAuthorize("hasAnyAuthority('OWNER_SHOP','ADMIN','SUPER_ADMIN')")
    ApiResponse<List<ShopTypeResponse>> getShopTypes() {
        return ApiResponse.<List<ShopTypeResponse>>builder()
                .message("Get shop types successfully")
                .result(shopService.getAllShopTypes())
                .build();
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyAuthority('OWNER_SHOP','ADMIN','SUPER_ADMIN')")
    ApiResponse<ShopResponse> getMyShop() {
        return ApiResponse.<ShopResponse>builder()
                .message("Get current owner shop successfully")
                .result(shopService.getMyShop())
                .build();
    }

    @PatchMapping("/me")
    @PreAuthorize("hasAnyAuthority('OWNER_SHOP','ADMIN','SUPER_ADMIN')")
    ApiResponse<ShopResponse> updateMyShop(@RequestBody @Valid ShopUpdateRequest request) {
        return ApiResponse.<ShopResponse>builder()
                .message("Update current owner shop successfully")
                .result(shopService.updateMyShop(request))
                .build();
    }

    @GetMapping("/{shopId}")
    ApiResponse<ShopResponse> getShopById(@PathVariable Integer shopId) {
        return ApiResponse.<ShopResponse>builder()
                .message("Get shop successfully")
                .result(shopService.getShopById(shopId))
                .build();
    }

    @GetMapping("/{shopId}/narration")
    ApiResponse<ShopNarrationResponse> getShopNarration(
            @PathVariable Integer shopId,
            @RequestParam(required = false) String lang
    ) {
        return ApiResponse.<ShopNarrationResponse>builder()
                .message("Get shop narration successfully")
                .result(shopNarrationService.getOrCreateNarration(shopId, lang))
                .build();
    }

    @GetMapping("/{shopId}/narrations")
    @PreAuthorize("hasAnyAuthority('OWNER_SHOP','ADMIN','SUPER_ADMIN') and @securityService.isOwnerOrAmin(#shopId)")
    ApiResponse<List<ShopNarrationResponse>> getShopNarrations(@PathVariable Integer shopId) {
        return ApiResponse.<List<ShopNarrationResponse>>builder()
                .message("Get shop narrations successfully")
                .result(shopNarrationService.getShopNarrations(shopId))
                .build();
    }

    @PostMapping("/{shopId}/narration")
    @PreAuthorize("hasAnyAuthority('OWNER_SHOP','ADMIN','SUPER_ADMIN') and @securityService.isOwnerOrAmin(#shopId)")
    ApiResponse<ShopNarrationResponse> createOrUpdateShopNarration(
            @PathVariable Integer shopId,
            @RequestBody ShopNarrationGenerateRequest request
    ) {
        return ApiResponse.<ShopNarrationResponse>builder()
                .message("Create or update shop narration successfully")
                .result(shopNarrationService.createOrUpdateShopNarration(shopId, request.getLang(), request.getDescription()))
                .build();
    }

    @GetMapping()
    ApiResponse<PagingDto<ShopResponse>> getAllShops(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Status status

    ) {
        return ApiResponse.<PagingDto<ShopResponse>>builder()
                .message("Get shops successfully")
                .result(shopService.getAllShops(page, size, status))
                .build();
    }

    @PreAuthorize("@securityService.isOwnerOrAmin(#shopId)")
    @PatchMapping(value ="/{shopId}" )
    ApiResponse<ShopResponse> updateShopById(@PathVariable Integer shopId, @RequestBody  @Valid ShopUpdateRequest request) {
             ShopResponse shopResponse = shopService.updateShop(shopId, request);

        return ApiResponse.<ShopResponse>builder()
                .message("Shop updated successfully")
                .result(shopResponse)
                .build();
    }

    @PreAuthorize("@securityService.isOwnerOrAmin(#shopId)")
    @DeleteMapping("/{shopId}")
    ApiResponse<Void> deleteShopById(@PathVariable Integer shopId) {
        shopService.deleteShop(shopId);
        return ApiResponse.<Void>builder()
                .message("Shop deleted successfully")
                .build();
    }

    @PreAuthorize("@securityService.isOwnerOrAmin(#shopId)")
    @PostMapping(value = "/{shopId}/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<String> uploadShopImage(
            @PathVariable Integer shopId,
            @RequestParam("file") MultipartFile file) {

        return ApiResponse.<String>builder()
                .result(shopService.uploadShopImage(shopId, file))
                .build();
    }

    @PostMapping(value = "/{shopId}/upload-audio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<String> uploadShopAudio(
            @PathVariable Integer shopId,
            @RequestParam("file") MultipartFile file) {

        return ApiResponse.<String>builder()
                .result(shopService.uploadShopAudio(shopId, file))
                .build();
    }


    @GetMapping("/search")
    public ApiResponse<PagingDto<ShopResponse>> searchShops(
            @RequestParam String name,
            @RequestParam(required = false) Status status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.<PagingDto<ShopResponse>>builder()
                .message("Search shops successfully")
                .result(shopService.searchShops(name, status, page, size))
                .build();
    }



    @GetMapping("/nearby")
    public ApiResponse<PagingDto<ShopResponse>> getNearbyShops(
            @RequestParam double latitude,
            @RequestParam double longitude,
            @RequestParam(defaultValue = "2") double radius,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.<PagingDto<ShopResponse>>builder()
                .message("Get nearby shops successfully")
                .result(shopService.getShopNearLocation(latitude, longitude, radius, page, size))
                .build();

    }
}
