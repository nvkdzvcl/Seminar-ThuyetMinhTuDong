package com.audioguide.repository;

import com.audioguide.entity.Dish;
import com.audioguide.enums.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DishRepository extends JpaRepository<Dish, Integer> {

    Page<Dish> findAllByStatus(Status status, Pageable pageable);
    Page<Dish> findByNameContainingIgnoreCaseAndStatus(String name, Status status, Pageable pageable);
    Page<Dish> findByIsSignatureAndStatus(boolean isSignature, Status status, Pageable pageable);
    Page<Dish> findByShopIdAndStatus(Integer shopId, Status status, Pageable pageable);
     List<Dish> findByShopIdAndStatus(Integer shopId, Status status);
     boolean existsByIdAndShopId(Integer dishId, Integer shopId);
     boolean existsById(Integer dishId);

}