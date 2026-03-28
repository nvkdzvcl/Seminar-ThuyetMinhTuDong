import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { normalizeLocale, notifyLanguageChanged } from "../../utils/language";

const LS_ACCESS = "VINH_KHANH_FOOD_TOUR_ACCESS_TOKEN";
const LS_REFRESH = "VINH_KHANH_FOOD_TOUR_REFRESH_TOKEN";
const LS_USER = "VINH_KHANH_FOOD_TOUR_USER";

function ProfilePage() {
    const navigate = useNavigate();
    const storedUser = localStorage.getItem(LS_USER);
    const user = storedUser ? JSON.parse(storedUser) : null;
    const [autoAudio, setAutoAudio] = useState(localStorage.getItem("autoTurnOnNearbyShopAudio") === "true");
    const [speed, setSpeed] = useState("1.0");
    const [lang, setLang] = useState(normalizeLocale(user?.language || "en-US"));

    const handleLogout = () => {
        localStorage.removeItem(LS_ACCESS);
        localStorage.removeItem(LS_REFRESH);
        localStorage.removeItem(LS_USER);
        navigate("/login");
    };

    const handleAutoAudio = (checked: boolean) => {
        setAutoAudio(checked);
        localStorage.setItem("autoTurnOnNearbyShopAudio", String(checked));
    };

    const handleLanguageChange = (value: string) => {
        const normalized = normalizeLocale(value);
        setLang(normalized);

        try {
            const rawUser = localStorage.getItem(LS_USER);
            if (!rawUser) return;
            const currentUser = JSON.parse(rawUser) as Record<string, unknown>;
            localStorage.setItem(
                LS_USER,
                JSON.stringify({
                    ...currentUser,
                    language: normalized,
                })
            );
            notifyLanguageChanged();
        } catch {
            // ignore invalid local user payload
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
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-slate-700">Ngôn ngữ mặc định</span>
                        <select
                            value={lang}
                            onChange={(e) => handleLanguageChange(e.target.value)}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        >
                            <option value="en-US">English</option>
                            <option value="vi-VN">Tiếng Việt</option>
                            <option value="ko-KR">한국어</option>
                            <option value="ja-JP">日本語</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-slate-700">Tốc độ đọc</span>
                        <select
                            value={speed}
                            onChange={(e) => setSpeed(e.target.value)}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        >
                            <option value="0.9">0.9x</option>
                            <option value="1.0">1.0x</option>
                            <option value="1.1">1.1x</option>
                        </select>
                    </div>

                    <label className="flex items-center justify-between gap-3">
                        <span className="text-sm text-slate-700">Tự phát audio khi tới gần quán</span>
                        <input
                            type="checkbox"
                            checked={autoAudio}
                            onChange={(e) => handleAutoAudio(e.target.checked)}
                            className="h-4 w-4 rounded"
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
