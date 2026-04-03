import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import DishCard from "../../components/ui/DishCard";
import SectionTitle from "../../components/home/SectionTitle";
import ShopMap from "../../components/shop/ShopMap";
import SimplePagination from "../../components/common/SimplePagination";
import { dishService } from "../../services/dishService";
import { orderService } from "../../services/orderService";
import { shopService } from "../../services/shopService";
import type { Dish } from "../../types/dish";
import type { ShopResponse } from "../../types/shop";
import { useAudioPlayer } from "../../stores/useAudioPlayer";
import { resolvePreferredLanguage } from "../../utils/language";
import { resolveBackendAudioUrl, resolveMediaUrl } from "../../utils/media";
import { notifyError, notifyInfo, notifySuccess, notifyWarning } from "../../utils/notify";
import { routePath } from "../../routes/route";

function resolveRequestErrorMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError(error)) {
        const responseData = error.response?.data as { message?: string; code?: string } | undefined;
        if (responseData?.message) {
            return responseData.message;
        }
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
}

function isAutoplayBlockedError(error: unknown): boolean {
    if (error instanceof DOMException && error.name === "NotAllowedError") {
        return true;
    }

    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return message.includes("notallowederror") || message.includes("didn't interact");
    }

    return false;
}

function ShopDetailPage() {
    const navigate = useNavigate();
    const { shopId } = useParams();
    const [searchParams] = useSearchParams();
    const { currentAudio, isAudioPlaying, toggleAudio } = useAudioPlayer();
    const parsedShopId = Number(shopId);
    const requestedLanguage = searchParams.get("lang");
    const shouldAutoplayNarration = searchParams.get("autoplay") === "1";
    const hasAutoplayTriggeredRef = useRef(false);
    const menuSectionRef = useRef<HTMLDivElement | null>(null);

    const [shop, setShop] = useState<ShopResponse | null>(null);
    const [nearbyShops, setNearbyShops] = useState<ShopResponse[]>([]);
    const [shopDishes, setShopDishes] = useState<Dish[]>([]);
    const [otherDishes, setOtherDishes] = useState<Dish[]>([]);
    const [dishPage, setDishPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [pageError, setPageError] = useState("");
    const [isGeneratingNarration, setIsGeneratingNarration] = useState(false);
    const [activeNarrationLanguage, setActiveNarrationLanguage] = useState("en-US");
    const [needsUserGestureToPlay, setNeedsUserGestureToPlay] = useState(false);
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    const [pendingQuantities, setPendingQuantities] = useState<Record<number, number>>({});
    const [selectedOrderItems, setSelectedOrderItems] = useState<Record<number, number>>({});
    const shopImageSrc = resolveMediaUrl(
        shop?.imageName,
        import.meta.env.VITE_SHOP_IMAGE_API,
        "https://placehold.co/1200x800?text=Shop",
        "uploads/shop-images"
    );
    const displayDescription = shop?.shortDescription || "Chưa cập nhật mô tả ngắn";

    const [currentPosition, setCurrentPosition] = useState<[number, number]>([
        10.7130418,106.6189652,
    ]);

    useEffect(() => {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCurrentPosition([position.coords.latitude, position.coords.longitude]);
            },
            () => {}
        );
    }, []);

    useEffect(() => {
        if (!parsedShopId) return;

        const loadShop = async () => {
            try {
                setLoading(true);
                setPageError("");

                const shopRes = await shopService.getShopById(parsedShopId);
                const shopData = shopRes.result;
                setShop(shopData);

                if (!shopData) {
                    setPageError("Không thể tải thông tin quán");
                    return;
                }

                const [nearbyRes, shopDishRes, otherDishRes] = await Promise.all([
                    shopService.getNearbyShops(shopData.lat, shopData.lng, 2, 1, 20),
                    dishService.getByShopId(parsedShopId, "ACTIVE", dishPage, 10),
                    dishService.getByIsSignatureDish(false, "ACTIVE", 1, 10),
                ]);

                setNearbyShops(nearbyRes.result?.items ?? []);
                setShopDishes(shopDishRes.result?.items ?? []);
                setOtherDishes(otherDishRes.result?.items?.filter((d) => d.shopId !== parsedShopId) ?? []);
            } catch {
                setPageError("Không thể tải thông tin quán");
            } finally {
                setLoading(false);
            }
        };

        loadShop();
    }, [parsedShopId, dishPage]);

    const handleNavigate = (dishId: number) => {
        console.log("Chỉ đường tới quán của món", dishId);
    };

    const handleListenAudio = async (dishId: number) => {
        const targetDish = [...shopDishes, ...otherDishes].find((dish) => dish.id === dishId);
        if (!targetDish) return;

        try {
            const preferredLanguage = resolvePreferredLanguage(requestedLanguage);
            const narrationRes = await dishService.getDishNarration(targetDish.id, preferredLanguage);
            const narration = narrationRes.result;
            const narrationAudioUrl = resolveBackendAudioUrl(narration?.audioUrl);
            if (!narrationAudioUrl) {
                notifyWarning(`Không tạo được audio cho món ${targetDish.name}.`);
                return;
            }

            await toggleAudio({
                id: targetDish.id,
                type: "DISH",
                url: narrationAudioUrl,
                title: targetDish.name,
                shopId: targetDish.shopId,
                transcript: narration?.script,
                transcriptLanguage: narration?.language,
            });
        } catch (error) {
            console.error("Nghe audio món lỗi", error);
            notifyError(
                resolveRequestErrorMessage(error, `Không thể phát audio của món ${targetDish.name}. Vui lòng thử lại.`)
            );
        }
    };

    const handleViewMenu = (dishId: number) => {
        console.log("Xem món", dishId);
    };

    const selectedOrderEntries = useMemo(() => {
        return Object.entries(selectedOrderItems)
            .map(([dishIdRaw, quantity]) => {
                const dishId = Number(dishIdRaw);
                const dish = shopDishes.find((item) => item.id === dishId);
                if (!dish || quantity <= 0) {
                    return null;
                }
                return {
                    dish,
                    quantity,
                };
            })
            .filter((entry): entry is { dish: Dish; quantity: number } => Boolean(entry));
    }, [selectedOrderItems, shopDishes]);

    const selectedOrderCount = useMemo(() => {
        return selectedOrderEntries.reduce((total, item) => total + item.quantity, 0);
    }, [selectedOrderEntries]);

    const selectedOrderTotal = useMemo(() => {
        return selectedOrderEntries.reduce(
            (total, item) => total + Number(item.dish.price || 0) * item.quantity,
            0
        );
    }, [selectedOrderEntries]);

    const updatePendingQuantity = (dishId: number, delta: number) => {
        setPendingQuantities((current) => {
            const nextValue = Math.max(1, (current[dishId] ?? 1) + delta);
            return {
                ...current,
                [dishId]: nextValue,
            };
        });
    };

    const addDishToOrderDraft = (dish: Dish) => {
        const quantity = Math.max(1, pendingQuantities[dish.id] ?? 1);
        setSelectedOrderItems((current) => ({
            ...current,
            [dish.id]: (current[dish.id] ?? 0) + quantity,
        }));
        setPendingQuantities((current) => ({
            ...current,
            [dish.id]: 1,
        }));
    };

    const removeDishFromOrderDraft = (dishId: number) => {
        setSelectedOrderItems((current) => {
            const clone = { ...current };
            delete clone[dishId];
            return clone;
        });
    };

    const handleCreateOrder = async () => {
        if (!shop) {
            return;
        }

        if (selectedOrderEntries.length === 0) {
            notifyWarning("Vui lòng chọn ít nhất 1 món trước khi đặt.");
            return;
        }

        try {
            setIsCreatingOrder(true);
            const createPayload = {
                shopId: shop.id,
                orderItems: selectedOrderEntries.map((item) => ({
                    dishId: item.dish.id,
                    quantity: item.quantity,
                })),
            };

            const response = await orderService.createOrder(createPayload);
            if (!response.result) {
                throw new Error(response.message || "Không thể tạo đơn hàng.");
            }

            notifySuccess("Đặt món thành công. Quán đã nhận đơn của bạn.");
            setSelectedOrderItems({});
            setPendingQuantities({});
            navigate(`${routePath.orderPage}?newOrderId=${response.result.id}`);
        } catch (error) {
            notifyError(resolveRequestErrorMessage(error, "Đặt món thất bại. Vui lòng thử lại."));
        } finally {
            setIsCreatingOrder(false);
        }
    };

    const handleBackToShopList = () => {
        if (window.history.length > 1) {
            navigate(-1);
            return;
        }
        navigate(routePath.shopSearchPage);
    };

    const handleScrollToMenu = () => {
        menuSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const playShopNarration = useCallback(async () => {
        if (!shop) return;

        const preferredLanguage = resolvePreferredLanguage(requestedLanguage);
        setActiveNarrationLanguage(preferredLanguage);
        setIsGeneratingNarration(true);

        try {
            const narrationRes = await shopService.getShopNarration(shop.id, preferredLanguage);
            const narration = narrationRes.result;
            const narrationAudioUrl = resolveBackendAudioUrl(narration?.audioUrl);
            setActiveNarrationLanguage(narration?.language || preferredLanguage);

            if (!narrationAudioUrl) {
                notifyWarning("Không tạo được audio thuyết minh cho quán.");
                return;
            }

            await toggleAudio({
                id: shop.id,
                type: "SHOP",
                url: narrationAudioUrl,
                title: shop.name,
                shopId: shop.id,
                transcript: narration?.script,
                transcriptLanguage: narration?.language,
            });
            setNeedsUserGestureToPlay(false);
        } catch (error) {
            console.error("Play shop narration failed", error);

            if (isAutoplayBlockedError(error)) {
                setNeedsUserGestureToPlay(true);
                if (!shouldAutoplayNarration) {
                    notifyInfo("Trình duyệt yêu cầu bạn tương tác trước khi phát. Hãy bấm lại nút phát audio.");
                }
                return;
            }

            const message = resolveRequestErrorMessage(
                error,
                "Không thể tạo audio theo ngôn ngữ đã chọn. Vui lòng thử lại."
            );
            notifyError(message);
        } finally {
            setIsGeneratingNarration(false);
        }
    }, [requestedLanguage, shop, shouldAutoplayNarration, toggleAudio]);

    useEffect(() => {
        if (!shop || !shouldAutoplayNarration || hasAutoplayTriggeredRef.current) {
            return;
        }
        hasAutoplayTriggeredRef.current = true;
        void playShopNarration();
    }, [playShopNarration, shop, shouldAutoplayNarration]);

    if (loading && !shop) {
        return <div className="p-6 text-sm text-slate-500">Đang tải thông tin quán...</div>;
    }

    if (pageError) {
        return (
            <div className="p-6">
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {pageError}
                </div>
            </div>
        );
    }

    if (!shop) return null;

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={handleBackToShopList}
                        aria-label="Quay lại chọn quán"
                        title="Quay lại chọn quán"
                        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        <span aria-hidden="true">←</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleScrollToMenu}
                        className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                        Xem menu quán
                    </button>
                </div>

                <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="grid gap-0 lg:grid-cols-[1.2fr_1fr]">
                        <div className="h-[280px] bg-slate-100 sm:h-[360px]">
                            <img
                                src={shopImageSrc}
                                alt={shop.name}
                                className="h-full w-full object-cover"
                            />
                        </div>

                        <div className="p-5 sm:p-6">
                            <div className="mb-4 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                                {shop.status}
                            </div>

                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                {shop.name}
                            </h1>

                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                {displayDescription}
                            </p>

                            <div className="mt-5 space-y-3 text-sm text-slate-600">
                                <div>
                                    <span className="font-semibold text-slate-900">Địa chỉ:</span>{" "}
                                    {shop.address}
                                </div>
                                <div>
                                    <span className="font-semibold text-slate-900">
                                        Chi phí trung bình:
                                    </span>{" "}
                                    {shop.avgCostPerPerson.toLocaleString("vi-VN")}đ / người
                                </div>
                                <div>
                                    <span className="font-semibold text-slate-900">
                                        Thời gian chờ:
                                    </span>{" "}
                                    {shop.avgWaitTimeMin} phút
                                </div>
                                <div>
                                    <span className="font-semibold text-slate-900">
                                        Thời gian ăn:
                                    </span>{" "}
                                    {shop.avgEatTimeMin} phút
                                </div>
                                <div>
                                    <span className="font-semibold text-slate-900">Audio:</span>{" "}
                                    Tạo động theo ngôn ngữ ({activeNarrationLanguage})
                                </div>
                                <div>
                                    <span className="font-semibold text-slate-900">Tọa độ:</span>{" "}
                                    {shop.lat}, {shop.lng}
                                </div>
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={() => void playShopNarration()}
                                        disabled={isGeneratingNarration}
                                        className="rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
                                    >
                                        {isGeneratingNarration
                                            ? "Đang tạo audio..."
                                            : isAudioPlaying && currentAudio?.type === "SHOP" && currentAudio.id === shop.id
                                            ? "Tắt audio quán"
                                            : "Phát audio quán"}
                                    </button>
                                    {needsUserGestureToPlay ? (
                                        <p className="mt-2 text-xs text-amber-600">
                                            Trình duyệt đang chặn tự phát audio. Bạn bấm nút trên để phát thủ công.
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <SectionTitle
                        title="Vị trí quán và đường đi"
                        subtitle="Hiển thị vị trí hiện tại, quán đang xem và các quán trong phạm vi 2km"
                    />
                    <ShopMap
                        currentPosition={currentPosition}
                        currentShop={shop}
                        nearbyShops={nearbyShops}
                    />
                </div>

                <div ref={menuSectionRef} className="mt-8 scroll-mt-24">
                    <SectionTitle
                        title="Món ăn của quán"
                        subtitle="Khách có thể chọn nhiều món, nhập số lượng và gửi đơn cho quán"
                    />

                    {shopDishes.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
                            Quán này chưa có món nào trong menu.
                        </div>
                    ) : (
                        <>
                            <div className="mb-5 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">Đơn món đang chọn</h3>
                                        <p className="text-sm text-slate-600">
                                            Chọn nhiều món và nhấn Đặt món để gửi cho quán.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => void handleCreateOrder()}
                                        disabled={isCreatingOrder || selectedOrderEntries.length === 0}
                                        className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isCreatingOrder ? "Đang đặt..." : "Đặt món"}
                                    </button>
                                </div>

                                {selectedOrderEntries.length === 0 ? (
                                    <p className="mt-3 text-sm text-slate-500">Bạn chưa chọn món nào.</p>
                                ) : (
                                    <div className="mt-3 space-y-2 rounded-2xl border border-emerald-200 bg-white p-3">
                                        {selectedOrderEntries.map((entry) => (
                                            <div
                                                key={entry.dish.id}
                                                className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0"
                                            >
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{entry.dish.name}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {entry.quantity} x {Number(entry.dish.price || 0).toLocaleString("vi-VN")}đ
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeDishFromOrderDraft(entry.dish.id)}
                                                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                                                >
                                                    Bỏ
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-3 flex items-center justify-between text-sm">
                                    <span className="text-slate-600">{selectedOrderCount} món đã chọn</span>
                                    <span className="font-bold text-emerald-700">
                                        Tạm tính: {selectedOrderTotal.toLocaleString("vi-VN")}đ
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {shopDishes.map((dish) => (
                                    <div key={dish.id} className="space-y-2">
                                        <DishCard
                                            shopId={dish.shopId}
                                            id={dish.id}
                                            image={dish.image || "https://placehold.co/600x400?text=Dish"}
                                            dishName={dish.name}
                                            rating={4.7}
                                            price={dish.price}
                                            shopName={shop.name}
                                            onNavigate={handleNavigate}
                                            onListenAudio={handleListenAudio}
                                            onViewMenu={handleViewMenu}
                                        />

                                        <div className="rounded-2xl border border-slate-200 bg-white p-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-300">
                                                    <button
                                                        type="button"
                                                        onClick={() => updatePendingQuantity(dish.id, -1)}
                                                        className="px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="min-w-10 px-2 text-center text-sm font-semibold text-slate-900">
                                                        {Math.max(1, pendingQuantities[dish.id] ?? 1)}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updatePendingQuantity(dish.id, 1)}
                                                        className="px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => addDishToOrderDraft(dish)}
                                                    className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                                                >
                                                    Chọn món
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <SimplePagination
                                page={dishPage}
                                onPrev={() => setDishPage((prev) => Math.max(1, prev - 1))}
                                onNext={() => setDishPage((prev) => prev + 1)}
                                disablePrev={dishPage === 1}
                            />
                        </>
                    )}
                </div>
                <div className="mt-8">
                    <SectionTitle title="Các món khác" subtitle="Gợi ý thêm từ các quán khác" />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {otherDishes.map((dish) => (
                            <DishCard
                                key={dish.id}
                                shopId={dish.shopId}
                                id={dish.id}
                                image={dish.image || "https://placehold.co/600x400?text=Dish"}
                                dishName={dish.name}
                                rating={4.5}
                                price={dish.price}
                                shopName={`Quán #${dish.shopId}`}
                                onNavigate={handleNavigate}
                                onListenAudio={handleListenAudio}
                                onViewMenu={handleViewMenu}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ShopDetailPage;

