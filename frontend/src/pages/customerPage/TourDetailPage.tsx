import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { dishService } from "../../services/dishService";
import { shopService } from "../../services/shopService";
import { routePath } from "../../routes/route";
import { useAppDispatch, useAppSelector } from "../../stores/hooks";
import { fetchTourPlanByIdThunk } from "../../stores/slices/tourSlice";
import TourRouteRealtimeMap from "../../components/tour/TourRouteRealtimeMap";
import type {
    TourPlanResponse,
    TourPlanView,
    TourStopItemView,
    TourStopView,
} from "../../types/tour";
import type { ShopResponse } from "../../types/shop";

const formatCurrency = (value?: number) =>
    `${(value ?? 0).toLocaleString("vi-VN")}đ`;

function TourDetailPage() {
    const { tourId } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const parsedTourId = Number(tourId);
    const { currentTour, loadingDetail, error } = useAppSelector((state) => state.tour);
    const [tourView, setTourView] = useState<TourPlanView | null>(null);

    useEffect(() => {
        if (!parsedTourId || Number.isNaN(parsedTourId)) return;
        void dispatch(fetchTourPlanByIdThunk(parsedTourId));
    }, [dispatch, parsedTourId]);

    useEffect(() => {
        if (!currentTour) {
            setTourView(null);
            return;
        }

        void enrichTourPlan(currentTour).then(setTourView);
    }, [currentTour]);

    const orderedTourShops = useMemo<ShopResponse[]>(() => {
        return (tourView?.tourStops || [])
            .slice()
            .sort((a, b) => a.stopIndex - b.stopIndex)
            .map((stop) => stop.shop)
            .filter((shop): shop is ShopResponse => !!shop);
    }, [tourView]);

    if (loadingDetail && !tourView) {
        return (
            <div className="min-h-screen bg-slate-50 p-6 text-sm text-slate-500">
                Đang tải chi tiết tour...
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 p-6">
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            </div>
        );
    }

    if (!tourView) return null;

    const totalDishes = tourView.tourStops.reduce(
        (sum, stop) => sum + stop.itemsDetailed.length,
        0
    );

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Chi tiết tour #{tourView.id}
                        </h1>
                        <p className="mt-2 text-sm text-slate-600">
                            {tourView.tourStopCount} điểm dừng • {totalDishes} món • tạo ngày {tourView.createdAt}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate(routePath.tourSuggestPage)}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        Về trang tour
                    </button>
                </div>

                <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        <InfoCard label="Ngân sách tổng" value={formatCurrency(tourView.budgetTotal)} />
                        <InfoCard label="Chi phí ước tính" value={formatCurrency(tourView.estCost)} />
                        <InfoCard label="Tổng thời gian" value={`${tourView.timeTotalMin} phút`} />
                        <InfoCard label="Số người" value={`${tourView.peopleCount} người`} />
                        <InfoCard label="Trạng thái" value={tourView.status} />
                    </div>
                </div>

                <div className="mt-8">
                    <TourRouteRealtimeMap shops={orderedTourShops} />
                </div>

                <div className="mt-8 space-y-5">
                    {tourView.tourStops.map((stop) => (
                        <div
                            key={`${stop.shopId}-${stop.stopIndex}`}
                            className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm"
                        >
                            <div className="grid gap-0 lg:grid-cols-[320px_1fr]">
                                <div className="h-64 bg-slate-100">
                                    <img
                                        src={import.meta.env.VITE_SHOP_IMAGE_API + stop.shop?.imageName}
                                        alt={stop.shop?.name || `Shop ${stop.shopId}`}
                                        className="h-full w-full object-cover"
                                    />
                                </div>

                                <div className="p-5 sm:p-6">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <div className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                                                Điểm dừng {stop.stopIndex}
                                            </div>

                                            <h2 className="mt-3 text-2xl font-bold text-slate-900">
                                                {stop.shop?.name || `Quán #${stop.shopId}`}
                                            </h2>

                                            <p className="mt-2 text-sm text-slate-600">
                                                {stop.shop?.address || "Chưa có địa chỉ"}
                                            </p>

                                            <p className="mt-2 text-sm text-slate-500">
                                                {stop.shop?.description || "Chưa có mô tả quán"}
                                            </p>
                                        </div>

                                        <div className="grid gap-2 text-sm text-slate-600">
                                            <div>
                                                Chi phí dự kiến:{" "}
                                                <span className="font-semibold text-slate-900">
                                                    {formatCurrency(stop.plannedCost)}
                                                </span>
                                            </div>
                                            <div>
                                                Thời gian ở lại:{" "}
                                                <span className="font-semibold text-slate-900">
                                                    {stop.timeToSpendInMinutes} phút
                                                </span>
                                            </div>
                                            {!!stop.shop?.avgCostPerPerson && (
                                                <div>
                                                    TB/người:{" "}
                                                    <span className="font-semibold text-slate-900">
                                                        {formatCurrency(stop.shop.avgCostPerPerson)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <h3 className="text-lg font-bold text-slate-900">
                                            Các món gợi ý tại quán này
                                        </h3>

                                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                                            {stop.itemsDetailed.map((item) => (
                                                <div
                                                    key={`${item.dishId}-${item.quantity}`}
                                                    className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                                                >
                                                    <div className="flex gap-4">
                                                        <img
                                                            src={import.meta.env.VITE_DISH_IMAGE_API + item.dish?.image}
                                                            alt={item.dish?.name || `Dish ${item.dishId}`}
                                                            className="h-24 w-24 rounded-2xl object-cover"
                                                        />

                                                        <div className="min-w-0 flex-1">
                                                            <h4 className="truncate text-base font-bold text-slate-900">
                                                                {item.dish?.name || `Món #${item.dishId}`}
                                                            </h4>

                                                            <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                                                                {item.dish?.description || "Chưa có mô tả món"}
                                                            </p>

                                                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                                                <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                                                                    SL: {item.quantity}
                                                                </span>
                                                                <span className="rounded-full bg-green-50 px-2 py-1 text-green-700">
                                                                    {formatCurrency(item.pricePerUnit)}/món
                                                                </span>
                                                                <span className="rounded-full bg-orange-50 px-2 py-1 text-orange-700">
                                                                    Tổng: {formatCurrency(item.totalCost)}
                                                                </span>
                                                            </div>

                                                            {item.dish?.shopId && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        navigate(
                                                                            routePath.dishDetailPage.replace(
                                                                                ":dishId",
                                                                                String(item.dish?.id)
                                                                            )
                                                                        )
                                                                    }
                                                                    className="mt-3 rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                                                                >
                                                                    Xem món
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {stop.shop?.id && (
                                        <div className="mt-5">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    navigate(
                                                        routePath.ShopDetailPage.replace(
                                                            ":shopId",
                                                            String(stop.shop?.id)
                                                        )
                                                    )
                                                }
                                                className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-100"
                                            >
                                                Xem chi tiết quán
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function InfoCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 font-semibold text-slate-900">{value}</p>
        </div>
    );
}

async function enrichTourPlan(tour: TourPlanResponse): Promise<TourPlanView> {
    const enrichedStops: TourStopView[] = await Promise.all(
        tour.tourStops.map(async (stop) => {
            const shopPromise = shopService
                .getShopById(stop.shopId)
                .then((res) => res.result ?? null)
                .catch(() => null);

            const itemsDetailedPromise = Promise.all(
                stop.tourStopItems.map(async (item): Promise<TourStopItemView> => {
                    const dish = await dishService
                        .getDishById(item.dishId)
                        .then((res) => res.result ?? null)
                        .catch(() => null);

                    return {
                        ...item,
                        dish,
                        totalCost: (item.pricePerUnit ?? 0) * (item.quantity ?? 0),
                    };
                })
            );

            const [shop, itemsDetailed] = await Promise.all([shopPromise, itemsDetailedPromise]);

            return {
                ...stop,
                shop,
                itemsDetailed,
            };
        })
    );

    return {
        ...tour,
        tourStops: enrichedStops,
    };
}

export default TourDetailPage;
