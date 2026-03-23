package com.audioguide.repository;

import com.audioguide.entity.AdminJob;
import com.audioguide.enums.AdminJobStatus;
import com.audioguide.enums.AdminJobType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AdminJobRepository extends JpaRepository<AdminJob, Long> {
    @Query("""
            SELECT j FROM AdminJob j
            WHERE (:status IS NULL OR j.status = :status)
            AND (:type IS NULL OR j.type = :type)
            AND (:search IS NULL OR LOWER(j.jobCode) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY j.createdAt DESC
            """)
    Page<AdminJob> search(
            @Param("status") AdminJobStatus status,
            @Param("type") AdminJobType type,
            @Param("search") String search,
            Pageable pageable
    );

    long countByStatus(AdminJobStatus status);
}
