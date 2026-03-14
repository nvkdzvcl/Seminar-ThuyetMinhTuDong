package com.audioguide.service;

import com.audioguide.dto.dishDTO.DishCreationRequest;
import com.audioguide.dto.dishDTO.DishResponse;
import com.audioguide.dto.dishDTO.DishUpdateRequest;
import com.audioguide.entity.Dish;
import com.audioguide.enums.Status;
import com.audioguide.enums.UserRole;
import com.audioguide.exception.AppException;
import com.audioguide.exception.ErrorCode;
import com.audioguide.mapper.DishMapper;
import com.audioguide.repository.DishRepository;
import com.audioguide.repository.ShopRepository;
import com.audioguide.repository.UserRepository;
import com.audioguide.utils.FileStoreUtil;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DishService {

    DishRepository dishRepository;
    ShopRepository shopRepository;
    UserRepository userRepository;
    DishMapper dishMapper;

    Path IMAGE_DIR = Path.of("uploads/dish-images");

    public DishResponse createDish(DishCreationRequest request) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        var currentUser = userRepository.findById(Integer.parseInt(authentication.getName()))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        var shop = shopRepository.findById(request.getShopId())
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_FOUND));

        if (!currentUser.getRole().equals(UserRole.ADMIN)
                && !shop.getOwner().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        var dish = dishMapper.toDishFromDishCreateRequest(request);

        dish.setShop(shop);
        dish.setCreatedAt(LocalDate.now());
        dish.setStatus(Status.ACTIVE);

        var savedDish = dishRepository.save(dish);

        log.info("Dish {} created", savedDish.getName());

        return dishMapper.toDishResponseFromDish(savedDish);
    }

    public DishResponse updateDish(Integer dishId, DishUpdateRequest request) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        var currentUser = userRepository.findById(Integer.parseInt(authentication.getName()))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        var dish = dishRepository.findById(dishId)
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_FOUND));

        var shop = dish.getShop();

        if (!currentUser.getRole().equals(UserRole.ADMIN)
                && !shop.getOwner().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        dishMapper.updateDishInfo(dish, request);

        var updatedDish = dishRepository.save(dish);

        log.info("Dish {} updated", dishId);

        return dishMapper.toDishResponseFromDish(updatedDish);
    }

    public void deleteDish(Integer dishId) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        var currentUser = userRepository.findById(Integer.parseInt(authentication.getName()))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        var dish = dishRepository.findById(dishId)
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_FOUND));

        var shop = dish.getShop();

        if (!currentUser.getRole().equals(UserRole.ADMIN)
                && !shop.getOwner().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        dish.setStatus(Status.DELETED);

        dishRepository.save(dish);

        log.info("Dish {} deleted", dishId);
    }

    public String uploadDishImage(Integer dishId, MultipartFile file) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        var currentUser = userRepository.findById(Integer.parseInt(authentication.getName()))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        var dish = dishRepository.findById(dishId)
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_FOUND));

        var shop = dish.getShop();

        if (!currentUser.getRole().equals(UserRole.ADMIN)
                && !shop.getOwner().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        String image = FileStoreUtil.saveKeepingNameWithSuffix(file, IMAGE_DIR);

        dish.setImage(image);

        dishRepository.save(dish);

        return image;
    }


    public  DishResponse getDishById(Integer dishId) {
        var dish = dishRepository.findById(dishId)
                .orElseThrow(() -> new AppException(ErrorCode.DISH_NOT_FOUND));

        return dishMapper.toDishResponseFromDish(dish);
    }
}