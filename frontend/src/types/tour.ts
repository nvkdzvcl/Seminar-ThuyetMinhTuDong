import type { Dish } from "./dish";
import type { ShopResponse } from "./shop";

export type TourPlanStatus = "ACTIVE" | "DELETED" ;

export type TourPlanCreationRequest = {
    budgetTotal: number;
    timeTotalMin: number;
    peopleCount: number;
    tourStopCount: number;
    shopTypeId?: number | null;
};

export type TourStopItemResponse = {
    id: number | null;
    tourStopId: number | null;
    dishId: number;
    quantity: number;
    pricePerUnit: number;
};

export type TourStopResponse = {
    id: number | null;
    tourPlanId: number | null;
    shopId: number;
    stopIndex: number;
    plannedCost: number;
    timeToSpendInMinutes: number;
    tourStopItems: TourStopItemResponse[];
};

export type TourPlanResponse = {
    id: number;
    customerId: number;
    budgetTotal: number;
    tourStopCount: number;
    timeTotalMin: number;
    peopleCount: number;
    estCost: number;
    createdAt: string;
    status: TourPlanStatus;
    tourStops: TourStopResponse[];
};

export type TourStopItemView = TourStopItemResponse & {
    dish?: Dish | null;
    totalCost: number;
};

export type TourStopView = TourStopResponse & {
    shop?: ShopResponse | null;
    itemsDetailed: TourStopItemView[];
};

export type TourPlanView = Omit<TourPlanResponse, "tourStops"> & {
    tourStops: TourStopView[];
};