import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./hooks";
import {
    clearAudioState,
    setAudioPlaying,
    setAudioProgress,
    setCurrentAudio,
    type AudioEntityType,
    type AudioTriggerType,
} from "./slices/audioSlice";
import { analyticsService } from "../services/analyticsService";
import { resolvePreferredLanguage } from "../utils/language";
import { notifyError, notifyInfo, notifyWarning } from "../utils/notify";

type PlayAudioInput = {
    id: number;
    type: AudioEntityType;
    url?: string | null;
    title?: string;
    shopId?: number;
    trigger?: AudioTriggerType;
    transcript?: string;
    transcriptLanguage?: string;
};

let globalAudio: HTMLAudioElement | null = null;

const getAudioLabel = ({ type, title }: { type: AudioEntityType; title?: string }) => {
    const prefix = type === "SHOP" ? "quán" : "món";
    return `${prefix} ${title || "không rõ tên"}`;
};

const isAutoplayBlockedError = (error: unknown): boolean => {
    if (error instanceof DOMException && error.name === "NotAllowedError") {
        return true;
    }

    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return message.includes("notallowederror") || message.includes("didn't interact");
    }

    return false;
};

const stopGlobalAudio = () => {
    if (!globalAudio) return;
    globalAudio.pause();
    globalAudio.currentTime = 0;
    globalAudio.src = "";
    globalAudio = null;
};

const getResolvedShopId = (type: AudioEntityType, id: number, shopId?: number) => {
    if (shopId) {
        return shopId;
    }

    if (type === "SHOP") {
        return id;
    }

    return null;
};

const trackAudioEvent = (
    eventType: "AUDIO_PLAY_START" | "AUDIO_PLAY_COMPLETE" | "AUDIO_PLAY_ERROR",
    payload: { id: number; type: AudioEntityType; title?: string; shopId?: number; trigger?: AudioTriggerType },
    metadata?: Record<string, unknown>
) => {
    const resolvedShopId = getResolvedShopId(payload.type, payload.id, payload.shopId);
    if (!resolvedShopId) {
        return;
    }

    void analyticsService
        .trackEvent({
            shopId: resolvedShopId,
            dishId: payload.type === "DISH" ? payload.id : undefined,
            eventType,
            source: "CUSTOMER_WEB",
            languageCode: resolvePreferredLanguage(),
            metadata: {
                entityType: payload.type,
                title: payload.title || null,
                trigger: payload.trigger || "MANUAL",
                ...metadata,
            },
        })
        .catch((error) => {
            console.error(`Track ${eventType} failed:`, error);
        });
};

