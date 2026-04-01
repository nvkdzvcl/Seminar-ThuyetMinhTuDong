/* eslint-disable @typescript-eslint/no-unused-vars */
import { resolveMediaUrl } from "../../utils/media";

type ShopCardProps = {
    id: number;
    image: string;
    shopName: string;
    rating: number;
    category: string;
    onViewShop: (id: number) => void;
    onListenAudio: (id: number) => void;
};

function ShopCard({
    id,
    image,
    shopName,
    rating,
    category,
    onViewShop,
    onListenAudio,
}: ShopCardProps) {
    const imageSrc = resolveMediaUrl(
        image,
        import.meta.env.VITE_SHOP_IMAGE_API,
        "https://placehold.co/800x500?text=Cua+hang"
    );

    return (
        <div className="group w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="relative h-48 w-full overflow-hidden bg-slate-100 sm:h-56">
                <img
                    src={imageSrc}
                    alt={shopName}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />

                <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-amber-600 shadow sm:text-sm">
                    ⭐ {rating.toFixed(1)}
                </div>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
                <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
                        {shopName}
                    </h3>
                    <p className="mt-1 truncate text-sm text-slate-500">{category}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => onViewShop(id)}
                        className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-100"
                    >
                        Xem quán
                    </button>

                    <button
                        type="button"
                        onClick={() => onListenAudio(id)}
                        className="rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
                    >
                        Audio
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ShopCard;
