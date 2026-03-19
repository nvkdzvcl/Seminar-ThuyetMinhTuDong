import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchShopBar from "../../components/shop/SearchShopBar";
import ShopCard from "../../components/shop/ShopCard";
import { shopService } from "../../services/shopService";
import type { ShopResponse } from "../../types/shop";

function SearchShopPage() {
    const navigate = useNavigate();

    const [keyword, setKeyword] = useState("");
    const [shops, setShops] = useState<ShopResponse[]>([]);
    const [allShops, setAllShops] = useState<ShopResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [pageError, setPageError] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const loadDefaultShops = async () => {
            try {
                setLoading(true);
                setPageError("");

                const res = await shopService.getShops(1, 20, "ACTIVE");
                const items = res.result?.items ?? [];

                setAllShops(items);
                setShops(items);
            } catch {
                setPageError("Không thể tải danh sách quán");
            } finally {
                setLoading(false);
            }
        };

        loadDefaultShops();
    }, []);

    const handleSearch = async () => {
        const trimmed = keyword.trim();

        if (!trimmed) {
            setIsSearching(false);
            setShops(allShops);
            return;
        }

        try {
            setLoading(true);
            setPageError("");
            setIsSearching(true);

            const res = await shopService.searchShops(trimmed, "ACTIVE", 1, 20);
            setShops(res.result?.items ?? []);
        } catch {
            setPageError("Không tìm được quán phù hợp");
            setShops([]);
        } finally {
            setLoading(false);
        }
    };

    const handleViewShop = (shopId: number) => {
        navigate(`/shop/${shopId}`);
    };

    const handleListenAudio = (shopId: number) => {
        console.log("Nghe audio quán:", shopId);
    };

    const pageTitle = useMemo(() => {
        if (!isSearching || !keyword.trim()) return "Danh sách quán";
        return `Kết quả tìm kiếm cho "${keyword}"`;
    }, [isSearching, keyword]);

    const pageSubtitle = useMemo(() => {
        if (!isSearching || !keyword.trim()) {
            return "Các quán đang hoạt động";
        }
        return `Tìm thấy ${shops.length} quán`;
    }, [isSearching, keyword, shops.length]);

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                <div className="mb-6 rounded-[32px] bg-gradient-to-r from-green-50 via-white to-cyan-50 p-5 shadow-sm sm:p-6">
                    <div className="max-w-2xl">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Tìm kiếm quán ăn
                        </h1>
                        <p className="mt-2 text-sm text-slate-600 sm:text-base">
                            Tìm quán theo tên và khám phá thông tin quán phù hợp với bạn
                        </p>
                    </div>

                    <div className="mt-5">
                        <SearchShopBar
                            keyword={keyword}
                            onKeywordChange={setKeyword}
                            onSubmit={handleSearch}
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                        {pageTitle}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">{pageSubtitle}</p>
                </div>

                {pageError && (
                    <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {pageError}
                    </div>
                )}

                {loading ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
                        Đang tải dữ liệu...
                    </div>
                ) : shops.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
                        Không có quán nào phù hợp
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {shops.map((shop) => (
                            <ShopCard
                                key={shop.id}
                                id={shop.id}
                                image={shop.imageName}
                                shopName={shop.name}
                                rating={4.6}
                                category="Ẩm thực đường phố"
                                onViewShop={handleViewShop}
                                onListenAudio={handleListenAudio}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default SearchShopPage;
