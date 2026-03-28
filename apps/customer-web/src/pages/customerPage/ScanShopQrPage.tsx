import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { routePath } from "../../routes/route";
import { resolvePreferredLanguage } from "../../utils/language";

const SHOP_ID_PATTERNS = [
    /(?:^|[/?#=&])shopId(?:=|\/)(\d+)(?:$|[/?#&])/i,
    /\/shop\/(\d+)(?:$|[/?#])/i,
    /(?:^|[^\d])(\d+)(?:[^\d]|$)/,
];

const SCAN_INTERVAL_MS = 3000;
const READER_ELEMENT_ID = "shop-qr-reader";

function extractShopId(rawValue: string): number | null {
    const trimmed = rawValue.trim();
    if (!trimmed) return null;

    try {
        const parsedJson = JSON.parse(trimmed) as { shopId?: number | string };
        if (parsedJson?.shopId !== undefined) {
            const value = Number(parsedJson.shopId);
            return Number.isInteger(value) && value > 0 ? value : null;
        }
    } catch {
        // ignore invalid JSON
    }

    for (const pattern of SHOP_ID_PATTERNS) {
        const match = trimmed.match(pattern);
        if (!match) continue;

        const value = Number(match[1]);
        if (Number.isInteger(value) && value > 0) {
            return value;
        }
    }

    return null;
}

function ScanShopQrPage() {
    const navigate = useNavigate();

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isMountedRef = useRef(true);
    const hasResolvedQrRef = useRef(false);
    const lastAcceptedRawValueRef = useRef("");
    const lastScanAtRef = useRef(0);
    const isHandlingSuccessRef = useRef(false);
    const isStartingCameraRef = useRef(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [cameraReady, setCameraReady] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [status, setStatus] = useState("Đưa QR của quán vào giữa khung để quét hoặc chọn ảnh từ thư viện.");
    const [manualValue, setManualValue] = useState("");
    const [scanResult, setScanResult] = useState("");
    const [isImportingImage, setIsImportingImage] = useState(false);

    const updateStatus = (value: string) => {
        if (isMountedRef.current) {
            setStatus(value);
        }
    };

    const ensureScanner = () => {
        if (!scannerRef.current) {
            scannerRef.current = new Html5Qrcode(READER_ELEMENT_ID, {
                formatsToSupport: [0],
                verbose: false,
            });
        }

        return scannerRef.current;
    };

    const stopScanner = async () => {
        const scanner = scannerRef.current;
        if (!scanner) {
            if (isMountedRef.current) {
                setIsScanning(false);
                setCameraReady(false);
            }
            return;
        }

        try {
            if (scanner.isScanning) {
                await scanner.stop();
            }
        } catch (error) {
            console.error("Không dừng được camera:", error);
        }

        try {
            await scanner.clear();
        } catch (error) {
            console.error("Không clear được scanner:", error);
        }

        if (isMountedRef.current) {
            setIsScanning(false);
            setCameraReady(false);
        }

        await new Promise((resolve) => window.setTimeout(resolve, 180));
    };

    const lockSuccessfulScan = (rawValue: string) => {
        hasResolvedQrRef.current = true;
        lastAcceptedRawValueRef.current = rawValue;
        isHandlingSuccessRef.current = true;

        if (isMountedRef.current) {
            setIsScanning(false);
        }
    };

    const navigateToShop = async (rawValue: string) => {
        if (hasResolvedQrRef.current) return;

        const normalizedRawValue = rawValue.trim();
        const shopId = extractShopId(normalizedRawValue);

        if (!shopId) {
            updateStatus("QR chưa đúng định dạng. Hãy dùng QR có shopId, link /shop/:id hoặc chỉ chứa mã số quán.");
            return;
        }

        lockSuccessfulScan(normalizedRawValue);
        setScanResult(normalizedRawValue);
        updateStatus(`Đã đọc QR quán #${shopId}. Đang tắt camera và chuyển trang...`);

        await stopScanner();

        if (!isMountedRef.current) return;

        alert(`Đã nhận QR quán #${shopId}. Đang chuyển tới trang quán.`);
        const preferredLanguage = resolvePreferredLanguage();
        const shopPath = routePath.ShopDetailPage.replace(":shopId", String(shopId));
        navigate(`${shopPath}?autoplay=1&lang=${encodeURIComponent(preferredLanguage)}`, { replace: true });
    };

    const handleDetectedValue = async (decodedText: string) => {
        const normalizedRawValue = decodedText.trim();
        if (!normalizedRawValue) return;
        if (hasResolvedQrRef.current || isHandlingSuccessRef.current) return;
        if (normalizedRawValue === lastAcceptedRawValueRef.current) return;

        const now = Date.now();
        if (now - lastScanAtRef.current < SCAN_INTERVAL_MS) {
            return;
        }
        lastScanAtRef.current = now;

        const shopId = extractShopId(normalizedRawValue);
        if (!shopId) {
            updateStatus("Đã đọc được mã nhưng chưa đúng QR của quán. Hãy thử lại hoặc chọn ảnh khác.");
            return;
        }

        await navigateToShop(normalizedRawValue);
    };

    const startScanner = async () => {
        if (isStartingCameraRef.current || hasResolvedQrRef.current) return;

        isStartingCameraRef.current = true;
        lastScanAtRef.current = 0;
        lastAcceptedRawValueRef.current = "";
        isHandlingSuccessRef.current = false;

        try {
            await stopScanner();
            const scanner = ensureScanner();

            updateStatus("Đang mở camera...");

            await scanner.start(
                { facingMode: { exact: "environment" } },
                {
                    fps: 2,
                    qrbox: { width: 240, height: 240 },
                    aspectRatio: 1,
                    disableFlip: false,
                    videoConstraints: {
                        facingMode: "environment",
                    },
                },
                (decodedText) => {
                    void handleDetectedValue(decodedText);
                },
                () => {
                    // ignore per-frame errors
                }
            );

            if (!isMountedRef.current) return;

            setCameraReady(true);
            setIsScanning(true);
            updateStatus("Camera đã sẵn sàng. Hệ thống chỉ nhận 1 QR hợp lệ và giới hạn quét 3 giây/lần.");
        } catch (primaryError) {
            console.error("Không mở được camera sau:", primaryError);

            try {
                const scanner = ensureScanner();
                await scanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 2,
                        qrbox: { width: 240, height: 240 },
                        aspectRatio: 1,
                        disableFlip: false,
                    },
                    (decodedText) => {
                        void handleDetectedValue(decodedText);
                    },
                    () => {
                        // ignore per-frame errors
                    }
                );

                if (!isMountedRef.current) return;

                setCameraReady(true);
                setIsScanning(true);
                updateStatus("Camera đã sẵn sàng. Hệ thống chỉ nhận 1 QR hợp lệ và giới hạn quét 3 giây/lần.");
            } catch (fallbackError) {
                console.error("Không mở được camera:", fallbackError);
                updateStatus("Không mở được camera trên thiết bị này. Bạn hãy chọn ảnh QR từ thư viện hoặc nhập tay ở bên dưới.");
                await stopScanner();
            }
        } finally {
            isStartingCameraRef.current = false;
        }
    };

    const handleImportImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file) return;
        if (hasResolvedQrRef.current) return;

        setIsImportingImage(true);
        updateStatus("Đang quét QR từ ảnh đã chọn...");

        try {
            await stopScanner();
            const scanner = ensureScanner();
            const decodedText = await scanner.scanFile(file, true);
            await handleDetectedValue(decodedText);
        } catch (error) {
            console.error("Không quét được QR từ ảnh:", error);
            updateStatus("Không đọc được QR từ ảnh này. Hãy chọn ảnh rõ hơn hoặc nhập tay.");
        } finally {
            if (isMountedRef.current) {
                setIsImportingImage(false);
            }
        }
    };

    useEffect(() => {
        isMountedRef.current = true;
        void startScanner();

        return () => {
            isMountedRef.current = false;
            void stopScanner();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 lg:px-8">
                <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                Quét QR quán ăn
                            </h1>
                            <p className="mt-2 text-sm text-slate-600 sm:text-base">
                                Quét QR bằng camera hoặc chọn ảnh QR từ thư viện để mở đúng trang quán.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate(routePath.shopSearchPage)}
                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            Về danh sách quán
                        </button>
                    </div>

                    <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950">
                        <div id={READER_ELEMENT_ID} className="min-h-[420px] w-full overflow-hidden bg-black" />

                        {!cameraReady && (
                            <div className="border-t border-slate-800 bg-slate-950 px-5 py-4 text-center text-sm text-white/80">
                                Camera chưa sẵn sàng hoặc thiết bị không hỗ trợ mở camera. Bạn vẫn có thể chọn ảnh từ thư viện bên dưới.
                            </div>
                        )}
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        {status}
                    </div>

                    {scanResult && (
                        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            QR vừa đọc được: <span className="font-semibold">{scanResult}</span>
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImportImage}
                        className="hidden"
                    />

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <button
                            type="button"
                            onClick={() => {
                                fileInputRef.current?.click();
                            }}
                            disabled={isImportingImage || hasResolvedQrRef.current}
                            className="h-12 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isImportingImage ? "Đang quét ảnh..." : "Chọn ảnh từ thư viện"}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                void stopScanner().then(() => {
                                    void startScanner();
                                });
                            }}
                            disabled={isImportingImage || hasResolvedQrRef.current}
                            className="h-12 rounded-2xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isScanning ? "Quét lại camera" : "Mở camera"}
                        </button>

                        <input
                            type="text"
                            value={manualValue}
                            onChange={(event) => setManualValue(event.target.value)}
                            placeholder="Nhập shopId hoặc dán nội dung QR"
                            className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-green-500 sm:col-span-2 lg:col-span-1"
                        />

                        <button
                            type="button"
                            onClick={() => void navigateToShop(manualValue)}
                            disabled={hasResolvedQrRef.current}
                            className="h-12 rounded-2xl bg-green-600 px-5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Mở quán
                        </button>
                    </div>

                    <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                        Gợi ý nội dung QR hợp lệ: <span className="font-medium text-slate-700">12</span>,
                        <span className="font-medium text-slate-700"> /shop/12</span>,
                        <span className="font-medium text-slate-700"> https://domain/shop/12</span>,
                        <span className="font-medium text-slate-700"> {`{"shopId":12}`}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ScanShopQrPage;
