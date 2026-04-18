import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { routePath } from "../../routes/route";

const Header: React.FC = () => {
    const { pathname } = useLocation();

    const baseClass =
        "shrink-0 inline-flex min-w-max items-center justify-center rounded-xl px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap transition-all duration-200";

    const activeClass = `${baseClass} bg-blue-600 text-white shadow-md`;
    const inactiveClass = `${baseClass} bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-600`;

    const isExactOrChild = (basePath: string) =>
        pathname === basePath || pathname.startsWith(basePath + "/");

    const isDishActive =
        isExactOrChild(routePath.HomeDishPage) ||
        pathname === routePath.searchDishes;

    const isShopActive =
        isExactOrChild(routePath.shopSearchPage);

     const isTourActive =
        pathname === routePath.NearbyShopPage || pathname.startsWith("/tour/");

    const isScanShopQrActive =
            pathname === routePath.scanShopQrRootPage;

    const isTourSuggestActive = pathname === routePath.tourSuggestPage; 

    const isOrderActive =
        pathname === "/order" ||
        pathname.startsWith("/order/") ||
        pathname.startsWith("/checkout") ||
        pathname.startsWith("/payment");

    const isProfileActive =
        pathname === "/profile" ||
        pathname.startsWith("/profile/") ||
        pathname.startsWith("/change-password") ||
        pathname.startsWith("/edit-profile");






    return (
        <header className="sticky top-0 z-50 bg-white shadow-sm">
            <div className="mx-auto w-full max-w-md px-3 py-2">
                <div className="overflow-x-auto scrollbar-hide">
                    <nav className="flex min-w-max items-center gap-2 rounded-2xl bg-slate-100 p-2 whitespace-nowrap">
                        <NavLink
                            to={routePath.HomeDishPage}
                            className={isDishActive ? activeClass : inactiveClass}
                        >
                            Món ăn
                        </NavLink>

                        <NavLink
                            to={routePath.shopSearchPage}
                            className={isShopActive ? activeClass : inactiveClass}
                        >
                            Quán ăn
                        </NavLink>

                        <NavLink
                            to={routePath.NearbyShopPage}
                            className={isTourActive ? activeClass : inactiveClass}
                        >
                            Gần tôi
                        </NavLink>

                        <NavLink
                            to={routePath.scanShopQrRootPage}
                            className={ isScanShopQrActive ? activeClass : inactiveClass}
                        >
                            Quét QR
                        </NavLink>


                        <NavLink
                            to={routePath.tourSuggestPage}
                            className={ isTourSuggestActive ? activeClass : inactiveClass}
                        >
                            Tour
                        </NavLink>

                        <NavLink
                            to="/order"
                            className={isOrderActive ? activeClass : inactiveClass}
                        >
                            Đơn hàng
                        </NavLink>

                        <NavLink
                            to="/profile"
                            className={isProfileActive ? activeClass : inactiveClass}
                        >
                            Hồ sơ
                        </NavLink>
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;