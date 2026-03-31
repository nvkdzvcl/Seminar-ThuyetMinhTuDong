export type NotifyType = "success" | "error" | "info" | "warning";

export type NotifyPayload = {
    title?: string;
    message: string;
    type?: NotifyType;
    durationMs?: number;
};

export const CUSTOMER_NOTIFY_EVENT = "customer-notify";

export function notify(payload: NotifyPayload) {
    if (typeof window === "undefined") {
        return;
    }

    window.dispatchEvent(
        new CustomEvent<NotifyPayload>(CUSTOMER_NOTIFY_EVENT, {
            detail: payload,
        })
    );
}

export function notifySuccess(message: string, title?: string, durationMs?: number) {
    notify({ message, title, durationMs, type: "success" });
}

export function notifyError(message: string, title?: string, durationMs?: number) {
    notify({ message, title, durationMs, type: "error" });
}

export function notifyInfo(message: string, title?: string, durationMs?: number) {
    notify({ message, title, durationMs, type: "info" });
}

export function notifyWarning(message: string, title?: string, durationMs?: number) {
    notify({ message, title, durationMs, type: "warning" });
}
