package com.audioguide.service;



import com.audioguide.dto.tourPlanDTO.TourPlanCreationRequest;
import com.audioguide.dto.tourPlanDTO.TourPlanResponse;
import com.audioguide.dto.tourStopDTO.TourStopResponse;
import com.audioguide.dto.tourStopItemDTO.TourStopItemResponse;
import com.audioguide.entity.Dish;
import com.audioguide.entity.Shop;
import com.audioguide.entity.TourPlan;
import com.audioguide.entity.User;
import com.audioguide.enums.Status;
import com.audioguide.exception.AppException;
import com.audioguide.exception.ErrorCode;
import com.audioguide.repository.DishRepository;
import com.audioguide.repository.ShopRepository;
import com.audioguide.repository.TourPlanRepository;
import com.audioguide.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;



import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TourPlanService {


    TourPlanRepository tourPlanRepository;
    ShopRepository shopRepository;
    DishRepository dishRepository;
    UserRepository userRepository;

    public TourPlanResponse createSuggestedTourPlan(  TourPlanCreationRequest request) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        var customer = userRepository.findById(Integer.parseInt(authentication.getName()))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        validateRequest(customer, request);

        int requestedBudget = request.getBudgetTotal();
        int effectiveBudget = (int) Math.ceil(requestedBudget * 1.1);
        int timeLimit = request.getTimeTotalMin();
        int peopleCount = request.getPeopleCount();
        int requestedStopCount = request.getTourStopCount();
        Integer shopTypeId = request.getShopTypeId();

        List<Shop> candidateShops = shopRepository.findAll().stream()
                .filter(Objects::nonNull)
                .filter(shop -> shop.getStatus() == Status.ACTIVE)
                .filter(shop -> shopTypeId == null
                        || (shop.getShopType() != null && Objects.equals(shop.getShopType().getId(), shopTypeId)))
                .collect(Collectors.toList());

        if (candidateShops.isEmpty()) {
            throw new AppException(ErrorCode.SHOP_NOT_FOUND);
        }

        if (shopTypeId == null) {
            Collections.shuffle(candidateShops);
        } else {
            candidateShops.sort(Comparator
                    .comparingInt(this::scoreShop)
                    .reversed()
                    .thenComparing(Shop::getId));
        }

        List<TourStopResponse> stopResponses = new ArrayList<>();
        int usedBudget = 0;
        int usedTime = 0;
        int stopIndex = 1;

        for (Shop shop : candidateShops) {
            if (stopResponses.size() >= requestedStopCount) {
                break;
            }

            int stopTime = safe(shop.getAvgWaitTimeMin()) + safe(shop.getAvgEatTimeMin());
            if (usedTime + stopTime > timeLimit) {
                continue;
            }

            List<Dish> dishes = dishRepository.findByShopIdAndStatus(shop.getId(), Status.ACTIVE);
            if (dishes == null || dishes.isEmpty()) {
                continue;
            }

            dishes.sort(Comparator
                    .comparing((Dish d) -> !Boolean.TRUE.equals(d.getIsSignature()))
                    .thenComparingInt(Dish::getPrice));

            int remainingBudget = effectiveBudget - usedBudget;
            List<TourStopItemResponse> itemResponses = pickDishesForShop(dishes, peopleCount, remainingBudget);

            if (itemResponses.isEmpty()) {
                continue;
            }

            int stopCost = itemResponses.stream()
                    .mapToInt(item -> safe(item.getPricePerUnit()) * safe(item.getQuantity()))
                    .sum();

            if (usedBudget + stopCost > effectiveBudget) {
                continue;
            }

            TourStopResponse stopResponse = TourStopResponse.builder()
                    .Id(null)
                    .tourPlanId(null)
                    .shopId(shop.getId())
                    .stopIndex(stopIndex)
                    .plannedCost(stopCost)
                    .timeToSpendInMinutes(stopTime)
                    .tourStopItems(itemResponses)
                    .build();

            stopResponses.add(stopResponse);
            usedBudget += stopCost;
            usedTime += stopTime;
            stopIndex++;
        }

        if (stopResponses.isEmpty()) {
            throw new AppException(ErrorCode.REQUEST_BODY_INVALID);
        }

        TourPlan tourPlan = TourPlan.builder()
                .customer(customer)
                .budgetTotal(requestedBudget)
                .tourStopCount(stopResponses.size())
                .timeTotalMin(usedTime)
                .peopleCount(peopleCount)
                .estCost(usedBudget)
                .createdAt(LocalDate.now())
                .status(Status.ACTIVE)
                .build();

        TourPlan savedTourPlan = tourPlanRepository.save(tourPlan);

        stopResponses.forEach(stop -> stop.setTourPlanId(savedTourPlan.getId()));

        return TourPlanResponse.builder()
                .id(savedTourPlan.getId())
                .customerId(customer.getId())
                .budgetTotal(savedTourPlan.getBudgetTotal())
                .tourStopCount(savedTourPlan.getTourStopCount())
                .timeTotalMin(savedTourPlan.getTimeTotalMin())
                .peopleCount(savedTourPlan.getPeopleCount())
                .estCost(savedTourPlan.getEstCost())
                .createdAt(savedTourPlan.getCreatedAt())
                .status(savedTourPlan.getStatus())
                .tourStops(stopResponses)
                .build();
    }

    private List<TourStopItemResponse> pickDishesForShop(List<Dish> dishes, int peopleCount, int remainingBudget) {
        List<TourStopItemResponse> items = new ArrayList<>();
        int shopBudgetUsed = 0;
        int maxDishPerShop = 2;

        for (Dish dish : dishes) {
            if (items.size() >= maxDishPerShop) {
                break;
            }

            int unitPrice = safe(dish.getPrice());
            int itemCost = unitPrice * peopleCount;
            if (itemCost <= 0) {
                continue;
            }

            if (shopBudgetUsed + itemCost > remainingBudget) {
                continue;
            }

            items.add(TourStopItemResponse.builder()
                    .id(null)
                    .tourStopId(null)
                    .dishId(dish.getId())
                    .quantity(peopleCount)
                    .pricePerUnit(unitPrice)
                    .build());

            shopBudgetUsed += itemCost;
        }

        return items;
    }

    private int scoreShop(Shop shop) {
        List<Dish> dishes = dishRepository.findByShopIdAndStatus(shop.getId(), Status.ACTIVE);
        long signatureCount = dishes.stream()
                .filter(d -> Boolean.TRUE.equals(d.getIsSignature()))
                .count();

        int avgDishPrice = dishes.isEmpty()
                ? safe(shop.getAvgCostPerPerson())
                : (int) dishes.stream().mapToInt(d -> safe(d.getPrice())).average().orElse(0);

        int waitPenalty = safe(shop.getAvgWaitTimeMin()) * 2;
        int eatPenalty = safe(shop.getAvgEatTimeMin());
        int pricePenalty = avgDishPrice / 10;

        return (int) (signatureCount * 100) - waitPenalty - eatPenalty - pricePenalty;
    }

    private void validateRequest(User customer, TourPlanCreationRequest request) {
        if (customer == null || customer.getId() == null || request == null) {
            throw new AppException(ErrorCode.REQUEST_BODY_INVALID);
        }

        if (safe(request.getBudgetTotal()) <= 0
                || safe(request.getTimeTotalMin()) <= 0
                || safe(request.getPeopleCount()) <= 0
                || safe(request.getTourStopCount()) <= 0) {
            throw new AppException(ErrorCode.REQUEST_BODY_INVALID);
        }
    }

    private int safe(Integer value) {
        return value == null ? 0 : value;
    }

}