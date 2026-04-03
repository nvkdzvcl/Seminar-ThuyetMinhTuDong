package com.audioguide.controller;


import com.audioguide.dto.apiDTO.ApiResponse;
import com.audioguide.dto.apiDTO.PagingDto;
import com.audioguide.dto.dishDTO.DishCreationRequest;
import com.audioguide.dto.dishDTO.DishNarrationGenerateRequest;
import com.audioguide.dto.dishDTO.DishNarrationResponse;
import com.audioguide.dto.dishDTO.DishResponse;
import com.audioguide.dto.dishDTO.DishUpdateRequest;
import com.audioguide.enums.Status;
import com.audioguide.service.DishService;
import com.audioguide.service.ShopNarrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;


@RestController
@RequestMapping("/dish")
@RequiredArgsConstructor
public class DishController {

    private final DishService dishService;
    private final ShopNarrationService shopNarrationService;

    @PostMapping("/create")
    public ApiResponse<DishResponse> createDish(@RequestBody DishCreationRequest request) {

        return ApiResponse.<DishResponse>builder()
                .result(dishService.createDish(request))
                .build();
    }

    @PatchMapping("/{dishId}")
    public ApiResponse<DishResponse> updateDish(
            @PathVariable Integer dishId,
            @RequestBody DishUpdateRequest request) {

        return ApiResponse.<DishResponse>builder()
                .result(dishService.updateDish(dishId, request))
                .build();
    }

    @DeleteMapping("/{dishId}")
    public ApiResponse<?> deleteDish(@PathVariable Integer dishId) {

        dishService.deleteDish(dishId);

        return ApiResponse.builder()
                .message("Dish deleted")
                .build();
    }

    @PostMapping(value = "/{dishId}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<String> uploadImage(
            @PathVariable Integer dishId,
            @RequestParam MultipartFile file) {

        return ApiResponse.<String>builder()
                .result(dishService.uploadDishImage(dishId, file))
                .build();
    }

    @GetMapping("/{name}/search")
    public ApiResponse< PagingDto<DishResponse>> searchDishes(
            @PathVariable String name,
            @RequestParam(defaultValue = "ACTIVE") Status status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ApiResponse.< PagingDto<DishResponse>>builder()
                .message("Search dishes successfully")
                .result(dishService.searchDishes(name, status, page, size))
                .build();
    }

        @GetMapping()
        public ApiResponse< PagingDto<DishResponse>> getByIsSignatureDish(
            @RequestParam boolean isSignatureDish,
            @RequestParam(defaultValue = "ACTIVE") Status status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ApiResponse.< PagingDto<DishResponse>>builder()
                .message("Get dishes successfully")
                .result(dishService.getSignatureDish(isSignatureDish, status, page, size))
                .build();
    }

    @GetMapping("/shop/{shopId}")
    public ApiResponse<PagingDto<DishResponse>> getDishesByShopId(
            @PathVariable Integer shopId,
            @RequestParam(defaultValue = "ACTIVE") Status status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ApiResponse.<PagingDto<DishResponse>>builder()
                .message("Get dishes successfully")
                .result(dishService.getDishesByShopId(shopId, status, page, size))
                .build();
    }


    @GetMapping("/{dishId}")
    public ApiResponse<DishResponse> getDishById(@PathVariable Integer dishId) {
        return ApiResponse.<DishResponse>builder()
                .message("Get dish successfully")
                .result(dishService.getDishById(dishId))
                .build();
    }

    @GetMapping("/{dishId}/narration")
    public ApiResponse<DishNarrationResponse> getDishNarration(
            @PathVariable Integer dishId,
            @RequestParam(required = false) String lang
    ) {
        return ApiResponse.<DishNarrationResponse>builder()
                .message("Get dish narration successfully")
                .result(shopNarrationService.getOrCreateDishNarration(dishId, lang))
                .build();
    }

    @GetMapping("/{dishId}/narrations")
    @PreAuthorize("hasAnyAuthority('OWNER_SHOP','ADMIN','SUPER_ADMIN') and @securityService.isDishOwnerOrAdmin(#dishId)")
    public ApiResponse<List<DishNarrationResponse>> getDishNarrations(@PathVariable Integer dishId) {
        return ApiResponse.<List<DishNarrationResponse>>builder()
                .message("Get dish narrations successfully")
                .result(shopNarrationService.getDishNarrations(dishId))
                .build();
    }

    @PostMapping("/{dishId}/narration")
    @PreAuthorize("hasAnyAuthority('OWNER_SHOP','ADMIN','SUPER_ADMIN') and @securityService.isDishOwnerOrAdmin(#dishId)")
    public ApiResponse<DishNarrationResponse> createOrUpdateDishNarration(
            @PathVariable Integer dishId,
            @RequestBody DishNarrationGenerateRequest request
    ) {
        return ApiResponse.<DishNarrationResponse>builder()
                .message("Create or update dish narration successfully")
                .result(shopNarrationService.createOrUpdateDishNarration(dishId, request.getLang(), request.getDescription()))
                .build();
    }

}
