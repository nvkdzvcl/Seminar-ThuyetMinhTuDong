package com.audioguide.service;


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

    public boolean isOwnerOrAmin(Integer shopId) {
        log.info("Checking if user is owner or admin for shop {}", shopId);
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String ownerId = authentication.getName();

        boolean isAdmin = authentication.getAuthorities()
                .stream()
                .anyMatch(a -> a.getAuthority().equals("ADMIN"));

        if (isAdmin) return true;

        return shopRepository.existsByIdAndOwnerId(shopId, Integer.parseInt(ownerId) );
    }


}
