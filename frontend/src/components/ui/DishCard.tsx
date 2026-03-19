/* eslint-disable @typescript-eslint/no-unused-vars */
import { useNavigate } from "react-router-dom";

type DishCardProps = {
    id: number;
    shopId: number;
    image: string;
    dishName: string;
    rating: number;
    price: number;
    shopName: string;
    onNavigate: (id: number) => void;
    onListenAudio: (id: number) => void;
    onViewMenu: (id: number) => void;
};




function DishCard({
    id,
    shopId,
    image,
    dishName,
    rating,
    price,
    shopName,
    onNavigate,
    onListenAudio,
    onViewMenu,
}: DishCardProps) {
    const navigate = useNavigate();
    
    const handleNavigateToShop = (shopId: number) => {
        navigate(`/shop/${shopId}`);
    };

    const handleNavigateToDishDetail = (id: number) => {
        navigate(`/dish/${id}`);
    };
    
    return (
        <div className="group w-full overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
            <div className="relative h-44 w-full overflow-hidden bg-slate-100 sm:h-52">
                <img
                    // src={"http://localhost:8080/vinhkhanhfoodtour/api/uploads/dish-images/demoDishImg.png"}
                    src={`${import.meta.env.VITE_DISH_IMAGE_API}anh_mau.jpg`}
                    // src={`${import.meta.env.VITE_IMAGE_API}demoDishImg.png`}
                    alt={dishName}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

                <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-amber-600 shadow-md backdrop-blur sm:text-sm">
                    <span>⭐</span>
                    <span>{rating.toFixed(1)}</span>
                </div>

                <div className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-slate-700 shadow sm:text-xs">
                    Món nổi bật
                </div>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
                <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                        {dishName}
                    </h3>

                    <div className="mt-1 flex items-center gap-2">
                        <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                        <p className="truncate text-sm text-slate-500">{shopName}</p>
                    </div>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-slate-500">Giá tham khảo</span>
                        <span className="shrink-0 text-lg font-bold text-green-600 sm:text-xl">
                            {price.toLocaleString("vi-VN")}đ
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <button
                        type="button"
                        onClick={() =>  handleNavigateToShop(shopId)}
                        className="rounded-2xl border border-green-200 bg-green-50 px-2 py-2.5 text-[11px] font-semibold text-green-700 transition hover:bg-green-100 active:scale-[0.98] sm:px-4 sm:py-3 sm:text-sm"
                    >
                        <span className="sm:hidden">Đi quán</span>
                        <span className="hidden sm:inline">Chỉ đường</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onListenAudio(id)}
                        className="rounded-2xl border border-cyan-200 bg-cyan-50 px-2 py-2.5 text-[11px] font-semibold text-cyan-700 transition hover:bg-cyan-100 active:scale-[0.98] sm:px-4 sm:py-3 sm:text-sm"
                    >
                        <span className="sm:hidden">Audio</span>
                        <span className="hidden sm:inline">Nghe audio</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleNavigateToDishDetail(id)}
                        className="rounded-2xl bg-green-600 px-2 py-2.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-green-700 active:scale-[0.98] sm:px-4 sm:py-3 sm:text-sm"
                    >
                        Xem món
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DishCard;
