import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./hooks";
import {
    clearAudioState,
    setAudioPlaying,
    setCurrentAudio,
    type AudioEntityType,
    type AudioTriggerType,
} from "./slices/audioSlice";

type PlayAudioInput = {
    id: number;
    type: AudioEntityType;
    url?: string | null;
    title?: string;
    shopId?: number;
    trigger?: AudioTriggerType;
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

export function useAudioPlayer() {
    const dispatch = useAppDispatch();
    const { current, isPlaying, autoTurnOnNearbyShopAudio } = useAppSelector((state) => state.audio);

    const stopAudio = useCallback(() => {
        const previous = current;
        stopGlobalAudio();
        dispatch(clearAudioState());

        if (previous) {
            alert(`Đã dừng audio của ${getAudioLabel(previous)}`);
        }
    }, [current, dispatch]);

    const playAudio = useCallback(
        async ({ id, type, url, title, shopId, trigger = "MANUAL" }: PlayAudioInput) => {
            if (!url) {
                alert(`Không tìm thấy audio cho ${getAudioLabel({ type, title })}`);
                return false;
            }

            const isSameAudio = current?.id === id && current?.type === type;

            if (isSameAudio && globalAudio) {
                if (globalAudio.paused) {
                    await globalAudio.play();
                    dispatch(setAudioPlaying(true));
                    alert(`Đang phát lại audio của ${getAudioLabel({ type, title })}`);
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
                })
            );

            nextAudio.onplay = () => {
                dispatch(setAudioPlaying(true));
            };

            nextAudio.onpause = () => {
                dispatch(setAudioPlaying(false));
            };

            nextAudio.onended = () => {
                const endedAudio = { id, type, url, title, shopId, trigger };
                dispatch(clearAudioState());
                stopGlobalAudio();
                alert(`Audio của ${getAudioLabel(endedAudio)} đã phát xong`);
            };

            try {
                await nextAudio.play();

                if (previous && (previous.id !== id || previous.type !== type)) {
                    alert(
                        `Đã tắt audio cũ và đang phát ${getAudioLabel({ type, title })}`
                    );
                } else {
                    alert(`Đang phát audio của ${getAudioLabel({ type, title })}`);
                }

                return true;
            } catch (error) {
                dispatch(clearAudioState());
                stopGlobalAudio();
                if (!isAutoplayBlockedError(error)) {
                    alert(`Không thể phát audio của ${getAudioLabel({ type, title })}`);
                }
                throw error;
            }
        },
        [current, dispatch]
    );

    const toggleAudio = useCallback(
        async ({ id, type, url, title, shopId, trigger = "MANUAL" }: PlayAudioInput) => {
            const isSameAudio = current?.id === id && current?.type === type;

            if (!isSameAudio || !globalAudio) {
                return playAudio({ id, type, url, title, shopId, trigger });
            }

            if (globalAudio.paused) {
                await globalAudio.play();
                dispatch(setAudioPlaying(true));
                alert(`Đang phát audio của ${getAudioLabel({ type, title })}`);
                return true;
            }

            globalAudio.pause();
            dispatch(setAudioPlaying(false));
            alert(`Đã tạm dừng audio của ${getAudioLabel({ type, title })}`);
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
        autoTurnOnNearbyShopAudio,
        playAudio,
        toggleAudio,
        stopAudio,
    };
}
