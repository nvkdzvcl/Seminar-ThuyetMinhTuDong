package com.audioguide.repository;

import com.audioguide.entity.Order;
import com.audioguide.entity.TourPlan;
import com.audioguide.enums.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TourPlanRepository extends JpaRepository<TourPlan, Integer> {

    Optional<TourPlan> findByIdAndCustomerId(Integer id, Integer customerId);

    Page<TourPlan> findAllByCustomerIdAndStatusOrderByCreatedAtDescIdDesc(Integer customerId, Status status, Pageable pageable);

    Page<TourPlan> findAllByCustomerIdOrderByCreatedAtDescIdDesc(Integer customerId, Pageable pageable);



}