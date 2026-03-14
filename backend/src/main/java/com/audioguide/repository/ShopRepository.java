package com.audioguide.repository;

import com.audioguide.entity.Shop;
import com.audioguide.enums.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;


public interface ShopRepository extends JpaRepository<Shop, Integer> {
        boolean existsByOwnerId(Integer ownerId);
        boolean existsByIdAndOwnerId(Integer shopId, Integer ownerId);
        boolean existsById(Integer shopId);
        Page<Shop> findAllByStatus(Status status, Pageable pageable);
            Optional<Shop> findById(Integer id);

}
