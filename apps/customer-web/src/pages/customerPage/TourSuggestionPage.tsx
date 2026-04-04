/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TourRouteRealtimeMap from "../../components/tour/TourRouteRealtimeMap";
import { dishService } from "../../services/dishService";
import { shopService } from "../../services/shopService";
import { routePath } from "../../routes/route";
import { useAppDispatch, useAppSelector } from "../../stores/hooks";
import {
    createSuggestedTourThunk,
    deleteTourPlanThunk,
    fetchTourPlansThunk,
} from "../../stores/slices/tourSlice";
import type {
    TourPlanCreationRequest,
    TourPlanResponse,
    TourPlanView,
    TourStopItemView,
    TourStopView,
} from "../../types/tour";

const DEFAULT_PAGE_SIZE = 5;

const formatCurrency = (value?: number) =>
    `${(value ?? 0).toLocaleString("vi-VN")}đ`;

function TourSuggestionPage() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const {
        suggestedTour,
        historyTours,
        pagination,
        creating,
        loadingList,
        deleting,
        error,
    } = useAppSelector((state) => state.tour);

    const [page, setPage] = useState(1);
    const [enrichedSuggestedTour, setEnrichedSuggestedTour] = useState<TourPlanView | null>(null);

    const [form, setForm] = useState<TourPlanCreationRequest>({
        budgetTotal: 300000,
        timeTotalMin: 120,
        peopleCount: 2,
        tourStopCount: 3,
    });

    useEffect(() => {
        dispatch(
            fetchTourPlansThunk({
                page,
                size: DEFAULT_PAGE_SIZE,
                status: "ACTIVE",
            })
        );
    }, [dispatch, page]);

    useEffect(() => {
        if (!suggestedTour) {
            setEnrichedSuggestedTour(null);
            return;
        }

        void enrichTourPlan(suggestedTour).then(setEnrichedSuggestedTour);
    }, [suggestedTour]);

    const totalEstimatedItems = useMemo(() => {
        return (
            enrichedSuggestedTour?.tourStops.reduce(
                (sum, stop) => sum + stop.itemsDetailed.length,
                0
            ) ?? 0
        );
    }, [enrichedSuggestedTour]);

    const suggestedTourShops = useMemo(() => {
        return (enrichedSuggestedTour?.tourStops || [])
            .map((stop) => stop.shop)
            .filter((shop): shop is NonNullable<typeof shop> =>
                Boolean(shop && Number.isFinite(shop.lat) && Number.isFinite(shop.lng))
            );
    }, [enrichedSuggestedTour]);

    const handleInputNumber =
        (field: keyof TourPlanCreationRequest) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = Number(e.target.value);
            setForm((prev) => ({
                ...prev,
                [field]: Number.isNaN(value) ? 0 : value,
            }));
        };

    const handleCreateTour = async (e: React.FormEvent) => {
        e.preventDefault();

        const requestedStopCount = form.tourStopCount;
        const resultAction = await dispatch(createSuggestedTourThunk(form));
        if (createSuggestedTourThunk.fulfilled.match(resultAction)) {
            const generatedStopCount = resultAction.payload.tourStopCount ?? requestedStopCount;
            if (generatedStopCount < requestedStopCount) {
                alert(
                    `Không đủ dữ liệu để tạo ${requestedStopCount} điểm dừng. Hệ thống đã tự tạo tour ${generatedStopCount} điểm dừng phù hợp hơn.`
                );
            } else {
                alert("Đã tạo tour thành công");
            }
            dispatch(
                fetchTourPlansThunk({
                    page,
                    size: DEFAULT_PAGE_SIZE,
                    status: "ACTIVE",
                })
            );
        }
    };

    const handleDeleteTour = async (tourId: number) => {
        const confirmed = window.confirm("Bạn có chắc muốn xóa tour này không?");
        if (!confirmed) return;

        const resultAction = await dispatch(deleteTourPlanThunk(tourId));
        if (deleteTourPlanThunk.fulfilled.match(resultAction)) {
            alert("Đã xóa tour thành công");
            dispatch(
                fetchTourPlansThunk({
                    page,
                    size: DEFAULT_PAGE_SIZE,
                    status: "ACTIVE",
                })
            );
        }
    };

    const handleViewTourDetail = (tourId: number) => {
        navigate(routePath.tourDetailPage.replace(":tourId", String(tourId)));
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                <div className="mb-6 rounded-[32px] bg-gradient-to-r from-orange-50 via-white to-green-50 p-5 shadow-sm sm:p-6">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        Đề xuất tour ăn uống
                    </h1>
                    <p className="mt-2 text-sm text-slate-600 sm:text-base">
                        Nhập số người, thời gian và ngân sách để hệ thống gợi ý tour phù hợp.
                    </p>

                    <form onSubmit={handleCreateTour} className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-slate-700">
                                Ngân sách tổng
                            </span>
                            <input
                                type="number"
                                min={1}
                                value={form.budgetTotal}
                                onChange={handleInputNumber("budgetTotal")}
                                className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-green-500"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-slate-700">
                                Tổng thời gian (phút)
                            </span>
                            <input
                                type="number"
                                min={1}
                                value={form.timeTotalMin}
                                onChange={handleInputNumber("timeTotalMin")}
                                className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-green-500"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-slate-700">
                                Số người
                            </span>
                            <input
                                type="number"
                                min={1}
                                value={form.peopleCount}
                                onChange={handleInputNumber("peopleCount")}
                                className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-green-500"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-slate-700">
                                Số điểm dừng
                            </span>
                            <input
                                type="number"
                                min={1}
                                value={form.tourStopCount}
                                onChange={handleInputNumber("tourStopCount")}
                                className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-green-500"
                            />
                        </label>

                        <div className="md:col-span-2 xl:col-span-4">
                            <button
                                type="submit"
                                disabled={creating}
                                className="h-12 rounded-2xl bg-green-600 px-6 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {creating ? "Đang tạo tour..." : "Gợi ý tour"}
                            </button>
                        </div>
                    </form>

                    {error && (
                        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}
                </div>

                {enrichedSuggestedTour && (
                    <section className="mb-8 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                                    Tour vừa được đề xuất
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Tour #{enrichedSuggestedTour.id} • {enrichedSuggestedTour.tourStopCount} điểm dừng • {totalEstimatedItems} món gợi ý
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleViewTourDetail(enrichedSuggestedTour.id)}
                                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                                Xem chi tiết tour
                            </button>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <InfoCard label="Ngân sách yêu cầu" value={formatCurrency(enrichedSuggestedTour.budgetTotal)} />
                            <InfoCard label="Chi phí ước tính" value={formatCurrency(enrichedSuggestedTour.estCost)} />
                            <InfoCard label="Tổng thời gian" value={`${enrichedSuggestedTour.timeTotalMin} phút`} />
                            <InfoCard label="Số người" value={`${enrichedSuggestedTour.peopleCount} người`} />
                        </div>

                        {suggestedTourShops.length > 0 && (
                            <div className="mt-6">
                                <TourRouteRealtimeMap
                                    shops={suggestedTourShops}
                                    className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
                                />
                            </div>
                        )}

                        <div className="mt-6 space-y-4">
                            {enrichedSuggestedTour.tourStops.map((stop) => (
                                <TourStopCard key={`${stop.shopId}-${stop.stopIndex}`} stop={stop} />
                            ))}
                        </div>
                    </section>
                )}

                <section>
                    <div className="mb-4 flex items-end justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                                Lịch sử tour đã tạo
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Danh sách tour trước đây của bạn, có phân trang
                            </p>
                        </div>

                        <div className="text-sm text-slate-500">
                            Tổng {pagination.totalItems} tour
                        </div>
                    </div>

                    {loadingList ? (
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
                            Đang tải danh sách tour...
                        </div>
                    ) : historyTours.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
                            Bạn chưa có tour nào
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {historyTours.map((tour) => (
                                <div
                                    key={tour.id}
                                    className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
                                >
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">
                                                Tour #{tour.id}
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Tạo ngày {tour.createdAt} • {tour.tourStopCount} điểm dừng • {tour.peopleCount} người
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleViewTourDetail(tour.id)}
                                                className="rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
                                            >
                                                Xem chi tiết
                                            </button>

                                            <button
                                                type="button"
                                                disabled={deleting}
                                                onClick={() => handleDeleteTour(tour.id)}
                                                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                        <InfoCard label="Ngân sách" value={formatCurrency(tour.budgetTotal)} />
                                        <InfoCard label="Chi phí ước tính" value={formatCurrency(tour.estCost)} />
                                        <InfoCard label="Thời gian" value={`${tour.timeTotalMin} phút`} />
                                        <InfoCard label="Trạng thái" value={tour.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-6 flex items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                            disabled={page <= 1}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Trang trước
                        </button>

                        <span className="text-sm font-medium text-slate-700">
                            Trang {pagination.currentPage || page} / {pagination.totalPages || 1}
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                setPage((prev) =>
                                    prev < (pagination.totalPages || 1) ? prev + 1 : prev
                                )
                            }
                            disabled={page >= (pagination.totalPages || 1)}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Trang sau
                        </button>
                    </div>
                </section>
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

function TourStopCard({ stop }: { stop: TourStopView }) {
    return (
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50">
            <div className="grid gap-0 lg:grid-cols-[260px_1fr]">
                <div className="h-52 bg-slate-200">
                    <img
                        src={import.meta.env.VITE_SHOP_IMAGE_API + stop.shop?.imageName}
                        alt={stop.shop?.name || `Shop ${stop.shopId}`}
                        className="h-full w-full object-cover"
                    />
                </div>

                <div className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-green-700">
                                Điểm dừng {stop.stopIndex}
                            </p>
                            <h3 className="text-xl font-bold text-slate-900">
                                {stop.shop?.name || `Quán #${stop.shopId}`}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                                {stop.shop?.address || "Chưa có địa chỉ"}
                            </p>
                        </div>

                        <div className="grid gap-2 text-right text-sm text-slate-600">
                            <div>Chi phí dự kiến: <span className="font-semibold text-slate-900">{formatCurrency(stop.plannedCost)}</span></div>
                            <div>Thời gian ở lại: <span className="font-semibold text-slate-900">{stop.timeToSpendInMinutes} phút</span></div>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {stop.itemsDetailed.map((item) => (
                            <div
                                key={`${item.dishId}-${item.quantity}`}
                                className="rounded-2xl border border-slate-200 bg-white p-4"
                            >
                                <div className="flex items-start gap-3">
                                    <img
                                        src={import.meta.env.VITE_DISH_IMAGE_API + item.dish?.image}
                                        alt={item.dish?.name || `Dish ${item.dishId}`}
                                        className="h-20 w-20 rounded-2xl object-cover"
                                    />

                                    <div className="min-w-0 flex-1">
                                        <h4 className="truncate font-semibold text-slate-900">
                                            {item.dish?.name || `Món #${item.dishId}`}
                                        </h4>
                                        <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                                            {item.dish?.description || "Chưa có mô tả"}
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                            <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                                                SL: {item.quantity}
                                            </span>
                                            <span className="rounded-full bg-green-50 px-2 py-1 text-green-700">
                                                {formatCurrency(item.pricePerUnit)}/món
                                            </span>
                                            <span className="rounded-full bg-orange-50 px-2 py-1 text-orange-700">
                                                Tổng: {formatCurrency(item.totalCost)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
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

export default TourSuggestionPage;
