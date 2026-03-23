package com.audioguide.service;

import com.audioguide.dto.adminDTO.AdminDashboardSummaryResponse;
import com.audioguide.enums.AdminJobStatus;
import com.audioguide.enums.PoiStatus;
import com.audioguide.enums.Status;
import com.audioguide.enums.UserStatus;
import com.audioguide.repository.AdminJobRepository;
import com.audioguide.repository.OrderRepository;
import com.audioguide.repository.PoiRepository;
import com.audioguide.repository.ShopRepository;
import com.audioguide.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminDashboardService {

    UserRepository userRepository;
    ShopRepository shopRepository;
    PoiRepository poiRepository;
    OrderRepository orderRepository;
    AdminJobRepository adminJobRepository;

    public AdminDashboardSummaryResponse getSummary() {
        return AdminDashboardSummaryResponse.builder()
                .totalUsers(userRepository.count())
                .activeUsers(userRepository.countByStatus(UserStatus.ACTIVE))
                .totalShops(shopRepository.countByStatus(Status.ACTIVE))
                .totalPois(poiRepository.count())
                .flaggedPois(poiRepository.countByStatus(PoiStatus.FLAGGED))
                .pendingPois(poiRepository.countByStatus(PoiStatus.DRAFT))
                .totalOrders(orderRepository.countByStatus(Status.ACTIVE))
                .totalJobs(adminJobRepository.count())
                .failedJobs(adminJobRepository.countByStatus(AdminJobStatus.FAILED))
                .build();
    }
}
