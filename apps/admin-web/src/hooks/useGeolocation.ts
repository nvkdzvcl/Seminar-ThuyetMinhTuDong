import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  permissionGranted: boolean | null;
}

export function useGeolocation(pollIntervalMs = 2000) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    permissionGranted: null,
  });
  const [tracking, setTracking] = useState(false);

  const requestPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation is not supported', permissionGranted: false }));
      return false;
    }
    return new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setState({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            error: null,
            permissionGranted: true,
          });
          resolve(true);
        },
        (err) => {
          setState((s) => ({ ...s, error: err.message, permissionGranted: false }));
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  useEffect(() => {
    if (!tracking || !state.permissionGranted) return;
    const id = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setState((s) => ({
            ...s,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            error: null,
          }));
        },
        (err) => {
          setState((s) => ({ ...s, error: err.message }));
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }, pollIntervalMs);
    return () => clearInterval(id);
  }, [tracking, state.permissionGranted, pollIntervalMs]);

  return { ...state, tracking, setTracking, requestPermission };
}
