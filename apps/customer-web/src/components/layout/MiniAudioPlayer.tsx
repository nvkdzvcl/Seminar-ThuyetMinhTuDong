import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAudioPlayer } from "../../stores/useAudioPlayer";

type ScriptToken = {
    value: string;
    isWord: boolean;
    wordIndex?: number;
};

function formatDuration(seconds: number) {
    if (!Number.isFinite(seconds) || seconds <= 0) {
        return "00:00";
    }
    const totalSeconds = Math.floor(seconds);
    const mm = Math.floor(totalSeconds / 60);
    const ss = totalSeconds % 60;
    return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function buildScriptTokens(script: string): ScriptToken[] {
    const parts = script.split(/(\s+)/);
    const tokens: ScriptToken[] = [];
    let wordCursor = 0;

    for (const part of parts) {
        if (!part) {
            continue;
        }
        const isWord = !/^\s+$/.test(part);
        if (isWord) {
            wordCursor += 1;
            tokens.push({ value: part, isWord: true, wordIndex: wordCursor });
        } else {
            tokens.push({ value: part, isWord: false });
        }
    }

    return tokens;
}

function MiniAudioPlayer() {
    const { currentAudio, isAudioPlaying, audioProgress, toggleAudio, stopAudio } = useAudioPlayer();
    const [isScriptExpanded, setIsScriptExpanded] = useState(true);
    const scriptContainerRef = useRef<HTMLDivElement | null>(null);
    const transcript = currentAudio?.transcript?.trim() || "";
    const hasTranscript = transcript.length > 0;
    const scriptTokens = useMemo(() => buildScriptTokens(transcript), [transcript]);
    const totalWords = useMemo(
        () => scriptTokens.reduce((count, token) => (token.isWord ? count + 1 : count), 0),
        [scriptTokens]
    );
    const spokenWords = totalWords > 0 ? Math.min(totalWords, Math.floor(audioProgress.progress * totalWords)) : 0;

    useEffect(() => {
        if (!currentAudio) {
            return;
        }
        setIsScriptExpanded(true);
    }, [currentAudio?.id, currentAudio?.type, currentAudio?.url]);

    useEffect(() => {
        if (!currentAudio) {
            return;
        }
        if (!hasTranscript || !isScriptExpanded || spokenWords <= 0) {
            return;
        }
        const scriptContainer = scriptContainerRef.current;
        if (!scriptContainer) {
            return;
        }
        const activeToken = scriptContainer.querySelector<HTMLElement>(`[data-word-index="${spokenWords}"]`);
        if (activeToken) {
            activeToken.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
        }
    }, [hasTranscript, isScriptExpanded, spokenWords]);

    if (!currentAudio) return null;

    const handleToggle = () => {
        void toggleAudio({
            id: currentAudio.id,
            type: currentAudio.type,
            url: currentAudio.url,
            title: currentAudio.title,
            shopId: currentAudio.shopId,
            trigger: currentAudio.trigger,
            transcript: currentAudio.transcript,
            transcriptLanguage: currentAudio.transcriptLanguage,
        });
    };

    const playerUi = (
        <div className="fixed bottom-16 left-0 right-0 z-[13010] border-t border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto w-full max-w-5xl px-3 py-2">
                <div className="flex min-h-12 items-center gap-3">
                    <button
                        type="button"
                        onClick={handleToggle}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white"
                    >
                        {isAudioPlaying ? "II" : ">"}
                    </button>

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                            {currentAudio.title || "Audio thuyết minh"}
                        </p>
                        <p className="text-xs text-slate-500">
                            {isAudioPlaying ? "Đang phát" : "Đã tạm dừng"} • {formatDuration(audioProgress.currentTimeSec)} / {formatDuration(audioProgress.durationSec)}
                        </p>
                    </div>

                    {hasTranscript ? (
                        <button
                            type="button"
                            onClick={() => setIsScriptExpanded((prev) => !prev)}
                            className="rounded-full border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                        >
                            {isScriptExpanded ? "Ẩn script" : "Hiện script"}
                        </button>
                    ) : null}

                    <button
                        type="button"
                        onClick={stopAudio}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        X
                    </button>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                        className="h-full rounded-full bg-emerald-500 transition-[width] duration-200"
                        style={{ width: `${Math.max(0, Math.min(100, audioProgress.progress * 100))}%` }}
                    />
                </div>

                {hasTranscript && isScriptExpanded ? (
                    <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                        <div className="mb-1 text-[11px] font-medium text-slate-500">
                            Script audio {currentAudio.transcriptLanguage ? `(${currentAudio.transcriptLanguage})` : ""}
                        </div>
                        <div
                            ref={scriptContainerRef}
                            className="max-h-20 overflow-y-auto text-sm leading-6 text-slate-500"
                        >
                            {scriptTokens.map((token, index) => {
                                if (!token.isWord) {
                                    return <span key={`space-${index}`}>{token.value}</span>;
                                }
                                const isSpoken = (token.wordIndex || 0) <= spokenWords;
                                return (
                                    <span
                                        key={`word-${index}`}
                                        data-word-index={token.wordIndex}
                                        className={isSpoken ? "font-medium text-emerald-700" : "text-slate-500"}
                                    >
                                        {token.value}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );

    if (typeof document === "undefined") {
        return playerUi;
    }

    return createPortal(playerUi, document.body);
}

export default MiniAudioPlayer;
