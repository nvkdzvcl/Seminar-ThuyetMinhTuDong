package com.audioguide.service;

import com.audioguide.dto.apiDTO.PagingDto;
import com.audioguide.dto.dishDTO.DishCreationRequest;
import com.audioguide.dto.dishDTO.DishResponse;
import com.audioguide.dto.dishDTO.DishUpdateRequest;
import com.audioguide.entity.Dish;
import com.audioguide.entity.PoiMenuItem;
import com.audioguide.enums.Status;
import com.audioguide.enums.UserRole;
import com.audioguide.exception.AppException;
import com.audioguide.exception.ErrorCode;
import com.audioguide.mapper.DishMapper;
import com.audioguide.repository.DishRepository;
import com.audioguide.repository.PoiMenuItemRepository;
import com.audioguide.repository.PoiRepository;
import com.audioguide.repository.ShopRepository;
import com.audioguide.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DishService {

    final DishRepository dishRepository;
    final ShopRepository shopRepository;
    final UserRepository userRepository;
    final PoiRepository poiRepository;
    final PoiMenuItemRepository poiMenuItemRepository;
    final DishMapper dishMapper;
    final MediaStorageService mediaStorageService;

    @Value("${file.upload-dir}")
    String uploadDir;

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
        syncDishToPoiMenu(savedDish, null);

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

        String previousName = dish.getName();
        dishMapper.updateDishInfo(dish, request);

        var updatedDish = dishRepository.save(dish);
        syncDishToPoiMenu(updatedDish, previousName);

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

        String previousName = dish.getName();
        dish.setStatus(Status.DELETED);

        var deletedDish = dishRepository.save(dish);
        syncDishToPoiMenu(deletedDish, previousName);

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

        Path imageDir = Path.of(uploadDir, "dish-images");
        String image = mediaStorageService.storeImage(file, imageDir, "dish-images");

        dish.setImage(image);

        var updatedDish = dishRepository.save(dish);
        syncDishToPoiMenu(updatedDish, null);

        return image;
    }


    public  DishResponse getDishById(Integer dishId) {
        var dish = dishRepository.findById(dishId)
                .orElseThrow(() -> new AppException(ErrorCode.DISH_NOT_FOUND));

        return dishMapper.toDishResponseFromDish(dish);
    }

    public PagingDto<DishResponse> searchDishes(String name, Status status, int page, int size) {
        log.info("Searching dishes with name {} and status {} page {} size {}", name, status, page, size);
        if (page < 1) throw new AppException(ErrorCode.INVALID_PAGE_NUMBER);
        if (size < 1) throw new AppException(ErrorCode.INVALID_PAGE_SIZE);

        Pageable pageable = PageRequest.of(page - 1, size);

        var dishPage = dishRepository.findByNameContainingIgnoreCaseAndStatus(name, status, pageable);

        List<DishResponse> items = dishPage.getContent()
                .stream()
                .map(dishMapper::toDishResponseFromDish)
                .toList();

        return new PagingDto<>(
                items,
                dishPage.getTotalElements(),
                dishPage.getNumber() + 1,
                dishPage.getSize(),
                dishPage.getTotalPages()
        );
    }


    public PagingDto<DishResponse> getSignatureDish(boolean isSignature, Status status, int page, int size) {
        if (page < 1) throw new AppException(ErrorCode.INVALID_PAGE_NUMBER);
        if (size < 1 || size > 10) throw new AppException(ErrorCode.INVALID_PAGE_SIZE);

        Pageable pageable = PageRequest.of(page - 1, size);

        var dishPage = dishRepository.findByIsSignatureAndStatus(isSignature, status, pageable);

        List<DishResponse> items = dishPage.getContent()
                .stream()
                .map(dishMapper::toDishResponseFromDish)
                .toList();

        return new PagingDto<>(
                items,
                dishPage.getTotalElements(),
                dishPage.getNumber() + 1,
                dishPage.getSize(),
                dishPage.getTotalPages()
        );

    }


    public PagingDto<DishResponse> getDishesByShopId(Integer shopId, Status status, Integer page, Integer size) {
        if (page < 1) throw new AppException(ErrorCode.INVALID_PAGE_NUMBER);
        if (size < 1 ) throw new AppException(ErrorCode.INVALID_PAGE_SIZE);

        Pageable pageable = PageRequest.of(page - 1, size);

        var dishes = dishRepository.findByShopIdAndStatus(shopId, status, pageable);
        List<DishResponse> items = dishes.stream()
                .map(dishMapper::toDishResponseFromDish)
                .toList();

        return new PagingDto<>(
                items,
                dishes.getTotalElements(),
                dishes.getNumber() + 1,
                dishes.getSize(),
                dishes.getTotalPages()
        );
    }

    private void syncDishToPoiMenu(Dish dish, String previousName) {
        if (dish.getShop() == null || dish.getShop().getId() == null) {
            return;
        }

        var poiOptional = poiRepository.findFirstByShopIdOrderByUpdatedAtDesc(dish.getShop().getId());
        if (poiOptional.isEmpty()) {
            return;
        }

        var poi = poiOptional.get();
        var targetName = dish.getName();
        var menuItemOptional = targetName == null
                ? java.util.Optional.<PoiMenuItem>empty()
                : poiMenuItemRepository.findFirstByPoi_IdAndNameOrderByUpdatedAtDesc(poi.getId(), targetName);

        if (menuItemOptional.isEmpty()
                && previousName != null
                && !previousName.isBlank()
                && (targetName == null || !previousName.equalsIgnoreCase(targetName))) {
            menuItemOptional = poiMenuItemRepository.findFirstByPoi_IdAndNameOrderByUpdatedAtDesc(poi.getId(), previousName);
        }

        var now = LocalDateTime.now();
        var menuItem = menuItemOptional.orElseGet(() -> PoiMenuItem.builder()
                .poi(poi)
                .moderationStatus("AN_TOAN")
                .createdAt(now)
                .build());

        menuItem.setName(targetName);
        menuItem.setDescriptionText(dish.getDescription());
        menuItem.setPrice(dish.getPrice());
        menuItem.setIsSignature(Boolean.TRUE.equals(dish.getIsSignature()));
        menuItem.setImageUrl(dish.getImage());
        menuItem.setStatus(dish.getStatus() == Status.DELETED ? "DELETED" : "ACTIVE");
        menuItem.setUpdatedAt(now);

        poiMenuItemRepository.save(menuItem);
    }

}
