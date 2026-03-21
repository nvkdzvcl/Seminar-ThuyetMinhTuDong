import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../stores/hooks";
import { closeTopModal } from "../../stores/slices/modalSlice";
import ModalBase from "../ui/ModalBase";

export default function ModalHost() {
    const dispatch = useAppDispatch();
    const stack = useAppSelector((s) => s.modal.stack);

    // lock scroll khi có modal
    useEffect(() => {
        if (stack.length === 0) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [stack.length]);

    if (stack.length === 0) return null;

    // chỉ modal top-most nhận close
    return (
        <>
            {stack.map((item, idx) => {
                const isTop = idx === stack.length - 1;
                const zIndex = 10000 + idx;

                return (
                    <ModalBase
                        key={item.id}
                        open
                        zIndex={zIndex}
                        onClose={() => {
                            if (isTop) dispatch(closeTopModal());
                        }}
                    >
                        {item.type === "CONFIRM" && (
                            <ConfirmModal
                                {...item.props}
                                onClose={() => dispatch(closeTopModal())}
                            />
                        )}

                        {item.type === "ALERT" && (
                            <AlertModal {...item.props} onClose={() => dispatch(closeTopModal())} />
                        )}
                    </ModalBase>
                );
            })}
        </>
    );
}

function ConfirmModal({
    title = "Xác nhận",
    message,
    confirmText = "Đồng ý",
    cancelText = "Hủy",
    onConfirm,
    onCancel,
    onClose,
}: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    onClose: () => void;
}) {
    return (
        <div style={{ display: "grid", gap: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
            <div style={{ color: "#333" }}>{message}</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                    onClick={() => {
                        onCancel?.();
                        onClose();
                    }}
                >
                    {cancelText}
                </button>
                <button
                    onClick={() => {
                        onConfirm?.();
                        onClose();
                    }}
                >
                    {confirmText}
                </button>
            </div>
        </div>
    );
}

function AlertModal({
    title = "Thông báo",
    message,
    okText = "OK",
    onOk,
    onClose,
}: {
    title?: string;
    message: string;
    okText?: string;
    onOk?: () => void;
    onClose: () => void;
}) {
    return (
        <div style={{ display: "grid", gap: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
            <div style={{ color: "#333" }}>{message}</div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                    onClick={() => {
                        onOk?.();
                        onClose();
                    }}
                >
                    {okText}
                </button>
            </div>
        </div>
    );
}
