package com.audioguide.repository;

import com.audioguide.entity.Shop;
import com.audioguide.enums.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;


public interface ShopRepository extends JpaRepository<Shop, Integer> {
        boolean existsByOwnerId(Integer ownerId);
        boolean existsByIdAndOwnerId(Integer shopId, Integer ownerId);
        boolean existsById(Integer shopId);
        Optional<Shop> findByOwnerId(Integer ownerId);
        Page<Shop> findAllByStatus(Status status, Pageable pageable);
        List<Shop> findAllByStatus(Status status);
        long countByStatus(Status status);
        Page<Shop> findByNameContainingIgnoreCaseAndStatus(String name, Status status, Pageable pageable);




        @Query("""
        SELECT s FROM Shop s
        WHERE
        (6371 * acos(
            cos(radians(:lat))
            * cos(radians(s.lat))
            * cos(radians(s.lng) - radians(:lng))
            + sin(radians(:lat))
            * sin(radians(s.lat))
        )) <= :radius
        AND s.status = :status
        """)
        Page<Shop> findNearbyShops(
                @Param("lat") double lat,
                @Param("lng") double lng,
                @Param("radius") double radius,
                @Param("status") Status status,
                Pageable pageable
        );
            Optional<Shop> findById(Integer id);

}
