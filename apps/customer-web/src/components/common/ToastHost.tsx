import { useEffect, useMemo, useState } from "react";
import {
    CUSTOMER_NOTIFY_EVENT,
    type NotifyPayload,
    type NotifyType,
} from "../../utils/notify";

type ToastItem = NotifyPayload & {
    id: string;
    type: NotifyType;
};

const DEFAULT_DURATION_MS = 2600;

function getToastClass(type: NotifyType): string {
    switch (type) {
        case "success":
            return "border-emerald-200 bg-emerald-50 text-emerald-900";
        case "error":
            return "border-red-200 bg-red-50 text-red-900";
        case "warning":
            return "border-amber-200 bg-amber-50 text-amber-900";
        case "info":
        default:
            return "border-cyan-200 bg-cyan-50 text-cyan-900";
    }
}

function getToastIcon(type: NotifyType): string {
    switch (type) {
        case "success":
            return "✓";
        case "error":
            return "!";
        case "warning":
            return "!";
        case "info":
        default:
            return "i";
    }
}

export default function ToastHost() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    useEffect(() => {
        const handleToast = (event: Event) => {
            const customEvent = event as CustomEvent<NotifyPayload>;
            const payload = customEvent.detail;
            if (!payload?.message?.trim()) {
                return;
            }

            const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
            const toast: ToastItem = {
                id,
                title: payload.title,
                message: payload.message.trim(),
                type: payload.type ?? "info",
                durationMs: payload.durationMs ?? DEFAULT_DURATION_MS,
            };

            setToasts((current) => {
                const next = [...current, toast];
                if (next.length > 4) {
                    return next.slice(next.length - 4);
                }
                return next;
            });
        };

        window.addEventListener(CUSTOMER_NOTIFY_EVENT, handleToast as EventListener);
        return () => {
            window.removeEventListener(CUSTOMER_NOTIFY_EVENT, handleToast as EventListener);
        };
    }, []);

    useEffect(() => {
        if (toasts.length === 0) {
            return;
        }

        const timers = toasts.map((toast) =>
            window.setTimeout(() => {
                setToasts((current) => current.filter((item) => item.id !== toast.id));
            }, toast.durationMs ?? DEFAULT_DURATION_MS)
        );

        return () => {
            timers.forEach((timer) => window.clearTimeout(timer));
        };
    }, [toasts]);

    const visibleToasts = useMemo(() => [...toasts], [toasts]);

    if (visibleToasts.length === 0) {
        return null;
    }

    return (
        <div className="pointer-events-none fixed right-4 top-4 z-[13000] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
            {visibleToasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`pointer-events-auto rounded-xl border px-3 py-3 shadow-lg backdrop-blur-sm ${getToastClass(toast.type)}`}
                    role="status"
                    aria-live="polite"
                >
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/80 text-sm font-bold">
                            {getToastIcon(toast.type)}
                        </div>
                        <div className="min-w-0">
                            {toast.title ? (
                                <div className="text-sm font-semibold">{toast.title}</div>
                            ) : null}
                            <p className="text-sm leading-5">{toast.message}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