export function useAudioPlayer() {
    const dispatch = useAppDispatch();
    const { current, isPlaying, progress, autoTurnOnNearbyShopAudio } = useAppSelector((state) => state.audio);

    const stopAudio = useCallback(() => {
        const previous = current;
        stopGlobalAudio();
        dispatch(clearAudioState());

        if (previous) {
            notifyInfo(`Đã dừng audio của ${getAudioLabel(previous)}`);
        }
    }, [current, dispatch]);

    const playAudio = useCallback(
        async ({
            id,
            type,
            url,
            title,
            shopId,
            trigger = "MANUAL",
            transcript,
            transcriptLanguage,
        }: PlayAudioInput) => {
            if (!url) {
                notifyWarning(`Không tìm thấy audio cho ${getAudioLabel({ type, title })}`);
                return false;
            }

            const isSameAudio =
                current?.id === id &&
                current?.type === type &&
                (!url || current?.url === url);

            if (isSameAudio && globalAudio) {
                if (globalAudio.paused) {
                    await globalAudio.play();
                    dispatch(setAudioPlaying(true));
                    notifyInfo(`Đang phát lại audio của ${getAudioLabel({ type, title })}`);
                }
                return true;
            }

            const previous = current;
            stopGlobalAudio();

            const nextAudio = new Audio(url);
            globalAudio = nextAudio;

            dispatch(
                setCurrentAudio({
                    id,
                    type,
                    url,
                    title,
                    shopId,
                    trigger,
                    transcript,
                    transcriptLanguage,
                })
            );
            dispatch(
                setAudioProgress({
                    progress: 0,
                    currentTimeSec: 0,
                    durationSec: 0,
                })
            );

            nextAudio.onloadedmetadata = () => {
                const duration = Number.isFinite(nextAudio.duration) && nextAudio.duration > 0
                    ? nextAudio.duration
                    : 0;
                dispatch(
                    setAudioProgress({
                        progress: 0,
                        currentTimeSec: 0,
                        durationSec: duration,
                    })
                );
            };

            nextAudio.onplay = () => {
                dispatch(setAudioPlaying(true));
            };

            nextAudio.onpause = () => {
                dispatch(setAudioPlaying(false));
            };

            nextAudio.ontimeupdate = () => {
                const duration = Number.isFinite(nextAudio.duration) && nextAudio.duration > 0
                    ? nextAudio.duration
                    : 0;
                const currentTime = Number.isFinite(nextAudio.currentTime) && nextAudio.currentTime > 0
                    ? nextAudio.currentTime
                    : 0;
                dispatch(
                    setAudioProgress({
                        progress: duration > 0 ? Math.min(1, currentTime / duration) : 0,
                        currentTimeSec: currentTime,
                        durationSec: duration,
                    })
                );
            };

            nextAudio.onended = () => {
                const endedAudio = { id, type, url, title, shopId, trigger };
                trackAudioEvent("AUDIO_PLAY_COMPLETE", endedAudio);
                dispatch(clearAudioState());
                stopGlobalAudio();
                notifyInfo(`Audio của ${getAudioLabel(endedAudio)} đã phát xong`);
            };

            try {
                await nextAudio.play();

                if (previous && (previous.id !== id || previous.type !== type)) {
                    notifyInfo(`Đã tắt audio cũ và đang phát ${getAudioLabel({ type, title })}`);
                } else {
                    notifyInfo(`Đang phát audio của ${getAudioLabel({ type, title })}`);
                }

                trackAudioEvent("AUDIO_PLAY_START", { id, type, title, shopId, trigger });

                return true;
            } catch (error) {
                trackAudioEvent("AUDIO_PLAY_ERROR", { id, type, title, shopId, trigger }, {
                    errorMessage: error instanceof Error ? error.message : "unknown",
                });
                dispatch(clearAudioState());
                stopGlobalAudio();
                if (!isAutoplayBlockedError(error)) {
                    notifyError(`Không thể phát audio của ${getAudioLabel({ type, title })}`);
                }
                throw error;
            }
        },
        [current, dispatch]
    );

    const toggleAudio = useCallback(
        async ({
            id,
            type,
            url,
            title,
            shopId,
            trigger = "MANUAL",
            transcript,
            transcriptLanguage,
        }: PlayAudioInput) => {
            const isSameAudio =
                current?.id === id &&
                current?.type === type &&
                (!url || current?.url === url);

            if (!isSameAudio || !globalAudio) {
                return playAudio({ id, type, url, title, shopId, trigger, transcript, transcriptLanguage });
            }

            if (globalAudio.paused) {
                await globalAudio.play();
                dispatch(setAudioPlaying(true));
                trackAudioEvent("AUDIO_PLAY_START", { id, type, title, shopId, trigger });
                notifyInfo(`Đang phát audio của ${getAudioLabel({ type, title })}`);
                return true;
            }

            globalAudio.pause();
            dispatch(setAudioPlaying(false));
            notifyInfo(`Đã tạm dừng audio của ${getAudioLabel({ type, title })}`);
            return true;
        },
        [current, dispatch, playAudio]
    );

    useEffect(() => {
        return () => {
            // giữ audio global giữa các page; không stop ở đây
        };
    }, []);

    return {
        currentAudio: current,
        isAudioPlaying: isPlaying,
        audioProgress: progress,
        autoTurnOnNearbyShopAudio,
        playAudio,
        toggleAudio,
        stopAudio,
    };
}

