import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { routePath } from "../../routes/route";
import ShopCard from "../../components/shop/ShopCard";
import { shopService } from "../../services/shopService";
import type { ShopResponse } from "../../types/shop";
import { useAudioPlayer } from "../../stores/useAudioPlayer";
import { resolvePreferredLanguage } from "../../utils/language";
import { resolveBackendAudioUrl } from "../../utils/media";
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

function SearchShopPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { toggleAudio } = useAudioPlayer();
    const keywordFromUrl = searchParams.get("keyword") || "";

    const [keyword, setKeyword] = useState(keywordFromUrl);
    const [shops, setShops] = useState<ShopResponse[]>([]);
    const [allShops, setAllShops] = useState<ShopResponse[]>([]);
    const [suggestions, setSuggestions] = useState<ShopResponse[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
    const [pageError, setPageError] = useState("");

    useEffect(() => {
        setKeyword(keywordFromUrl);
    }, [keywordFromUrl]);

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

        void loadDefaultShops();
    }, []);

    useEffect(() => {
        const trimmed = keyword.trim();

        if (!trimmed) {
            setIsSearching(false);
            setIsSearchingSuggestions(false);
            setPageError("");
            setSuggestions([]);
            setShops(allShops);
            return;
        }

        let isDisposed = false;
        setIsSearchingSuggestions(true);

        const timer = window.setTimeout(async () => {
            try {
                const res = await shopService.searchShops(trimmed, "ACTIVE", 1, 20);
                if (isDisposed) return;

                const items = res.result?.items ?? [];
                setIsSearching(true);
                setShops(items);
                setSuggestions(items.slice(0, 6));
                setPageError("");
            } catch {
                if (isDisposed) return;
                setIsSearching(true);
                setShops([]);
                setSuggestions([]);
                setPageError("Không tìm được quán phù hợp");
            } finally {
                if (!isDisposed) {
                    setIsSearchingSuggestions(false);
                }
            }
        }, 260);

        return () => {
            isDisposed = true;
            window.clearTimeout(timer);
        };
    }, [keyword, allShops]);

    const handleSubmitSearch = () => {
        const trimmed = keyword.trim();
        if (!trimmed) {
            setSearchParams({});
            return;
        }
        setSearchParams({ keyword: trimmed });
        setShowSuggestions(true);
    };

    const handleViewShop = (shopId: number) => {
        navigate(routePath.ShopDetailPage.replace(":shopId", String(shopId)));
    };

    const handleSelectSuggestion = (shop: ShopResponse) => {
        setKeyword(shop.name);
        setShowSuggestions(false);
        handleViewShop(shop.id);
    };

    const handleListenAudio = async (shopId: number) => {
        const targetShop = shops.find((shop) => shop.id === shopId);
        if (!targetShop) return;

        try {
            const preferredLanguage = resolvePreferredLanguage();
            const narrationRes = await shopService.getShopNarration(targetShop.id, preferredLanguage);
            const narrationAudioUrl = resolveBackendAudioUrl(narrationRes.result?.audioUrl);

            if (!narrationAudioUrl) {
                notifyWarning(`Không tạo được audio cho quán ${targetShop.name}.`);
                return;
            }

            await toggleAudio({
                id: targetShop.id,
                type: "SHOP",
                url: narrationAudioUrl,
                title: targetShop.name,
                shopId: targetShop.id,
                transcript: narrationRes.result?.script,
                transcriptLanguage: narrationRes.result?.language,
            });
        } catch (error) {
            console.error("Nghe audio quán lỗi:", error);
            notifyError(
                resolveRequestErrorMessage(error, `Không thể phát audio của quán ${targetShop.name}. Vui lòng thử lại.`)
            );
        }
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
                            Tìm quán theo tên, nghe audio và quét QR để vào nhanh trang quán.
                        </p>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    handleSubmitSearch();
                                }}
                                className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm"
                            >
                                <div className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        value={keyword}
                                        onChange={(event) => {
                                            setKeyword(event.target.value);
                                            setShowSuggestions(true);
                                        }}
                                        onFocus={() => setShowSuggestions(true)}
                                        onBlur={() => {
                                            window.setTimeout(() => setShowSuggestions(false), 140);
                                        }}
                                        placeholder="Tìm tên quán..."
                                        className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                                    />

                                    <button
                                        type="submit"
                                        className="h-12 shrink-0 rounded-2xl bg-green-600 px-5 text-sm font-semibold text-white transition hover:bg-green-700"
                                    >
                                        Tìm
                                    </button>
                                </div>
                            </form>

                            {showSuggestions && keyword.trim() ? (
                                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                                    {isSearchingSuggestions ? (
                                        <div className="px-4 py-3 text-sm text-slate-500">
                                            Đang tìm quán...
                                        </div>
                                    ) : suggestions.length > 0 ? (
                                        <div className="max-h-72 overflow-y-auto py-1">
                                            {suggestions.map((shop) => (
                                                <button
                                                    key={shop.id}
                                                    type="button"
                                                    onMouseDown={(event) => event.preventDefault()}
                                                    onClick={() => handleSelectSuggestion(shop)}
                                                    className="block w-full px-4 py-3 text-left transition hover:bg-slate-50"
                                                >
                                                    <div className="text-sm font-semibold text-slate-900">
                                                        {shop.name}
                                                    </div>
                                                    <div className="mt-1 truncate text-xs text-slate-500">
                                                        {shop.address || "Chưa có địa chỉ"}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="px-4 py-3 text-sm text-slate-500">
                                            Không tìm thấy quán phù hợp.
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate(routePath.scanShopQrPage)}
                            className="h-12 rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            Quét QR quán
                        </button>
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
