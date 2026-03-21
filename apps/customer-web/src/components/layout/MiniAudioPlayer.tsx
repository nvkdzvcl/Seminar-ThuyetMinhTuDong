import { useAudioPlayer } from "../../stores/useAudioPlayer";

function MiniAudioPlayer() {
    const { currentAudio, isAudioPlaying, toggleAudio, stopAudio } = useAudioPlayer();

    if (!currentAudio) return null;

    const handleToggle = () => {
        void toggleAudio({
            id: currentAudio.id,
            type: currentAudio.type,
            url: currentAudio.url,
            title: currentAudio.title,
            shopId: currentAudio.shopId,
            trigger: currentAudio.trigger,
        });
    };

    return (
        <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-3">
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
                        {isAudioPlaying ? "Đang phát" : "Đã tạm dừng"}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={stopAudio}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                >
                    X
                </button>
            </div>
        </div>
    );
}

export default MiniAudioPlayer;
