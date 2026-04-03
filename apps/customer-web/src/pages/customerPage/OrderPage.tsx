import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { dishService } from "../../services/dishService";
import {
    orderService,
    type OrderResponse,
    type OrderWorkflowStatus,
} from "../../services/orderService";
import type { Dish } from "../../types/dish";
import { notifyError, notifyInfo, notifySuccess } from "../../utils/notify";

type OrderTab = "ALL" | "WAIT" | "PREPARING" | "COMPLETED" | "CANCELLED";

const tabs: Array<{ id: OrderTab; label: string }> = [
    { id: "ALL", label: "Tat ca" },
    { id: "WAIT", label: "Cho xac nhan" },
    { id: "PREPARING", label: "Dang chuan bi" },
    { id: "COMPLETED", label: "Hoan tat" },
    { id: "CANCELLED", label: "Da huy" },
];

const statusLabels: Record<OrderWorkflowStatus, string> = {
    WAIT: "Cho xac nhan",
    PREPARING: "Dang chuan bi",
    COMPLETED: "Hoan tat",
    CUSTOMER_CANCELLED: "Ban da huy",
    SHOP_CANCELLED: "Quan da huy",
};

const statusClasses: Record<OrderWorkflowStatus, string> = {
    WAIT: "bg-amber-100 text-amber-700",
    PREPARING: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    CUSTOMER_CANCELLED: "bg-rose-100 text-rose-700",
    SHOP_CANCELLED: "bg-rose-100 text-rose-700",
};

function formatDate(raw?: string): string {
    if (!raw) return "";
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
        return raw;
    }
    return parsed.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function resolveOrderErrorMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError(error)) {
        const responseData = error.response?.data as { message?: string } | undefined;
        if (responseData?.message) {
            return responseData.message;
        }
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
}

function isCancelableByCustomer(order: OrderResponse): boolean {
    return order.orderStatus === "WAIT";
}

function canAddMoreItems(order: OrderResponse): boolean {
    return order.orderStatus === "WAIT" || order.orderStatus === "PREPARING";
}

