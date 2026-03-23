package com.audioguide.service;

import com.audioguide.dto.adminDTO.AdminJobResponse;
import com.audioguide.dto.adminDTO.AdminJobSummaryResponse;
import com.audioguide.dto.apiDTO.PagingDto;
import com.audioguide.entity.AdminJob;
import com.audioguide.enums.AdminJobStatus;
import com.audioguide.enums.AdminJobType;
import com.audioguide.exception.AppException;
import com.audioguide.exception.ErrorCode;
import com.audioguide.repository.AdminJobRepository;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminJobService {

    AdminJobRepository adminJobRepository;

    public PagingDto<AdminJobResponse> getJobs(
            int page,
            int size,
            AdminJobStatus status,
            AdminJobType type,
            String search
    ) {
        int normalizedPage = Math.max(page, 1);
        int normalizedSize = Math.min(Math.max(size, 1), 100);
        var jobPage = adminJobRepository.search(
                status,
                type,
                normalizeBlank(search),
                PageRequest.of(normalizedPage - 1, normalizedSize)
        );

        return PagingDto.<AdminJobResponse>builder()
                .items(jobPage.getContent().stream().map(this::toResponse).toList())
                .totalItems(jobPage.getTotalElements())
                .currentPage(normalizedPage)
                .pageSize(normalizedSize)
                .totalPages(jobPage.getTotalPages())
                .build();
    }

    public AdminJobResponse getJobById(Long id) {
        return toResponse(findByIdOrThrow(id));
    }

    public AdminJobResponse retryJob(Long id) {
        AdminJob job = findByIdOrThrow(id);
        job.setRetryCount((job.getRetryCount() == null ? 0 : job.getRetryCount()) + 1);
        job.setStatus(AdminJobStatus.QUEUED);
        job.setErrorMessage(null);
        job.setStartedAt(null);
        job.setEndedAt(null);
        return toResponse(adminJobRepository.save(job));
    }

    public AdminJobResponse cancelJob(Long id) {
        AdminJob job = findByIdOrThrow(id);
        job.setStatus(AdminJobStatus.CANCELED);
        job.setEndedAt(LocalDateTime.now());
        return toResponse(adminJobRepository.save(job));
    }

    public AdminJobSummaryResponse getSummary() {
        return AdminJobSummaryResponse.builder()
                .total(adminJobRepository.count())
                .queued(adminJobRepository.countByStatus(AdminJobStatus.QUEUED))
                .processing(adminJobRepository.countByStatus(AdminJobStatus.PROCESSING))
                .failed(adminJobRepository.countByStatus(AdminJobStatus.FAILED))
                .done(adminJobRepository.countByStatus(AdminJobStatus.DONE))
                .canceled(adminJobRepository.countByStatus(AdminJobStatus.CANCELED))
                .build();
    }

    private AdminJob findByIdOrThrow(Long id) {
        return adminJobRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NO_RESOURCE_FOUND));
    }

    private AdminJobResponse toResponse(AdminJob job) {
        return AdminJobResponse.builder()
                .id(job.getId())
                .jobCode(job.getJobCode())
                .type(job.getType())
                .status(job.getStatus())
                .relatedPoiId(job.getRelatedPoiId())
                .relatedUserId(job.getRelatedUserId())
                .retryCount(job.getRetryCount())
                .errorMessage(job.getErrorMessage())
                .createdAt(job.getCreatedAt())
                .startedAt(job.getStartedAt())
                .endedAt(job.getEndedAt())
                .build();
    }

    private String normalizeBlank(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
