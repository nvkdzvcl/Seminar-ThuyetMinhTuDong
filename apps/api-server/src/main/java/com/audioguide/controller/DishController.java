package com.audioguide.controller;


import com.audioguide.dto.apiDTO.ApiResponse;
import com.audioguide.dto.apiDTO.PagingDto;
import com.audioguide.dto.dishDTO.DishCreationRequest;
import com.audioguide.dto.dishDTO.DishResponse;
import com.audioguide.dto.dishDTO.DishUpdateRequest;
import com.audioguide.enums.Status;
import com.audioguide.service.DishService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


@RestController
@RequestMapping("/dish")
@RequiredArgsConstructor
public class DishController {

    private final DishService dishService;

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

}