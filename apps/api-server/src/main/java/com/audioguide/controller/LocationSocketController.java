package com.audioguide.controller;

import com.audioguide.dto.apiDTO.ApiResponse;
import com.audioguide.dto.apiDTO.PagingDto;
import com.audioguide.dto.shopDTO.ShopResponse;
import com.audioguide.dto.socketDTO.NearbyShopSocketRequest;
import com.audioguide.service.LocationSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Slf4j
@Controller
@RequiredArgsConstructor
public class LocationSocketController {

    private final LocationSocketService locationSocketService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/shops/nearby")
    public void handleNearbyShopRequest(NearbyShopSocketRequest request, Principal principal) {
        log.info("=== RECEIVED SOCKET REQUEST /shops/nearby ===");
        log.info("request = {}", request);
        log.info("principal = {}", principal != null ? principal.getName() : "NULL");

        if (principal == null) {
            log.error("Principal is null - WebSocket chưa mang auth");
            throw new IllegalArgumentException("User chưa đăng nhập hoặc WebSocket chưa mang auth");
        }

        PagingDto<ShopResponse> pagingDto = locationSocketService.getNearbyShops(
                request.getLat(),
                request.getLng(),
                request.getRadius(),
                request.getPage(),
                request.getSize()
        );

        log.info("Nearby shops totalItems = {}", pagingDto.getTotalItems());
        log.info("Nearby shops currentPage = {}", pagingDto.getCurrentPage());
        log.info("Nearby shops totalPages = {}", pagingDto.getTotalPages());

        ApiResponse<PagingDto<ShopResponse>> response = ApiResponse.<PagingDto<ShopResponse>>builder()
                .message("Lấy danh sách shop gần thành công")
                .result(pagingDto)
                .build();

        log.info("Sending message to user = {}, destination = /queue/nearby-shops", principal.getName());

        messagingTemplate.convertAndSendToUser(
                principal.getName(),
                "/queue/nearby-shops",
                response
        );

        log.info("=== SENT nearby shops to user: {} ===", principal.getName());
    }
}