function OrderPage() {
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<OrderTab>("ALL");
    const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [cancelingOrderId, setCancelingOrderId] = useState<number | null>(null);
    const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
    const [addingOrderId, setAddingOrderId] = useState<number | null>(null);
    const [availableDishesByShop, setAvailableDishesByShop] = useState<Record<number, Dish[]>>({});
    const [selectedDishIdByOrder, setSelectedDishIdByOrder] = useState<Record<number, number>>({});
    const [selectedQuantityByOrder, setSelectedQuantityByOrder] = useState<Record<number, number>>({});

    const previousStatusesRef = useRef<Record<number, OrderWorkflowStatus>>({});
    const announcedNewOrderRef = useRef(false);

    const newOrderIdParam = Number(searchParams.get("newOrderId") || 0);
    const hasNewOrderParam = Number.isFinite(newOrderIdParam) && newOrderIdParam > 0;

    const loadOrders = async (silent: boolean) => {
        if (!silent) {
            setIsLoading(true);
        }
        setErrorMessage("");

        try {
            const response = await orderService.getMyOrders();
            const nextOrders = response.result ?? [];

            const nextStatusMap: Record<number, OrderWorkflowStatus> = {};
            nextOrders.forEach((order) => {
                nextStatusMap[order.id] = order.orderStatus;

                const previousStatus = previousStatusesRef.current[order.id];
                if (previousStatus && previousStatus !== order.orderStatus) {
                    notifyInfo(
                        `Don #${order.id} da chuyen sang trang thai: ${
                            statusLabels[order.orderStatus] || order.orderStatus
                        }`
                    );
                }
            });

            previousStatusesRef.current = nextStatusMap;
            setOrders(nextOrders);
        } catch (error) {
            setErrorMessage(resolveOrderErrorMessage(error, "Khong the tai danh sach don hang."));
        } finally {
            if (!silent) {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        void loadOrders(false);

        const pollTimer = window.setInterval(() => {
            void loadOrders(true);
        }, 8000);

        return () => {
            window.clearInterval(pollTimer);
        };
    }, []);

    useEffect(() => {
        if (!hasNewOrderParam || announcedNewOrderRef.current || orders.length === 0) {
            return;
        }

        const createdOrder = orders.find((order) => order.id === newOrderIdParam);
        if (!createdOrder) {
            return;
        }

        announcedNewOrderRef.current = true;
        setExpandedOrderId(createdOrder.id);
        setActiveTab("ALL");
        notifySuccess(`Da tao don #${createdOrder.id}. Ban co the theo doi trang thai tai day.`);
    }, [hasNewOrderParam, newOrderIdParam, orders]);

    const filteredOrders = useMemo(() => {
        if (activeTab === "ALL") {
            return orders;
        }

        if (activeTab === "CANCELLED") {
            return orders.filter(
                (order) =>
                    order.orderStatus === "CUSTOMER_CANCELLED" || order.orderStatus === "SHOP_CANCELLED"
            );
        }

        return orders.filter((order) => order.orderStatus === activeTab);
    }, [activeTab, orders]);

    const ensureShopDishesLoaded = async (shopId: number) => {
        const existing = availableDishesByShop[shopId];
        if (existing && existing.length > 0) {
            return existing;
        }

        const response = await dishService.getByShopId(shopId, "ACTIVE", 1, 100);
        const dishes = response.result?.items ?? [];

        setAvailableDishesByShop((current) => ({
            ...current,
            [shopId]: dishes,
        }));

        return dishes;
    };

    const startAddMoreItems = async (order: OrderResponse) => {
        try {
            setEditingOrderId(order.id);
            const dishes = await ensureShopDishesLoaded(order.shopId);
            if (dishes.length === 0) {
                notifyInfo("Quan hien khong co mon active de goi them.");
                setEditingOrderId(null);
                return;
            }

            setSelectedDishIdByOrder((current) => ({
                ...current,
                [order.id]: current[order.id] ?? dishes[0].id,
            }));
            setSelectedQuantityByOrder((current) => ({
                ...current,
                [order.id]: Math.max(1, current[order.id] ?? 1),
            }));
        } catch (error) {
            notifyError(resolveOrderErrorMessage(error, "Khong the tai menu de goi them mon."));
            setEditingOrderId(null);
        }
    };

    const submitAddMoreItems = async (order: OrderResponse) => {
        const dishId = selectedDishIdByOrder[order.id];
        const quantity = Math.max(1, selectedQuantityByOrder[order.id] ?? 1);

        if (!dishId) {
            notifyInfo("Vui long chon mon can goi them.");
            return;
        }

        try {
            setAddingOrderId(order.id);
            await orderService.addItemsByCustomer(order.id, {
                orderItems: [
                    {
                        dishId,
                        quantity,
                    },
                ],
            });

            notifySuccess("Da goi them mon thanh cong.");
            setEditingOrderId(null);
            await loadOrders(true);
        } catch (error) {
            notifyError(resolveOrderErrorMessage(error, "Khong the goi them mon cho don hang."));
        } finally {
            setAddingOrderId(null);
        }
    };

    const handleCancelOrder = async (order: OrderResponse) => {
        try {
            setCancelingOrderId(order.id);
            await orderService.cancelByCustomer(order.id);
            notifySuccess("Ban da huy don hang.");
            await loadOrders(true);
        } catch (error) {
            notifyError(resolveOrderErrorMessage(error, "Khong the huy don hang."));
        } finally {
            setCancelingOrderId(null);
        }
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

            {isLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
                    Dang tai don hang...
                </div>
            ) : null}

            {!isLoading && errorMessage ? (
                <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {errorMessage}
                </div>
            ) : null}

            {!isLoading && !errorMessage && filteredOrders.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
                    Chua co don hang nao phu hop bo loc.
                </div>
            ) : null}

            <div className="space-y-3">
                {filteredOrders.map((order) => {
                    const orderDishes = availableDishesByShop[order.shopId] ?? [];
                    const selectedDishId = selectedDishIdByOrder[order.id] ?? orderDishes[0]?.id;
                    const selectedQuantity = Math.max(1, selectedQuantityByOrder[order.id] ?? 1);
                    const isExpanded = expandedOrderId === order.id;
                    const isEditing = editingOrderId === order.id;

                    return (
                        <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="mb-3 flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm text-slate-500">{formatDate(order.createdAt)}</p>
                                    <h3 className="text-base font-semibold text-slate-900">{order.shopName}</h3>
                                    <p className="text-xs text-slate-500">Ma don: #{order.id}</p>
                                </div>
                                <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                        statusClasses[order.orderStatus] || "bg-slate-100 text-slate-700"
                                    }`}
                                >
                                    {statusLabels[order.orderStatus] || order.orderStatus}
                                </span>
                            </div>

                            <div className="mb-3 flex items-center justify-between text-sm">
                                <span className="text-slate-500">Tong tien</span>
                                <span className="font-bold text-emerald-700">
                                    {Number(order.totalPrice || 0).toLocaleString("vi-VN")}d
                                </span>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-3">
                                <button
                                    type="button"
                                    onClick={() => setExpandedOrderId((prev) => (prev === order.id ? null : order.id))}
                                    className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700"
                                >
                                    {isExpanded ? "An chi tiet" : "Xem chi tiet"}
                                </button>

                                {isCancelableByCustomer(order) ? (
                                    <button
                                        type="button"
                                        onClick={() => void handleCancelOrder(order)}
                                        disabled={cancelingOrderId === order.id}
                                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {cancelingOrderId === order.id ? "Dang huy..." : "Huy don"}
                                    </button>
                                ) : (
                                    <div className="hidden sm:block" />
                                )}

                                {canAddMoreItems(order) ? (
                                    <button
                                        type="button"
                                        onClick={() => void startAddMoreItems(order)}
                                        className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                                    >
                                        Goi them mon
                                    </button>
                                ) : (
                                    <div className="hidden sm:block" />
                                )}
                            </div>

                            {isExpanded ? (
                                <div className="mt-3 rounded-xl bg-slate-50 p-3">
                                    {order.orderItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between gap-3 py-1.5 text-sm"
                                        >
                                            <span className="text-slate-700">
                                                {item.dishName || `Mon #${item.dishId}`} x{item.quantity}
                                            </span>
                                            <span className="font-semibold text-slate-900">
                                                {Number(item.pricePerUnit * item.quantity).toLocaleString("vi-VN")}d
                                            </span>
                                        </div>
                                    ))}

                                    {isEditing && canAddMoreItems(order) ? (
                                        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                                            <p className="mb-2 text-sm font-semibold text-slate-800">Them mon vao don</p>

                                            <div className="grid gap-2 sm:grid-cols-2">
                                                <select
                                                    value={selectedDishId || ""}
                                                    onChange={(event) =>
                                                        setSelectedDishIdByOrder((current) => ({
                                                            ...current,
                                                            [order.id]: Number(event.target.value),
                                                        }))
                                                    }
                                                    className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none"
                                                >
                                                    {orderDishes.map((dish) => (
                                                        <option key={dish.id} value={dish.id}>
                                                            {dish.name} - {Number(dish.price || 0).toLocaleString("vi-VN")}d
                                                        </option>
                                                    ))}
                                                </select>

                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={selectedQuantity}
                                                    onChange={(event) =>
                                                        setSelectedQuantityByOrder((current) => ({
                                                            ...current,
                                                            [order.id]: Math.max(1, Number(event.target.value) || 1),
                                                        }))
                                                    }
                                                    className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none"
                                                />
                                            </div>

                                            <div className="mt-2 flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingOrderId(null)}
                                                    className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                                                >
                                                    Dong
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void submitAddMoreItems(order)}
                                                    disabled={addingOrderId === order.id || orderDishes.length === 0}
                                                    className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {addingOrderId === order.id ? "Dang them..." : "Xac nhan them"}
                                                </button>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default OrderPage;
