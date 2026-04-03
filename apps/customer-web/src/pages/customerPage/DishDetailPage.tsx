import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import DishCard from "../../components/ui/DishCard";
import { dishService } from "../../services/dishService";
import { shopService } from "../../services/shopService";
import type { Dish } from "../../types/dish";
import type { ShopResponse } from "../../types/shop";
import { useAudioPlayer } from "../../stores/useAudioPlayer";
import { resolvePreferredLanguage } from "../../utils/language";
import { resolveBackendAudioUrl, resolveMediaUrl } from "../../utils/media";
import { notifyError, notifyWarning } from "../../utils/notify";

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

function DishDetailPage() {
    const { dishId } = useParams();
    const navigate = useNavigate();
    const parsedDishId = Number(dishId);

    const [dish, setDish] = useState<Dish | null>(null);
    const { currentAudio, isAudioPlaying, toggleAudio } = useAudioPlayer();
    const [shop, setShop] = useState<ShopResponse | null>(null);
    const [otherDishes, setOtherDishes] = useState<Dish[]>([]);
    const [loading, setLoading] = useState(false);
    const [pageError, setPageError] = useState("");
    const dishImageSrc = resolveMediaUrl(
        dish?.image,
        import.meta.env.VITE_DISH_IMAGE_API,
        "https://placehold.co/1200x800?text=Dish"
    );

    useEffect(() => {
        if (!parsedDishId || Number.isNaN(parsedDishId)) return;

        const loadDishDetail = async () => {
            setLoading(true);
            setPageError("");

            try {
                const dishRes = await dishService.getDishById(parsedDishId);
                const dishData = dishRes?.result;

                if (!dishData) {
                    throw new Error("Dish data is empty");
                }

                setDish(dishData);

                // load shop riêng, fail cũng không làm hỏng cả trang
                try {
                    const shopRes = await shopService.getShopById(dishData.shopId);
                    setShop(shopRes?.result ?? null);
                } catch (error) {
                    console.error("Load shop failed:", error);
                    setShop(null);
                }

                // load món khác riêng, fail cũng không làm hỏng cả trang
                try {
                    const otherDishRes = await dishService.getByShopId(
                        dishData.shopId,
                        "ACTIVE",
                        1,
                        12
                    );

                    const items = otherDishRes?.result?.items ?? [];
                    setOtherDishes(items.filter((item) => item.id !== dishData.id));
                } catch (error) {
                    console.error("Load other dishes failed:", error);
                    setOtherDishes([]);
                }
            } catch (error) {
                console.error("Load dish detail failed:", error);
                setPageError("Không thể tải thông tin món ăn");
            } finally {
                setLoading(false);
            }
        };

        loadDishDetail();
    }, [parsedDishId]);

    const handleGoToShop = () => {
        if (!dish?.shopId) return;
        navigate(`/shop/${dish.shopId}`);
    };

    const handleListenAudio = async () => {
        if (!dish) return;

        try {
            const preferredLanguage = resolvePreferredLanguage();
            const narrationRes = await dishService.getDishNarration(dish.id, preferredLanguage);
            const narration = narrationRes.result;
            const narrationAudioUrl = resolveBackendAudioUrl(narration?.audioUrl);
            if (!narrationAudioUrl) {
                notifyWarning(`Không tạo được audio cho món ${dish.name}.`);
                return;
            }

            await toggleAudio({
                id: dish.id,
                type: "DISH",
                url: narrationAudioUrl,
                title: dish.name,
                shopId: dish.shopId,
                transcript: narration?.script,
                transcriptLanguage: narration?.language,
            });
        } catch (error) {
            console.error("Nghe audio món lỗi:", error);
            notifyError(
                resolveRequestErrorMessage(error, `Không thể phát audio của món ${dish.name}. Vui lòng thử lại.`)
            );
        }
    };

    const handleNavigateDish = (id: number) => {
        navigate(`/dish/${id}`);
    };

    if (loading && !dish) {
        return (
            <div className="min-h-screen bg-slate-50 p-6 text-sm text-slate-500">
                Đang tải thông tin món ăn...
            </div>
        );
    }

    if (pageError) {
        return (
            <div className="min-h-screen bg-slate-50 p-6">
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {pageError}
                </div>
            </div>
        );
    }

    if (!dish) return null;

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="grid gap-0 lg:grid-cols-[1.05fr_1fr]">
                        {/* IMAGE */}
                        <div className="h-[280px] bg-slate-100 sm:h-[420px]">
                            <img
                                src={dishImageSrc}
                                alt={dish.name}
                                className="h-full w-full object-cover"
                            />
                        </div>

                        {/* CONTENT */}
                        <div className="p-5 sm:p-6">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
                                    ⭐ 4.7
                                </span>

                                {dish.isSignature && (
                                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                                        Signature
                                    </span>
                                )}

                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                    {dish.status}
                                </span>
                            </div>

                            {/* tên món */}
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                {dish.name}
                            </h1>

                            {/* tên quán */}
                            <p className="mt-2 text-base font-medium text-green-700">
                                {shop?.name || `Quán #${dish.shopId}`}
                            </p>

                            {/* nút */}
                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={handleGoToShop}
                                    className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-100"
                                >
                                    Tới quán
                                </button>

                                <button
                                    type="button"
                                    onClick={handleListenAudio}
                                    className="rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
                                >
                                    {isAudioPlaying && currentAudio?.type === "DISH" && currentAudio.id === dish.id
                                        ? "Tắt audio"
                                        : "Nghe audio"}
                                </button>
                            </div>

                            {/* thông tin khác */}
                            <div className="mt-6 rounded-3xl bg-slate-50 p-4">
                                <h2 className="mb-4 text-base font-bold text-slate-900">
                                    Thông tin món ăn
                                </h2>

                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
                                        <span className="text-sm text-slate-500">Mô tả</span>
                                        <span className="max-w-[70%] text-right text-sm font-medium text-slate-800">
                                            {dish.description || "Chưa có mô tả cho món ăn này"}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
                                        <span className="text-sm text-slate-500">Giá</span>
                                        <span className="text-lg font-bold text-green-600">
                                            {dish.price.toLocaleString("vi-VN")}đ
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
                                        <span className="text-sm text-slate-500">Loại món</span>
                                        <span className="text-sm font-semibold text-slate-800">
                                            {dish.type || "Chưa cập nhật"}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
                                        <span className="text-sm text-slate-500">Quán</span>
                                        <span className="text-sm font-semibold text-slate-800">
                                            {shop?.name || `Quán #${dish.shopId}`}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm text-slate-500">Ngày tạo</span>
                                        <span className="text-sm font-semibold text-slate-800">
                                            {dish.createdAt}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* địa chỉ quán nếu có */}
                            {shop?.address && (
                                <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                    <p className="text-sm text-slate-500">Địa chỉ quán</p>
                                    <p className="mt-1 text-sm font-medium text-slate-800">
                                        {shop.address}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* các món khác */}
                <div className="mt-8">
                    <div className="mb-4">
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                            Các món ăn khác
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Khám phá thêm các món khác từ cùng quán
                        </p>
                    </div>

                    {otherDishes.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
                            Chưa có món ăn khác
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {otherDishes.map((item) => (
                                <DishCard
                                    key={item.id}
                                    shopId={item.shopId}
                                    id={item.id}
                                    image={item.image || "https://placehold.co/600x400?text=Dish"}
                                    dishName={item.name}
                                    rating={4.5}
                                    price={item.price}
                                    shopName={shop?.name || `Quán #${item.shopId}`}
                                    onNavigate={handleNavigateDish}
                                    onListenAudio={(id) => {
                                        const targetDish = otherDishes.find((item) => item.id === id);
                                        if (!targetDish) return;
                                        void (async () => {
                                            try {
                                                const preferredLanguage = resolvePreferredLanguage();
                                                const narrationRes = await dishService.getDishNarration(
                                                    targetDish.id,
                                                    preferredLanguage
                                                );
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
                                                console.error("Nghe audio món lỗi:", error);
                                                notifyError(
                                                    resolveRequestErrorMessage(
                                                        error,
                                                        `Không thể phát audio của món ${targetDish.name}. Vui lòng thử lại.`
                                                    )
                                                );
                                            }
                                        })();
                                    }}
                                    onViewMenu={handleNavigateDish}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DishDetailPage;
