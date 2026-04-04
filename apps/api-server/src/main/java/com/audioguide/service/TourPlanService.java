package com.audioguide.service;

import com.audioguide.dto.apiDTO.PagingDto;
import com.audioguide.dto.tourPlanDTO.TourPlanCreationRequest;
import com.audioguide.dto.tourPlanDTO.TourPlanResponse;
import com.audioguide.dto.tourStopDTO.TourStopResponse;
import com.audioguide.dto.tourStopItemDTO.TourStopItemResponse;
import com.audioguide.entity.Dish;
import com.audioguide.entity.Shop;
import com.audioguide.entity.TourPlan;
import com.audioguide.entity.TourStop;
import com.audioguide.entity.TourStopItem;
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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
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

    public TourPlanResponse createSuggestedTourPlan(TourPlanCreationRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User customer = userRepository.findById(Integer.parseInt(authentication.getName()))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        validateRequest(customer, request);

        int budgetTotal = request.getBudgetTotal();
        int requestedStopCount = request.getTourStopCount();
        int peopleCount = request.getPeopleCount();
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

        Map<Integer, List<Dish>> dishesByShopId = new HashMap<>();
        for (Shop shop : candidateShops) {
            List<Dish> dishes = dishRepository.findByShopIdAndStatus(shop.getId(), Status.ACTIVE).stream()
                    .filter(Objects::nonNull)
                    .filter(d -> safe(d.getPrice()) > 0)
                    .sorted(Comparator
                            .comparing((Dish d) -> !Boolean.TRUE.equals(d.getIsSignature()))
                            .thenComparingInt(Dish::getPrice))
                    .collect(Collectors.toList());

            if (!dishes.isEmpty()) {
                dishesByShopId.put(shop.getId(), dishes);
            }
        }

        candidateShops = candidateShops.stream()
                .filter(shop -> dishesByShopId.containsKey(shop.getId()))
                .sorted(Comparator.comparingInt((Shop shop) ->
                        scoreShop(shop, dishesByShopId.get(shop.getId()), request)
                ).reversed())
                .collect(Collectors.toList());

        if (candidateShops.size() < requestedStopCount) {
            log.warn("Not enough candidate shops to fulfill the requested stop count. Candidates: {}, Requested: {}",
                    candidateShops.size(), requestedStopCount);
            throw new AppException(ErrorCode.REQUEST_BODY_INVALID);
        }

        List<TourStop> chosenStops = buildTour(candidateShops, dishesByShopId, request);
        if (chosenStops.size() != requestedStopCount) {
                log.warn("Could not build a tour plan with the requested stop count. Chosen stops: {}, Requested: {}",
                        chosenStops.size(), requestedStopCount);
            throw new AppException(ErrorCode.REQUEST_BODY_INVALID);
        }

        int estCost = chosenStops.stream().mapToInt(TourStop::getPlannedCost).sum();
        int totalTime = chosenStops.stream().mapToInt(TourStop::getTimeToSpendInMinutes).sum();

        TourPlan tourPlan = TourPlan.builder()
                .customer(customer)
                .budgetTotal(budgetTotal)
                .tourStopCount(chosenStops.size())
                .timeTotalMin(totalTime)
                .peopleCount(peopleCount)
                .estCost(estCost)
                .createdAt(LocalDate.now())
                .status(Status.ACTIVE)
                .build();

        if (tourPlan.getTourStops() == null) {
            tourPlan.setTourStops(new ArrayList<>());
        }

        for (int i = 0; i < chosenStops.size(); i++) {
            TourStop stop = chosenStops.get(i);
            stop.setTourPlan(tourPlan);
            stop.setStopIndex(i + 1);

            if (stop.getTourStopItems() != null) {
                for (TourStopItem item : stop.getTourStopItems()) {
                    item.setTourStop(stop);
                }
            }

            tourPlan.getTourStops().add(stop);
        }

        TourPlan savedTourPlan = tourPlanRepository.save(tourPlan);

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
                .tourStops(toTourStopResponses(savedTourPlan.getTourStops()))
                .build();
    }

    private List<TourStop> buildTour(List<Shop> candidateShops,
                                     Map<Integer, List<Dish>> dishesByShopId,
                                     TourPlanCreationRequest request) {
        int budgetLeft = request.getBudgetTotal();
        int timeLeft = request.getTimeTotalMin();
        int stopLeft = request.getTourStopCount();
        int peopleCount = request.getPeopleCount();

        List<TourStop> result = new ArrayList<>();
        Set<Integer> usedShopIds = new HashSet<>();

        while (stopLeft > 0) {
            TourStop bestStop = null;
            int bestScore = Integer.MIN_VALUE;

            for (Shop shop : candidateShops) {
                if (usedShopIds.contains(shop.getId())) {
                    continue;
                }

                int stopTime = estimateStopTime(shop);
                if (stopTime <= 0 || stopTime > timeLeft) {
                    continue;
                }

                int targetBudgetForThisStop = Math.max(1, budgetLeft / stopLeft);
                List<Dish> dishes = dishesByShopId.get(shop.getId());
                List<TourStopItem> items = pickDishesForShop(dishes, peopleCount, targetBudgetForThisStop, budgetLeft);
                if (items.isEmpty()) {
                    continue;
                }

                int stopCost = items.stream()
                        .mapToInt(item -> safe(item.getPricePerUnit()) * safe(item.getQuantity()))
                        .sum();

                if (stopCost > budgetLeft) {
                    continue;
                }

                int remainingBudget = budgetLeft - stopCost;
                int remainingTime = timeLeft - stopTime;
                int remainingStops = stopLeft - 1;

                if (!canStillComplete(candidateShops, dishesByShopId, usedShopIds, shop.getId(),
                        remainingBudget, remainingTime, remainingStops, peopleCount)) {
                    continue;
                }

                int targetTimeForThisStop = Math.max(1, timeLeft / stopLeft);
                int score = scoreChosenStop(shop, dishes, stopCost, stopTime,
                        targetBudgetForThisStop, targetTimeForThisStop);

                if (score > bestScore) {
                    bestScore = score;
                    bestStop = TourStop.builder()
                            .shop(shop)
                            .plannedCost(stopCost)
                            .timeToSpendInMinutes(stopTime)
                            .tourStopItems(items)
                            .build();
                }
            }

            if (bestStop == null) {
                break;
            }

            if (bestStop.getTourStopItems() != null) {
                for (TourStopItem item : bestStop.getTourStopItems()) {
                    item.setTourStop(bestStop);
                }
            }

            result.add(bestStop);
            usedShopIds.add(bestStop.getShop().getId());
            budgetLeft -= bestStop.getPlannedCost();
            timeLeft -= bestStop.getTimeToSpendInMinutes();
            stopLeft--;
        }

        return result;
    }

    private boolean canStillComplete(List<Shop> candidateShops,
                                     Map<Integer, List<Dish>> dishesByShopId,
                                     Set<Integer> usedShopIds,
                                     Integer currentShopId,
                                     int budgetLeft,
                                     int timeLeft,
                                     int remainingStops,
                                     int peopleCount) {
        if (remainingStops <= 0) {
            return true;
        }

        List<Integer> feasibleCosts = new ArrayList<>();
        List<Integer> feasibleTimes = new ArrayList<>();

        for (Shop shop : candidateShops) {
            if (usedShopIds.contains(shop.getId()) || Objects.equals(shop.getId(), currentShopId)) {
                continue;
            }

            int stopTime = estimateStopTime(shop);
            if (stopTime <= 0 || stopTime > timeLeft) {
                continue;
            }

            int targetBudgetForThisStop = Math.max(1, budgetLeft / remainingStops);
            List<Dish> dishes = dishesByShopId.get(shop.getId());
            List<TourStopItem> items = pickDishesForShop(dishes, peopleCount, targetBudgetForThisStop, budgetLeft);
            if (items.isEmpty()) {
                continue;
            }

            int stopCost = items.stream()
                    .mapToInt(item -> safe(item.getPricePerUnit()) * safe(item.getQuantity()))
                    .sum();

            if (stopCost <= budgetLeft) {
                feasibleCosts.add(stopCost);
                feasibleTimes.add(stopTime);
            }
        }

        if (feasibleCosts.size() < remainingStops || feasibleTimes.size() < remainingStops) {
            return false;
        }

        feasibleCosts.sort(Integer::compareTo);
        feasibleTimes.sort(Integer::compareTo);

        int minBudgetNeeded = feasibleCosts.stream()
                .limit(remainingStops)
                .mapToInt(Integer::intValue)
                .sum();

        int minTimeNeeded = feasibleTimes.stream()
                .limit(remainingStops)
                .mapToInt(Integer::intValue)
                .sum();

        return minBudgetNeeded <= budgetLeft && minTimeNeeded <= timeLeft;
    }

    private List<TourStopItem> pickDishesForShop(List<Dish> dishes,
                                                 int peopleCount,
                                                 int targetBudgetForStop,
                                                 int hardBudgetLeft) {
        if (dishes == null || dishes.isEmpty()) {
            return new ArrayList<>();
        }

        int tastingQuantity = Math.max(1, (int) Math.ceil(peopleCount / 2.0));
        int absoluteBudget = Math.min(targetBudgetForStop, hardBudgetLeft);
        List<TourStopItem> items = new ArrayList<>();
        int used = 0;

        Dish firstDish = dishes.stream()
                .filter(d -> safe(d.getPrice()) * tastingQuantity <= absoluteBudget)
                .findFirst()
                .orElse(null);

        if (firstDish == null) {
            return new ArrayList<>();
        }

        items.add(buildTourStopItem(firstDish, tastingQuantity));
        used += safe(firstDish.getPrice()) * tastingQuantity;

        final int usedBudget = used;
        final Integer firstDishId = firstDish.getId();

        Dish secondDish = dishes.stream()
                .filter(d -> !Objects.equals(d.getId(), firstDishId))
                .filter(d -> safe(d.getPrice()) * tastingQuantity + usedBudget <= absoluteBudget)
                .findFirst()
                .orElse(null);

        if (secondDish != null) {
            items.add(buildTourStopItem(secondDish, tastingQuantity));
        }

        return items;
    }

    private TourStopItem buildTourStopItem(Dish dish, int quantity) {
        return TourStopItem.builder()
                .dish(dish)
                .quantity(quantity)
                .pricePerUnit(safe(dish.getPrice()))
                .build();
    }

    private int scoreShop(Shop shop, List<Dish> dishes, TourPlanCreationRequest request) {
        int timePenalty = estimateStopTime(shop);
        int perStopBudget = Math.max(1, request.getBudgetTotal() / request.getTourStopCount());
        int tastingQuantity = Math.max(1, (int) Math.ceil(request.getPeopleCount() / 2.0));

        int cheapestDishCost = dishes.stream()
                .mapToInt(d -> safe(d.getPrice()) * tastingQuantity)
                .min()
                .orElse(Integer.MAX_VALUE);

        long signatureCount = dishes.stream()
                .filter(d -> Boolean.TRUE.equals(d.getIsSignature()))
                .count();

        int budgetFitBonus = 100 - Math.min(100, Math.abs(perStopBudget - cheapestDishCost) / 10000);

        return (int) (signatureCount * 100) + budgetFitBonus - timePenalty;
    }

    private int scoreChosenStop(Shop shop,
                                List<Dish> dishes,
                                int stopCost,
                                int stopTime,
                                int targetBudget,
                                int targetTime) {
        long signatureCount = dishes.stream()
                .filter(d -> Boolean.TRUE.equals(d.getIsSignature()))
                .count();

        int budgetPenalty = Math.abs(targetBudget - stopCost) / 1000;
        int timePenalty = Math.abs(targetTime - stopTime);

        return (int) (signatureCount * 100) - budgetPenalty - timePenalty;
    }

    private List<TourStopResponse> toTourStopResponses(List<TourStop> tourStops) {
        if (tourStops == null) {
            return new ArrayList<>();
        }

        return tourStops.stream()
                .sorted(Comparator.comparingInt(TourStop::getStopIndex))
                .map(stop -> TourStopResponse.builder()
                        .id(stop.getId())
                        .tourPlanId(stop.getTourPlan() == null ? null : stop.getTourPlan().getId())
                        .shopId(stop.getShop() == null ? null : stop.getShop().getId())
                        .stopIndex(stop.getStopIndex())
                        .plannedCost(stop.getPlannedCost())
                        .timeToSpendInMinutes(stop.getTimeToSpendInMinutes())
                        .tourStopItems(toTourStopItemResponses(stop.getTourStopItems(), stop.getId()))
                        .build())
                .collect(Collectors.toList());
    }

    private List<TourStopItemResponse> toTourStopItemResponses(List<TourStopItem> items, Integer tourStopId) {
        if (items == null) {
            return new ArrayList<>();
        }

        return items.stream()
                .map(item -> TourStopItemResponse.builder()
                        .id(item.getId())
                        .tourStopId(tourStopId)
                        .dishId(item.getDish() == null ? null : item.getDish().getId())
                        .quantity(item.getQuantity())
                        .pricePerUnit(item.getPricePerUnit())
                        .build())
                .collect(Collectors.toList());
    }

    private int estimateStopTime(Shop shop) {
        return safe(shop.getAvgWaitTimeMin()) + safe(shop.getAvgEatTimeMin());
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


    public TourPlanResponse getTourPlanById(Integer tourPlanId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Integer customerId = Integer.parseInt(authentication.getName());

        userRepository.findById(customerId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        TourPlan tourPlan = tourPlanRepository.findByIdAndCustomerId(tourPlanId, customerId)
                .orElseThrow(() -> new AppException(ErrorCode.TOUR_PLAN_NOT_FOUND));

        return TourPlanResponse.builder()
                .id(tourPlan.getId())
                .customerId(tourPlan.getCustomer() == null ? null : tourPlan.getCustomer().getId())
                .budgetTotal(tourPlan.getBudgetTotal())
                .tourStopCount(tourPlan.getTourStopCount())
                .timeTotalMin(tourPlan.getTimeTotalMin())
                .peopleCount(tourPlan.getPeopleCount())
                .estCost(tourPlan.getEstCost())
                .createdAt(tourPlan.getCreatedAt())
                .status(tourPlan.getStatus())
                .tourStops(toTourStopResponses(tourPlan.getTourStops()))
                .build();
    }

    public PagingDto<TourPlanResponse> getAllTourPlans(Integer page, Integer size, Status status) {
        if (page == null || page < 1) {
            throw new AppException(ErrorCode.INVALID_PAGE_NUMBER);
        }
        if (size == null || size < 1) {
            throw new AppException(ErrorCode.INVALID_PAGE_SIZE);
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Integer customerId = Integer.parseInt(authentication.getName());

        userRepository.findById(customerId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Pageable pageable = PageRequest.of(page - 1, size);

        var tourPlanPage = status == null
                ? tourPlanRepository.findAllByCustomerIdOrderByCreatedAtDescIdDesc(customerId, pageable)
                : tourPlanRepository.findAllByCustomerIdAndStatusOrderByCreatedAtDescIdDesc(customerId, status, pageable);

        List<TourPlanResponse> items = tourPlanPage.getContent().stream()
                .map(tourPlan -> TourPlanResponse.builder()
                        .id(tourPlan.getId())
                        .customerId(tourPlan.getCustomer() == null ? null : tourPlan.getCustomer().getId())
                        .budgetTotal(tourPlan.getBudgetTotal())
                        .tourStopCount(tourPlan.getTourStopCount())
                        .timeTotalMin(tourPlan.getTimeTotalMin())
                        .peopleCount(tourPlan.getPeopleCount())
                        .estCost(tourPlan.getEstCost())
                        .createdAt(tourPlan.getCreatedAt())
                        .status(tourPlan.getStatus())
                        .tourStops(toTourStopResponses(tourPlan.getTourStops()))
                        .build())
                .collect(Collectors.toList());

        return new PagingDto<>(
                items,
                tourPlanPage.getTotalElements(),
                tourPlanPage.getNumber() + 1,
                tourPlanPage.getSize(),
                tourPlanPage.getTotalPages()
        );
    }

    public void deleteTourPlan(Integer tourPlanId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Integer customerId = Integer.parseInt(authentication.getName());

        userRepository.findById(customerId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        TourPlan tourPlan = tourPlanRepository.findByIdAndCustomerId(tourPlanId, customerId)
                .orElseThrow(() -> new AppException(ErrorCode.TOUR_PLAN_NOT_FOUND));

        if (tourPlan.getStatus() == Status.DELETED) {
            return;
        }

        tourPlan.setStatus(Status.DELETED);
        tourPlanRepository.save(tourPlan);
    }
}
