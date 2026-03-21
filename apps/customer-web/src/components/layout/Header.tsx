import { useLocation } from "react-router-dom";
import { routePath } from "../../routes/route";

const titleByRoute: { path: string; title: string }[] = [
    { path: routePath.HomeDishPage, title: "Món ăn" },
    { path: routePath.searchDishes, title: "Tìm món ăn" },
    { path: "/dish/", title: "Chi tiết món ăn" },
    { path: routePath.shopSearchPage, title: "Quán ăn" },
    { path: "/shop/", title: "Chi tiết quán" },
    { path: routePath.NearbyShopPage, title: "Gần tôi" },
    { path: routePath.scanShopQrRootPage, title: "Quét QR" },
    { path: routePath.scanShopQrPage, title: "Quét QR" },
    { path: routePath.orderPage, title: "Đơn hàng" },
    { path: routePath.profilePage, title: "Hồ sơ" },
];

function Header() {
    const { pathname } = useLocation();
    const activeTitle =
        titleByRoute.find((item) => pathname === item.path || pathname.startsWith(item.path))?.title ||
        "Khám phá";
    const showLocation = pathname === routePath.NearbyShopPage;

    return (
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
                <h1 className="truncate text-lg font-semibold text-slate-900">{activeTitle}</h1>
                {showLocation && (
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
                        <span>LOC</span>
                        Vĩnh Khánh, Q.4
                    </div>
                )}
            </div>
        </header>
    );
}

export default Header;
