package com.audioguide.service;

import com.audioguide.dto.apiDTO.PagingDto;
import com.audioguide.dto.auditDTO.AdminAuditLogResponse;
import com.audioguide.entity.AdminAuditLog;
import com.audioguide.repository.AdminAuditLogRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminAuditLogService {

    AdminAuditLogRepository adminAuditLogRepository;

    public void write(AdminAuditLog log) {
        adminAuditLogRepository.save(log);
    }

    public PagingDto<AdminAuditLogResponse> getLogs(int page, int size) {
        int normalizedPage = Math.max(page, 1);
        int normalizedSize = Math.min(Math.max(size, 1), 100);

        var pageRequest = PageRequest.of(
                normalizedPage - 1,
                normalizedSize,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        var data = adminAuditLogRepository.findAll(pageRequest);
        var items = data.getContent().stream()
                .map(item -> AdminAuditLogResponse.builder()
                        .id(item.getId())
                        .actorId(item.getActorId())
                        .actorEmail(item.getActorEmail())
                        .actorRole(item.getActorRole())
                        .action(item.getAction())
                        .method(item.getMethod())
                        .path(item.getPath())
                        .statusCode(item.getStatusCode())
                        .ipAddress(item.getIpAddress())
                        .userAgent(item.getUserAgent())
                        .detail(item.getDetail())
                        .createdAt(item.getCreatedAt())
                        .build())
                .toList();

        return PagingDto.<AdminAuditLogResponse>builder()
                .items(items)
                .totalItems(data.getTotalElements())
                .currentPage(normalizedPage)
                .pageSize(normalizedSize)
                .totalPages(data.getTotalPages())
                .build();
    }
}
