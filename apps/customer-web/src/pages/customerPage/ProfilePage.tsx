import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { authService } from "../../services/authService";
import { notifyLanguageChanged } from "../../utils/language";
import { resolveLanguageOptionValue, useSupportedLanguages } from "../../hooks/useSupportedLanguages";
import { notifyError, notifySuccess } from "../../utils/notify";

const LS_ACCESS = "VINH_KHANH_FOOD_TOUR_ACCESS_TOKEN";
const LS_REFRESH = "VINH_KHANH_FOOD_TOUR_REFRESH_TOKEN";
const LS_USER = "VINH_KHANH_FOOD_TOUR_USER";
const AUTO_AUDIO_KEY = "autoTurnOnNearbyShopAudio";

function ProfilePage() {
    const navigate = useNavigate();
    const { options: languageOptions, loading: languageLoading } = useSupportedLanguages();
    const storedUser = localStorage.getItem(LS_USER);
    const user = storedUser ? JSON.parse(storedUser) : null;
    const [autoAudio, setAutoAudio] = useState(localStorage.getItem("autoTurnOnNearbyShopAudio") === "true");
    const [speed, setSpeed] = useState("1.0");
    const [lang, setLang] = useState(String(user?.language || "en"));
    const [isUpdatingLanguage, setIsUpdatingLanguage] = useState(false);

    useEffect(() => {
        if (languageOptions.length === 0) return;
        const resolvedValue = resolveLanguageOptionValue(languageOptions, lang);
        if (!resolvedValue || resolvedValue === lang) return;
        setLang(resolvedValue);
    }, [languageOptions, lang]);

    const handleLogout = () => {
        localStorage.removeItem(LS_ACCESS);
        localStorage.removeItem(LS_REFRESH);
        localStorage.removeItem(LS_USER);
        localStorage.removeItem(AUTO_AUDIO_KEY);
        navigate("/login", { replace: true });
    };

    const handleAutoAudio = (checked: boolean) => {
        setAutoAudio(checked);
        localStorage.setItem("autoTurnOnNearbyShopAudio", String(checked));
    };

    const resolveRequestErrorMessage = (error: unknown): string => {
        if (axios.isAxiosError(error)) {
            const responseData = error.response?.data as { message?: string } | undefined;
            if (responseData?.message) {
                return responseData.message;
            }
        }

        if (error instanceof Error && error.message) {
            return error.message;
        }

        return "KhÃ´ng thá»ƒ cáº­p nháº­t ngÃ´n ngá»¯ lÃºc nÃ y. Vui lÃ²ng thá»­ láº¡i.";
    };

    const handleLanguageChange = async (value: string) => {
        const selectedLanguage = value.trim();
        if (!selectedLanguage || selectedLanguage === lang) return;

        const previousLanguage = lang;
        setLang(selectedLanguage);
        setIsUpdatingLanguage(true);

        try {
            const response = await authService.updateMyLanguage(selectedLanguage);
            const persistedLanguage = String(response.result?.language || selectedLanguage).trim();

            const rawUser = localStorage.getItem(LS_USER);
            let currentUser: Record<string, unknown> = {};
            if (rawUser) {
                try {
                    currentUser = JSON.parse(rawUser) as Record<string, unknown>;
                } catch {
                    currentUser = {};
                }
            }
            localStorage.setItem(
                LS_USER,
                JSON.stringify({
                    ...currentUser,
                    ...response.result,
                    language: persistedLanguage,
                })
            );
            setLang(persistedLanguage);
            notifyLanguageChanged();
            notifySuccess("ÄÃ£ cáº­p nháº­t ngÃ´n ngá»¯ pháº£n há»“i theo chá»n cá»§a báº¡n.");
        } catch (error) {
            setLang(previousLanguage);
            notifyError(resolveRequestErrorMessage(error));
        } finally {
            setIsUpdatingLanguage(false);
        }
    };

    return (
        <div className="space-y-4 px-4 py-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500">Tài khoản</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">{user?.fullName || "Khách hàng"}</h2>
                <p className="mt-1 text-sm text-slate-600">{user?.email || "Chưa có email"}</p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">Tùy chọn nghe audio</h3>

                <div className="mt-4 space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-sm text-slate-700 sm:pr-3">
                            Ngôn ngữ mặc định {languageOptions.length > 0 ? `(${languageOptions.length})` : ""}
                        </span>
                        <select
                            data-no-auto-translate="true"
                            value={lang}
                            onChange={(e) => {
                                void handleLanguageChange(e.target.value);
                            }}
                            disabled={languageLoading || languageOptions.length === 0 || isUpdatingLanguage}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm sm:w-56"
                        >
                            {languageOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-sm text-slate-700">Tốc độ đọc</span>
                        <select
                            value={speed}
                            onChange={(e) => setSpeed(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm sm:w-28"
                        >
                            <option value="0.9">0.9x</option>
                            <option value="1.0">1.0x</option>
                            <option value="1.1">1.1x</option>
                        </select>
                    </div>

                    <label className="flex items-start justify-between gap-3 sm:items-center">
                        <span className="text-sm text-slate-700">Tự phát audio khi tới gần quán</span>
                        <input
                            type="checkbox"
                            checked={autoAudio}
                            onChange={(e) => handleAutoAudio(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded sm:mt-0"
                        />
                    </label>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">Lịch sử đã nghe</h3>
                <p className="mt-2 text-sm text-slate-500">Bạn chưa nghe audio nào gần đây.</p>
            </section>

            <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-2xl bg-rose-600 px-4 py-3 font-semibold text-white transition hover:bg-rose-700"
            >
                Đăng xuất
            </button>
        </div>
    );
}

export default ProfilePage;
