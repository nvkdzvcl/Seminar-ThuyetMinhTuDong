import { Client } from "@stomp/stompjs";
import type { NavigateFunction } from "react-router-dom";
import type { IMessage } from "@stomp/stompjs";
import type { ApiResponse, PagingDto } from "../types/api";
import type { ShopResponse } from "../types/shop";

export type NearbyShopSocketRequest = {
    lat: number;
    lng: number;
    radius: number;
    page?: number;
    size?: number;
};

let stompClient: Client | null = null;

export const locationSocketService = {
    connect: (
        token: string,
        navigate: NavigateFunction,
        onSuccess: (data: ApiResponse<PagingDto<ShopResponse>>) => void,
        onError?: (error: ApiResponse<null>) => void,
        onConnected?: () => void
    ) => {
        if (!token) {
            console.error("Thiếu token websocket");
            navigate("/login");
            return;
        }

        if (stompClient?.active || stompClient?.connected) {
            return;
        }

        stompClient = new Client({
            brokerURL: `${import.meta.env.VITE_WS_API}/ws-location`,
            reconnectDelay: 5000,
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            onConnect: () => {
                console.log("WebSocket connected");

                stompClient?.subscribe("/user/queue/nearby-shops", (message: IMessage) => {
                    const data = JSON.parse(message.body);
                    onSuccess(data);
                });

                stompClient?.subscribe("/user/queue/nearby-shops-error", (message: IMessage) => {
                    const error = JSON.parse(message.body);
                    onError?.(error);
                });

                onConnected?.();
            },
            onStompError: (frame) => {
                console.error("STOMP error:", frame);
            },
            onWebSocketError: (event) => {
                console.error("WebSocket error:", event);
            },
        });

        stompClient.activate();
    },

    sendLocation: (payload: NearbyShopSocketRequest) => {
        if (!stompClient || !stompClient.connected) {
            console.warn("Socket chưa connect");
            return;
        }

        stompClient.publish({
            destination: "/app/shops/nearby",
            body: JSON.stringify(payload),
        });
    },

    disconnect: () => {
        stompClient?.deactivate();
        stompClient = null;
    },
};