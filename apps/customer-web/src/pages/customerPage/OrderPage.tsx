import { useMemo, useState } from "react";
import { notifyInfo } from "../../utils/notify";

type OrderStatus = "PROCESSING" | "COMPLETED" | "CANCELLED";

type OrderItem = {
    id: number;
    dishName: string;
    quantity: number;
    price: number;
};

type Order = {
    id: number;
    shopName: string;
    createdAt: string;
    total: number;
    status: OrderStatus;
    items: OrderItem[];
};

const tabs = [
    { id: "ALL", label: "Tất cả" },
    { id: "PROCESSING", label: "Đang xử lý" },
    { id: "COMPLETED", label: "Hoàn tất" },
    { id: "CANCELLED", label: "Đã hủy" },
] as const;

const mockOrders: Order[] = [
    {
        id: 1,
        shopName: "Ốc Đào Vĩnh Khánh",
        createdAt: "2026-03-20 19:40",
        total: 175000,
        status: "COMPLETED",
        items: [
            { id: 1, dishName: "Ốc Hương Rang Muối", quantity: 1, price: 90000 },
            { id: 2, dishName: "Ốc Len Xào Dừa", quantity: 1, price: 85000 },
        ],
    },
    {
        id: 2,
        shopName: "Bánh Canh Cua Cô Dung",
        createdAt: "2026-03-21 18:10",
        total: 130000,
        status: "PROCESSING",
        items: [{ id: 3, dishName: "Bánh Canh Cua Đặc Biệt", quantity: 2, price: 65000 }],
    },
];

function OrderPage() {
    const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("ALL");
    const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

    const orders = useMemo(() => {
        if (activeTab === "ALL") return mockOrders;
        return mockOrders.filter((order) => order.status === activeTab);
    }, [activeTab]);

    const statusClasses: Record<OrderStatus, string> = {
        PROCESSING: "bg-amber-100 text-amber-700",
        COMPLETED: "bg-emerald-100 text-emerald-700",
        CANCELLED: "bg-rose-100 text-rose-700",
    };

    return (
        <div className="px-4 py-4">
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                            activeTab === tab.id
                                ? "bg-blue-600 text-white"
                                : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                {orders.map((order) => (
                    <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm text-slate-500">{order.createdAt}</p>
                                <h3 className="text-base font-semibold text-slate-900">{order.shopName}</h3>
                            </div>
                            <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[order.status]}`}
                            >
                                {tabs.find((item) => item.id === order.status)?.label}
                            </span>
                        </div>

                        <div className="mb-3 flex items-center justify-between text-sm">
                            <span className="text-slate-500">Tổng tiền</span>
                            <span className="font-bold text-emerald-700">
                                {order.total.toLocaleString("vi-VN")}đ
                            </span>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setExpandedOrderId((prev) => (prev === order.id ? null : order.id))
                                }
                                className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700"
                            >
                                {expandedOrderId === order.id ? "Ẩn chi tiết" : "Xem chi tiết"}
                            </button>

                            {order.status === "COMPLETED" && (
                                <button
                                    type="button"
                                    onClick={() => notifyInfo("Tính năng nghe lại sẽ được cập nhật ở bước tích hợp AI streaming")}
                                    className="flex-1 rounded-xl bg-cyan-600 px-3 py-2.5 text-sm font-semibold text-white"
                                >
                                    Nghe lại
                                </button>
                            )}
                        </div>

                        {expandedOrderId === order.id && (
                            <div className="mt-3 rounded-xl bg-slate-50 p-3">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between py-1.5 text-sm">
                                        <span className="text-slate-700">
                                            {item.dishName} x{item.quantity}
                                        </span>
                                        <span className="font-semibold text-slate-900">
                                            {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default OrderPage;
