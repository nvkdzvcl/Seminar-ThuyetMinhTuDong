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

    @Query("""
            SELECT o.createdAt, COUNT(o.id)
            FROM Order o
            WHERE o.shop.id = :shopId
            AND o.createdAt BETWEEN :fromDate AND :toDate
            AND o.status = com.audioguide.enums.Status.ACTIVE
            GROUP BY o.createdAt
            ORDER BY o.createdAt
            """)
    List<Object[]> countOrdersByDayForShop(
            @Param("shopId") Integer shopId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate
    );

    @Query("""
            SELECT o.createdAt, COALESCE(SUM(o.totalPrice), 0)
            FROM Order o
            WHERE o.shop.id = :shopId
            AND o.createdAt BETWEEN :fromDate AND :toDate
            AND o.status = com.audioguide.enums.Status.ACTIVE
            GROUP BY o.createdAt
            ORDER BY o.createdAt
            """)
    List<Object[]> sumRevenueByDayForShop(
            @Param("shopId") Integer shopId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate
    );

    long countByShop_IdAndStatusAndCreatedAtBetween(
            Integer shopId,
            Status status,
            LocalDate fromDate,
            LocalDate toDate
    );

    @Query("""
            SELECT COALESCE(SUM(o.totalPrice), 0)
            FROM Order o
            WHERE o.shop.id = :shopId
            AND o.createdAt BETWEEN :fromDate AND :toDate
            AND o.status = com.audioguide.enums.Status.ACTIVE
            """)
    Long sumRevenueForShop(
            @Param("shopId") Integer shopId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate
    );

    @Query("""
            SELECT COUNT(DISTINCT o.customer.id)
            FROM Order o
            WHERE o.shop.id = :shopId
            AND o.createdAt BETWEEN :fromDate AND :toDate
            AND o.status = com.audioguide.enums.Status.ACTIVE
            """)
    Long countDistinctCustomersForShop(
            @Param("shopId") Integer shopId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate
    );

    @Query("""
            SELECT COALESCE(NULLIF(TRIM(o.customer.language), ''), 'unknown'), COUNT(o.id)
            FROM Order o
            WHERE o.shop.id = :shopId
            AND o.createdAt BETWEEN :fromDate AND :toDate
            AND o.status = com.audioguide.enums.Status.ACTIVE
            GROUP BY COALESCE(NULLIF(TRIM(o.customer.language), ''), 'unknown')
            ORDER BY COUNT(o.id) DESC
            """)
    List<Object[]> countLanguageUsageForShop(
            @Param("shopId") Integer shopId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate
    );

    long countByStatus(Status status);

}
