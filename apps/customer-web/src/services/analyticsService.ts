import axiosClient from "./axiosClient";
import type { ApiResponse } from "../types/api";

type AnalyticsEventType =
  | "QR_SCAN"
  | "AUDIO_PLAY_START"
  | "AUDIO_PLAY_COMPLETE"
  | "AUDIO_PLAY_ERROR";

type AnalyticsEventSource = "CUSTOMER_WEB" | "QR_DIRECT";

const SESSION_STORAGE_KEY = "VINH_KHANH_ANALYTICS_SESSION_ID";

export interface TrackAnalyticsEventPayload {
  eventId?: string;
  shopId: number;
  poiId?: number;
  dishId?: number;
  eventType: AnalyticsEventType;
  languageCode?: string;
  source?: AnalyticsEventSource;
  metadata?: Record<string, unknown>;
}

interface TrackAnalyticsEventResponse {
  eventId: string;
  accepted: boolean;
  duplicate: boolean;
}

function generateRandomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `evt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getOrCreateSessionId(): string {
  const stored = localStorage.getItem(SESSION_STORAGE_KEY);
  if (stored && stored.trim()) {
    return stored;
  }

  const sessionId = `sess-${generateRandomId()}`;
  localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  return sessionId;
}

export const analyticsService = {
  trackEvent: async (payload: TrackAnalyticsEventPayload) => {
    const body = {
      eventId: payload.eventId || generateRandomId(),
      shopId: payload.shopId,
      poiId: payload.poiId,
      dishId: payload.dishId,
      sessionId: getOrCreateSessionId(),
      eventType: payload.eventType,
      languageCode: payload.languageCode,
      source: payload.source || "CUSTOMER_WEB",
      metadata: payload.metadata,
    };

    const res = await axiosClient.post<ApiResponse<TrackAnalyticsEventResponse>>(
      "/analytics/events",
      body
    );
    return res.data;
  },
};
