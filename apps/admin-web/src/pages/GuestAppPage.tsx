import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { POI, Tour } from '../types';
import { validateGuestToken } from '../services/guestService';
import { useGeolocation } from '../hooks/useGeolocation';
import { useGeofence } from '../hooks/useGeofence';
import { GuestMap } from '../components/map/GuestMap';
import { AudioPlayer } from '../components/audio/AudioPlayer';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

type AppState = 'loading' | 'error' | 'request-gps' | 'gps-denied' | 'tracking';

export function GuestAppPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [appState, setAppState] = useState<AppState>('loading');
  const [tour, setTour] = useState<Tour | null>(null);
  const [pois, setPois] = useState<POI[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const prevActivePOIRef = useRef<string | null>(null);

  const geo = useGeolocation(2000);
  const { activePOI } = useGeofence(pois, geo.latitude, geo.longitude);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setErrorMsg('Không tìm thấy token. Vui lòng quét lại QR code.');
      setAppState('error');
      return;
    }
    validateGuestToken(token)
      .then(({ tour, pois }) => {
        setTour(tour);
        setPois(pois);
        setAppState('request-gps');
      })
      .catch((err) => {
        setErrorMsg(err instanceof Error ? err.message : 'Token không hợp lệ');
        setAppState('error');
      });
  }, [token]);

  const handleRequestGPS = async () => {
    const granted = await geo.requestPermission();
    if (granted) {
      geo.setTracking(true);
      setAppState('tracking');
    } else {
      setAppState('gps-denied');
    }
  };

  // Track when user enters/exits geofence
  useEffect(() => {
    if (activePOI) {
      prevActivePOIRef.current = activePOI.id;
    } else {
      prevActivePOIRef.current = null;
    }
  }, [activePOI]);

  if (appState === 'loading') return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <LoadingSpinner text="Đang xác thực tour..." />
    </div>
  );

  if (appState === 'error') return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="rounded-2xl bg-white p-8 shadow-lg text-center max-w-sm">
        <span className="text-5xl">❌</span>
        <h2 className="mt-4 text-lg font-bold text-gray-800">Lỗi</h2>
        <p className="mt-2 text-sm text-gray-500">{errorMsg}</p>
      </div>
    </div>
  );

  if (appState === 'request-gps') return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
      <div className="rounded-2xl bg-white p-8 shadow-lg text-center max-w-sm">
        <span className="text-5xl">📍</span>
        <h2 className="mt-4 text-lg font-bold text-gray-800">Chào mừng đến {tour?.name}!</h2>
        <p className="mt-2 text-sm text-gray-500">
          Để tự động phát thuyết minh, vui lòng cho phép truy cập vị trí GPS của bạn.
        </p>
        <button onClick={handleRequestGPS}
          className="mt-6 w-full rounded-lg bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 transition-colors">
          Cho phép truy cập GPS
        </button>
      </div>
    </div>
  );

  if (appState === 'gps-denied') return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="rounded-2xl bg-white p-8 shadow-lg text-center max-w-sm">
        <span className="text-5xl">🚫</span>
        <h2 className="mt-4 text-lg font-bold text-gray-800">GPS bị từ chối</h2>
        <p className="mt-2 text-sm text-gray-500">
          Hệ thống cần quyền truy cập GPS để tự động phát thuyết minh. Vui lòng cấp quyền trong cài đặt trình duyệt.
        </p>
        <button onClick={handleRequestGPS}
          className="mt-4 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          Thử lại
        </button>
      </div>
    </div>
  );

  // Tracking state
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">{tour?.name}</h1>
            <p className="text-xs text-gray-400">
              {geo.accuracy ? `GPS: +-${Math.round(geo.accuracy)}m` : 'Đang định vị...'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {geo.accuracy && geo.accuracy > 20 && (
              <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
                Độ chính xác thấp
              </span>
            )}
            <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Map */}
      <div className="flex-1">
        <GuestMap pois={pois} userLat={geo.latitude} userLng={geo.longitude} activePOI={activePOI} />
      </div>

      {/* Audio Player (fixed bottom) */}
      <div className="p-3">
        {activePOI ? (
          <AudioPlayer poi={activePOI} tourId={tour?.id || ''} />
        ) : (
          <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-500">Đi đến gần một điểm tham quan để nghe thuyết minh tự động</p>
            <p className="mt-1 text-xs text-gray-400">{pois.length} điểm tham quan trong tour này</p>
          </div>
        )}
      </div>

      {/* Dev Tools - simulate location */}
      <div className="border-t bg-gray-100 px-4 py-3">
        <p className="text-xs font-semibold text-gray-500 mb-2">🛠️ POC: Giả lập vị trí (click để di chuyển đến POI)</p>
        <div className="flex flex-wrap gap-2">
          {pois.filter(p => ['food','drink','snack'].includes(p.category)).map((p) => (
            <button key={p.id} onClick={() => {
              // Override geolocation for testing
              (geo as any).latitude = p.lat;
              (geo as any).longitude = p.lng;
              // Force re-render by updating tracking
              geo.setTracking(false);
              setTimeout(() => geo.setTracking(true), 100);
            }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activePOI?.id === p.id ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-200'
              }`}>
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}