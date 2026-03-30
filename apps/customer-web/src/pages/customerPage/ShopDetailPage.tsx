import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import DishCard from "../../components/ui/DishCard";
import SectionTitle from "../../components/home/SectionTitle";
import ShopMap from "../../components/shop/ShopMap";
import SimplePagination from "../../components/common/SimplePagination";
import { dishService } from "../../services/dishService";
import { shopService } from "../../services/shopService";
import type { Dish } from "../../types/dish";
import type { ShopResponse } from "../../types/shop";
import { useAudioPlayer } from "../../stores/useAudioPlayer";
import { resolvePreferredLanguage } from "../../utils/language";
import { resolveMediaUrl } from "../../utils/media";

function resolveBackendAudioUrl(rawAudioPath?: string | null): string | undefined {
    if (!rawAudioPath) return undefined;
    if (/^https?:\/\//i.test(rawAudioPath)) return rawAudioPath;

    const base = (import.meta.env.VITE_BACKEND_API || "").replace(/\/+$/, "");
    const normalizedPath = rawAudioPath.startsWith("/") ? rawAudioPath : `/${rawAudioPath}`;
    return `${base}${normalizedPath}`;
}

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
    const { shopId } = useParams();
    const [searchParams] = useSearchParams();
    const { currentAudio, isAudioPlaying, toggleAudio } = useAudioPlayer();
    const parsedShopId = Number(shopId);
    const requestedLanguage = searchParams.get("lang");
    const shouldAutoplayNarration = searchParams.get("autoplay") === "1";
    const hasAutoplayTriggeredRef = useRef(false);

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
    const shopImageSrc = resolveMediaUrl(
        shop?.imageName,
        import.meta.env.VITE_SHOP_IMAGE_API,
        "https://placehold.co/1200x800?text=Shop"
    );

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
            await toggleAudio({
                id: targetDish.id,
                type: "DISH",
                url: targetDish.audioURL,
                title: targetDish.name,
                shopId: targetDish.shopId,
            });
        } catch (error) {
            console.error("Nghe audio món lỗi", error);
        }
    };

    const handleViewMenu = (dishId: number) => {
        console.log("Xem món", dishId);
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
                alert("Không tạo được audio thuyết minh cho quán.");
                return;
            }

            await toggleAudio({
                id: shop.id,
                type: "SHOP",
                url: narrationAudioUrl,
                title: shop.name,
                shopId: shop.id,
            });
            setNeedsUserGestureToPlay(false);
        } catch (error) {
            console.error("Play shop narration failed", error);

            if (isAutoplayBlockedError(error)) {
                setNeedsUserGestureToPlay(true);
                if (!shouldAutoplayNarration) {
                    alert("Trình duyệt yêu cầu bạn tương tác trước khi phát. Hãy bấm lại nút phát audio.");
                }
                return;
            }

            const message = resolveRequestErrorMessage(
                error,
                "Không thể tạo audio theo ngôn ngữ đã chọn. Vui lòng thử lại."
            );
            alert(message);
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
                                {shop.description}
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

                <div className="mt-8">
                    <SectionTitle
                        title="Món ăn của quán"
                        subtitle="Danh sách món ăn theo quán, có phân trang"
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {shopDishes.map((dish) => (
                            <DishCard
                                key={dish.id}
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
                        ))}
                    </div>

                    <SimplePagination
                        page={dishPage}
                        onPrev={() => setDishPage((prev) => Math.max(1, prev - 1))}
                        onNext={() => setDishPage((prev) => prev + 1)}
                        disablePrev={dishPage === 1}
                    />
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
