import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type ModalType = "CONFIRM" | "ALERT";

export type ConfirmModalProps = {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
};

export type AlertModalProps = {
    title?: string;
    message: string;
    okText?: string;
    onOk?: () => void;
};

export type ModalItem =
    | { id: string; type: "CONFIRM"; props: ConfirmModalProps }
    | { id: string; type: "ALERT"; props: AlertModalProps };

type ModalState = {
    stack: ModalItem[];
};

const initialState: ModalState = {
    stack: [],
};

const modalSlice = createSlice({
    name: "modal",
    initialState,
    reducers: {
        openModal(state, action: PayloadAction<Omit<ModalItem, "id">>) {
            const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
            state.stack.push({ id, ...action.payload } as ModalItem);
        },
        closeTopModal(state) {
            state.stack.pop();
        },
        closeAllModals(state) {
            state.stack = [];
        },
    },
});

export const { openModal, closeTopModal, closeAllModals } = modalSlice.actions;
export default modalSlice.reducer;
