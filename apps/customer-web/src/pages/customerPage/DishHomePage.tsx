import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DishCard from "../../components/ui/DishCard";
import HomeSearchBar from "../../components/home/HomeSearchBar";
import NearbyMap from "../../components/home/NearbyMap";
import SectionTitle from "../../components/home/SectionTitle";



import { dishService } from "../../services/dishService";
import { shopService } from "../../services/shopService";
import type { Dish } from "../../types/dish";
import type { ShopResponse } from "../../types/shop";
import { useAudioPlayer } from "../../stores/useAudioPlayer";

function HomePage() {
    const navigate = useNavigate();
    const { toggleAudio } = useAudioPlayer();

    const [keyword, setKeyword] = useState("");
    const [featuredDishes, setFeaturedDishes] = useState<Dish[]>([]);
    const [normalDishes, setNormalDishes] = useState<Dish[]>([]);
    const [shops, setShops] = useState<ShopResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [pageError, setPageError] = useState("");

    const [currentPosition, setCurrentPosition] = useState<[number, number]>([
        10.762622, 106.660172,
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
        const loadHomeData = async () => {
            try {
                setLoading(true);
                setPageError("");

                const [featuredRes, normalRes, shopsRes] = await Promise.all([
                    dishService.getByIsSignatureDish(true, "ACTIVE", 1, 10),
                    dishService.getByIsSignatureDish(false, "ACTIVE", 1, 10),
                    shopService.getShops(1, 10, "ACTIVE"),
                ]);

                setFeaturedDishes(featuredRes.result?.items || []);
                setNormalDishes(normalRes.result?.items || []);
                setShops(shopsRes.result?.items || []);
            } catch {
                setPageError("Không thể tải dữ liệu trang chủ");
            } finally {
                setLoading(false);
            }
        };

        loadHomeData();
    }, []);

    const shopNameMap = useMemo(() => {
        return shops.reduce<Record<number, string>>((acc, shop) => {
            acc[shop.id] = shop.name;
            return acc;
        }, {});
    }, [shops]);


    const handleSearch = () => {
        const trimmed = keyword.trim();
        if (!trimmed) return;

        navigate(`/search-dish?keyword=${encodeURIComponent(trimmed)}`);
    };

    const handleNavigateToShop = (shopId: number) => {
        navigate(`/shop/${shopId}`);
    };

    const handleListenAudio = async (dishId: number) => {
        const targetDish = [...featuredDishes, ...normalDishes].find((dish) => dish.id === dishId);
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
            console.error("Nghe audio món lỗi:", error);
        }
    };

    const handleViewDish = (dishId: number) => {
        console.log("Xem món:", dishId);
    };

  

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                <div className="mb-6 rounded-[32px] bg-gradient-to-r from-green-50 via-white to-cyan-50 p-5 shadow-sm sm:p-6">
                    <div className="max-w-2xl">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Khám phá ẩm thực Vĩnh Khánh
                        </h1>
                        <p className="mt-2 text-sm text-slate-600 sm:text-base">
                            Tìm món ăn, xem quán gần bạn, nghe audio và lên lịch trình ăn uống
                            nhanh.
                        </p>
                    </div>

                    <div className="mt-5">
                        <HomeSearchBar
                            keyword={keyword}
                            onKeywordChange={setKeyword}
                            onSubmit={handleSearch}
                        />
                    </div>
                </div>

                {pageError && (
                    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {pageError}
                    </div>
                )}

                <div className="space-y-8">
                    <section>
                        <SectionTitle
                            title="Quán gần bạn"
                            subtitle="Bản đồ hiện vị trí hiện tại và các quán đang hoạt động"
                        />

                        <div className="mt-4 ">
                            <NearbyMap currentPosition={currentPosition} shops={shops} />
                        </div>
                    </section>

                    <section>
                        <SectionTitle
                            title="Món nổi bật"
                            subtitle="Các món signature đang được nhiều người quan tâm"
                        />

                        {loading ? (
                            <div className="text-sm text-slate-500">Đang tải món nổi bật...</div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {featuredDishes.map((dish) => (
                                    <DishCard
                                        key={dish.id}
                                        shopId={dish.shopId}
                                        id={dish.id}
                                        image={
                                            dish.image || "https://placehold.co/600x400?text=Dish"
                                        }
                                        dishName={dish.name}
                                        rating={4.7}
                                        price={dish.price}
                                        shopName={
                                            shopNameMap[dish.shopId] || `Quán #${dish.shopId}`
                                        }
                                        onNavigate={handleNavigateToShop}
                                        onListenAudio={handleListenAudio}
                                        onViewMenu={handleViewDish}
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    <section>
                        <SectionTitle
                            title="Món ăn khác"
                            subtitle="Gợi ý thêm cho hành trình khám phá ẩm thực của bạn"
                        />

                        {loading ? (
                            <div className="text-sm text-slate-500">Đang tải món ăn...</div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {normalDishes.map((dish) => (
                                    <DishCard
                                        key={dish.id}
                                        id={dish.id}
                                        shopId={dish.shopId}
                                        image={
                                            dish.image || "https://placehold.co/600x400?text=Dish"
                                        }
                                        dishName={dish.name}
                                        rating={4.5}
                                        price={dish.price}
                                        shopName={
                                            shopNameMap[dish.shopId] || `Quán #${dish.shopId}`
                                        }
                                        onNavigate={handleNavigateToShop}
                                        onListenAudio={handleListenAudio}
                                        onViewMenu={handleViewDish}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}

export default HomePage;
