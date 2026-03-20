package com.audioguide.repository;

import com.audioguide.entity.Order;
import com.audioguide.entity.TourPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TourPlanRepository extends JpaRepository<TourPlan, Integer> {



}