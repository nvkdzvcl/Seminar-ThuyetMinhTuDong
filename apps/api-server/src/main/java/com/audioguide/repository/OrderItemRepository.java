package com.audioguide.repository;

import com.audioguide.entity.Order;
import com.audioguide.entity.OrderItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {

    List<OrderItem> findByOrder_Id(Integer orderId);

    @Query("""
            SELECT i.dish.name, COALESCE(SUM(i.quantity), 0)
            FROM OrderItem i
            WHERE i.order.shop.id = :shopId
            AND i.order.createdAt BETWEEN :fromDate AND :toDate
            AND i.order.status = com.audioguide.enums.Status.ACTIVE
            GROUP BY i.dish.name
            ORDER BY COALESCE(SUM(i.quantity), 0) DESC
            """)
    List<Object[]> findTopDishesByShop(
            @Param("shopId") Integer shopId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable
    );

}
