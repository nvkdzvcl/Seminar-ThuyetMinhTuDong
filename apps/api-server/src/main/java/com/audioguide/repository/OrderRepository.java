package com.audioguide.repository;

import com.audioguide.entity.Order;
import com.audioguide.enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {

    @Query("""
            SELECT o.createdAt, COUNT(o.id)
            FROM Order o
            WHERE o.createdAt BETWEEN :fromDate AND :toDate
            AND o.status = com.audioguide.enums.Status.ACTIVE
            GROUP BY o.createdAt
            ORDER BY o.createdAt
            """)
    List<Object[]> countVisitsByDay(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate
    );

    long countByStatus(Status status);

}
