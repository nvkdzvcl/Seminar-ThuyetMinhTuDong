import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";



import DishCard from "../../components/ui/DishCard";
import HomeSearchBar from "../../components/home/HomeSearchBar";
import SectionTitle from "../../components/home/SectionTitle";
import { dishService } from "../../services/dishService";
import { shopService } from "../../services/shopService";
import type { Dish } from "../../types/dish";
import type { ShopResponse } from "../../types/shop";
import { routePath } from "../../routes/route";

function SearchDishPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const keywordFromUrl = searchParams.get("keyword") || "";

    const [keyword, setKeyword] = useState(keywordFromUrl);
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [shops, setShops] = useState<ShopResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        setKeyword(keywordFromUrl);
    }, [keywordFromUrl]);

    useEffect(() => {
        const loadShopNames = async () => {
            try {
                const res = await shopService.getShops(1, 100, "ACTIVE");
                if (res.result) {
                    setShops(res.result.items);
                }
            } catch {
                // không chặn UI nếu load shop name lỗi
            }
        };

        loadShopNames();
    }, []);

    useEffect(() => {
        const searchDish = async () => {
            if (!keywordFromUrl.trim()) {
                setDishes([]);
                return;
            }

            try {
                setLoading(true);
                setError("");

                const res = await dishService.searchDishes(keywordFromUrl.trim(), "ACTIVE", 1, 20);

                if (res.result) {
                    setDishes(res.result.items);
                }
            } catch {
                setError("Không tìm được món ăn phù hợp");
            } finally {
                setLoading(false);
            }
        };

        searchDish();
    }, [keywordFromUrl]);


    const handleSearch = () => {
        const trimmed = keyword.trim();
        if (!trimmed) return;

        setSearchParams({ keyword: trimmed });
    };

    const getShopName = (shopId: number) => {
        const found = shops.find((shop) => shop.id === shopId);
        return found?.name || `Quán #${shopId}`;
    };

    const handleBackHome = () => {
        navigate(routePath.HomeDishPage);
    };

    const handleNavigateToShop = (dishId: number) => {
        console.log("Đi tới quán của món:", dishId);
    };

    const handleListenAudio = (dishId: number) => {
        console.log("Nghe audio món:", dishId);
    };

    const handleViewDish = (dishId: number) => {
        console.log("Xem món:", dishId);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                <div className="mb-6 rounded-[32px] bg-gradient-to-r from-green-50 via-white to-cyan-50 p-5 shadow-sm sm:p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                Tìm kiếm món ăn
                            </h1>
                            <p className="mt-2 text-sm text-slate-600 sm:text-base">
                                Tìm nhanh món ăn bạn muốn khám phá
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleBackHome}
                            className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            Về trang chủ
                        </button>
                    </div>

                    <HomeSearchBar
                        keyword={keyword}
                        onKeywordChange={setKeyword}
                        onSubmit={handleSearch}
                    />
                </div>

                <section>
                    <SectionTitle
                        title={
                            keywordFromUrl
                                ? `Kết quả tìm kiếm cho "${keywordFromUrl}"`
                                : "Nhập từ khóa để tìm món ăn"
                        }
                        subtitle={`Tổng cộng ${dishes.length} món`}
                    />

                    {error && (
                        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
                            Đang tìm món ăn...
                        </div>
                    ) : dishes.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
                            Không có món ăn nào phù hợp
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {dishes.map((dish) => (
                                <DishCard
                                    key={dish.id}
                                    shopId={dish.shopId}
                                    id={dish.id}
                                    image={dish.image || "https://placehold.co/600x400?text=Dish"}
                                    dishName={dish.name}
                                    rating={4.6}
                                    price={dish.price}
                                    shopName={getShopName(dish.shopId)}
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
    );
}

export default SearchDishPage;
