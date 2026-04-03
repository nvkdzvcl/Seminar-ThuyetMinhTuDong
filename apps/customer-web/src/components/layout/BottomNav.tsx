import { NavLink, useLocation } from "react-router-dom";
import { routePath } from "../../routes/route";
import type { ComponentType } from "react";

type NavItem = {
    label: string;
    to: string;
    icon: ComponentType<{ className?: string }>;
    isActive: (pathname: string) => boolean;
};

const DishIcon = ({ className = "" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
        <path d="M4 3v6a2 2 0 0 0 2 2h1v10" />
        <path d="M8 3v6" />
        <path d="M12 3v6" />
        <path d="M18 3c1.657 0 3 1.343 3 3v5h-3v10" />
    </svg>
);

const ShopIcon = ({ className = "" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
        <path d="M3 9.5 4.6 4h14.8L21 9.5" />
        <path d="M3 9.5h18v10.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
        <path d="M9 21v-6h6v6" />
    </svg>
);

const NearbyIcon = ({ className = "" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
        <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.5" />
    </svg>
);

const QrIcon = ({ className = "" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
        <rect x="3.5" y="3.5" width="6" height="6" />
        <rect x="14.5" y="3.5" width="6" height="6" />
        <rect x="3.5" y="14.5" width="6" height="6" />
        <path d="M14.5 14.5h2.5v2.5h-2.5z" />
        <path d="M20.5 14.5v2.5h-2.5" />
        <path d="M17 20.5h3.5V17" />
    </svg>
);

const OrderIcon = ({ className = "" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
    </svg>
);

const ProfileIcon = ({ className = "" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="8.2" r="3" />
        <path d="M6.5 18.6c1.7-2.6 3.8-3.9 5.5-3.9s3.8 1.3 5.5 3.9" />
    </svg>
);

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
        label: "Tour",
        to: routePath.tourSuggestPage,
        icon: OrderIcon,
        isActive: (pathname) => pathname === routePath.tourSuggestPage || pathname.startsWith("/tour/"),
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
                            <Icon className="h-5 w-5" />
                            <span className={isActive ? "font-semibold" : "font-medium"}>{item.label}</span>
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
}

export default BottomNav;
