package com.audioguide.service;


import com.audioguide.enums.UserRole;
import com.audioguide.repository.DishRepository;
import com.audioguide.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;


@Service
@Slf4j
@RequiredArgsConstructor
public class SecurityService {


    private final ShopRepository shopRepository;
    private final DishRepository dishRepository;

    public boolean isOwnerOrAmin(Integer shopId) {
        log.info("Checking if user is owner or admin for shop {}", shopId);
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getName() == null) {
            return false;
        }

        String ownerId = authentication.getName();

        boolean isAdmin = authentication.getAuthorities()
                .stream()
                .anyMatch(a -> a.getAuthority().equals(UserRole.ADMIN.name())
                        || a.getAuthority().equals(UserRole.SUPER_ADMIN.name()));

        if (isAdmin) return true;

        try {
            return shopRepository.existsByIdAndOwnerId(shopId, Integer.parseInt(ownerId));
        } catch (NumberFormatException exception) {
            return false;
        }
    }

    public boolean isDishOwnerOrAdmin(Integer dishId) {
        log.info("Checking if user is owner or admin for dish {}", dishId);
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getName() == null) {
            return false;
        }

        String userId = authentication.getName();
        boolean isAdmin = authentication.getAuthorities()
                .stream()
                .anyMatch(a -> a.getAuthority().equals(UserRole.ADMIN.name())
                        || a.getAuthority().equals(UserRole.SUPER_ADMIN.name()));

        if (isAdmin) {
            return true;
        }

        try {
            return dishRepository.existsByIdAndShopOwnerId(dishId, Integer.parseInt(userId));
        } catch (NumberFormatException exception) {
            return false;
        }
    }


}
