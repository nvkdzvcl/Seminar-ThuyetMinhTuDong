package com.audioguide.repository;

import com.audioguide.entity.ShopType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShopTypeRepository extends JpaRepository<ShopType, Integer> {
    Optional<ShopType> findFirstByOrderByIdAsc();
    List<ShopType> findAllByOrderByNameAsc();
}
