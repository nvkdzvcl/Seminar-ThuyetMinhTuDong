package com.audioguide.service;

import com.audioguide.dto.adminDTO.AdminUserResponse;
import com.audioguide.dto.apiDTO.PagingDto;
import com.audioguide.entity.User;
import com.audioguide.enums.UserRole;
import com.audioguide.enums.UserStatus;
import com.audioguide.exception.AppException;
import com.audioguide.exception.ErrorCode;
import com.audioguide.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminUserService {

    UserRepository userRepository;

    public PagingDto<AdminUserResponse> getUsers(
            int page,
            int size,
            String search,
            UserRole role,
            UserStatus status
    ) {
        int normalizedPage = Math.max(page, 1);
        int normalizedSize = Math.min(Math.max(size, 1), 100);
        var userPage = userRepository.searchForAdmin(
                normalizeBlank(search),
                role,
                status,
                PageRequest.of(normalizedPage - 1, normalizedSize)
        );

        return PagingDto.<AdminUserResponse>builder()
                .items(userPage.getContent().stream().map(this::toResponse).toList())
                .totalItems(userPage.getTotalElements())
                .currentPage(normalizedPage)
                .pageSize(normalizedSize)
                .totalPages(userPage.getTotalPages())
                .build();
    }

    public AdminUserResponse getUserById(Integer id) {
        return toResponse(findByIdOrThrow(id));
    }

    public AdminUserResponse updateRole(Integer id, UserRole role) {
        User user = findByIdOrThrow(id);
        user.setRole(role);
        return toResponse(userRepository.save(user));
    }

    public AdminUserResponse updateStatus(Integer id, UserStatus status) {
        User user = findByIdOrThrow(id);
        user.setStatus(status);
        return toResponse(userRepository.save(user));
    }

    private User findByIdOrThrow(Integer id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private AdminUserResponse toResponse(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .email(user.getEmail())
                .language(user.getLanguage())
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private String normalizeBlank(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
