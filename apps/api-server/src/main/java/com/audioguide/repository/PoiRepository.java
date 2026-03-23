package com.audioguide.repository;

import com.audioguide.entity.Poi;
import com.audioguide.enums.PoiStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PoiRepository extends JpaRepository<Poi, Integer> {

    @Query("""
            SELECT p FROM Poi p
            WHERE (:search IS NULL
                OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(p.address) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(COALESCE(p.ownerName, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            AND (:status IS NULL OR p.status = :status)
            AND (:region IS NULL OR p.region = :region)
            AND (:hasFlag IS NULL OR p.riskFlag = :hasFlag)
            ORDER BY p.updatedAt DESC
            """)
    Page<Poi> search(
            @Param("search") String search,
            @Param("status") PoiStatus status,
            @Param("region") String region,
            @Param("hasFlag") Boolean hasFlag,
            Pageable pageable
    );

    Optional<Poi> findByShopId(Integer shopId);

    long countByStatus(PoiStatus status);
}
