import React, { useEffect } from "react";

export default function ModalBase({
    open,
    onClose,
    children,
    zIndex = 10000,
}: {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    zIndex?: number;
}) {
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.45)",
                backdropFilter: "blur(2px)",
                display: "grid",
                placeItems: "center",
                zIndex,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "min(460px, 92vw)",
                    borderRadius: 12,
                    background: "#fff",
                    padding: 20,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                }}
            >
                {children}
            </div>
        </div>
    );
}
