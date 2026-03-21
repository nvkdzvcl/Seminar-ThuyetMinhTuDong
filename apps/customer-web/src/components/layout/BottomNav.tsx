import { NavLink, useLocation } from "react-router-dom";
import { routePath } from "../../routes/route";
import type { ComponentType } from "react";

type NavItem = {
    label: string;
    to: string;
    icon: ComponentType<{ className?: string }>;
    isActive: (pathname: string) => boolean;
};

const DishIcon = ({ className = "" }: { className?: string }) => <span className={className}>DI</span>;
const ShopIcon = ({ className = "" }: { className?: string }) => <span className={className}>SH</span>;
const NearbyIcon = ({ className = "" }: { className?: string }) => <span className={className}>NE</span>;
const QrIcon = ({ className = "" }: { className?: string }) => <span className={className}>QR</span>;
const OrderIcon = ({ className = "" }: { className?: string }) => <span className={className}>OR</span>;
const ProfileIcon = ({ className = "" }: { className?: string }) => <span className={className}>PR</span>;

const navItems: NavItem[] = [
    {
        label: "Món ăn",
        to: routePath.HomeDishPage,
        icon: DishIcon,
        isActive: (pathname) =>
            pathname === routePath.HomeDishPage ||
            pathname.startsWith("/dish/") ||
            pathname === routePath.searchDishes,
    },
    {
        label: "Quán ăn",
        to: routePath.shopSearchPage,
        icon: ShopIcon,
        isActive: (pathname) => pathname === routePath.shopSearchPage || pathname.startsWith("/shop/"),
    },
    {
        label: "Gần tôi",
        to: routePath.NearbyShopPage,
        icon: NearbyIcon,
        isActive: (pathname) => pathname === routePath.NearbyShopPage,
    },
    {
        label: "Quét QR",
        to: routePath.scanShopQrRootPage,
        icon: QrIcon,
        isActive: (pathname) =>
            pathname === routePath.scanShopQrRootPage || pathname === routePath.scanShopQrPage,
    },
    {
        label: "Đơn hàng",
        to: routePath.orderPage,
        icon: OrderIcon,
        isActive: (pathname) => pathname === routePath.orderPage || pathname.startsWith("/order/"),
    },
    {
        label: "Hồ sơ",
        to: routePath.profilePage,
        icon: ProfileIcon,
        isActive: (pathname) => pathname === routePath.profilePage || pathname.startsWith("/profile/"),
    },
];

function BottomNav() {
    const { pathname } = useLocation();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto grid h-16 w-full max-w-5xl grid-cols-6">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.isActive(pathname);

                    return (
                        <NavLink
                            key={item.label}
                            to={item.to}
                            className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 px-1 text-[11px] transition ${
                                isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            <Icon className="text-base" />
                            <span className={isActive ? "font-semibold" : "font-medium"}>{item.label}</span>
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
}

export default BottomNav;
