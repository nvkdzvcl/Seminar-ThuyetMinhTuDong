import LoginOrRegister from "../pages/auth/LoginOrRegister";
import DishDetailPage from "../pages/customerPage/DishDetailPage";
import HomePage from "../pages/customerPage/DishHomePage";
import NearbyShopPage from "../pages/customerPage/NearbyShopPage";
import SearchDishPage from "../pages/customerPage/SearchDishPage";
import SearchShopPage from "../pages/customerPage/SearchShopPage";
import ScanShopQrPage from "../pages/customerPage/ScanShopQrPage";
import ShopDetailPage from "../pages/customerPage/ShopDetailPage";


const routePath = {
    login: "/login",



    HomeDishPage: "/dish",
    dishDetailPage: "/dish/:dishId",
    searchDishes: "/search-dish",
    ShopDetailPage: "/shop/:shopId",
    shopSearchPage: "/shop",
    NearbyShopPage: "/nearby-shops",
    scanShopQrPage: "/shop/scan-qr",
    scanShopQrRootPage: "/scan-qr",

   
};

const cusPublicRoutes = [
     {
        path: routePath.login,
        label: "Trang chủ",
        isContent: false,
        type: "CUSTOMER",
        component: LoginOrRegister,
        isPrivate: false,
    },







     {
        path: routePath.HomeDishPage,
        label: "Món ăn",
        isContent: true,
        type: "CUSTOMER",
        component: HomePage,
        isPrivate: false,
    },



    {
        path: routePath.searchDishes,
        label: "Tìm món ăn",
        isContent: true,
        type: "CUSTOMER",
        component: SearchDishPage,
        isPrivate: false,
    },


     {
        path: routePath.dishDetailPage,
        label: "Chi tiết món ăn",
        isContent: true,
        type: "CUSTOMER",
        component: DishDetailPage,
        isPrivate: false,
    },

     {
        path: routePath.scanShopQrPage,
        label: "Quét QR quán",
        isContent: true,
        type: "CUSTOMER",
        component: ScanShopQrPage,
        isPrivate: false,
    },

     {
        path: routePath.ShopDetailPage,
        label: "Chi tiết quán",
        isContent: true,
        type: "CUSTOMER",
        component: ShopDetailPage,
        isPrivate: false,
    },

     {
        path: routePath.shopSearchPage,
        label: "Tìm quán ăn",
        isContent: true,
        type: "CUSTOMER",
        component: SearchShopPage,
        isPrivate: false,
    },

     {
        path: routePath.NearbyShopPage,
        label: "Vị trí gần tôi",
        isContent: true,
        type: "CUSTOMER",
        component: NearbyShopPage,
        isPrivate: false,
    },

    {
        path: routePath.scanShopQrRootPage,
        label: "Vị trí gần tôi",
        isContent: true,
        type: "CUSTOMER",
        component: ScanShopQrPage,
        isPrivate: false,
    },


    


   

];

export { routePath, cusPublicRoutes };
