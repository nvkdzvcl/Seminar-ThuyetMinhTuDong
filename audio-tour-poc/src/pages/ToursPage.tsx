import { useState, useEffect } from 'react';
import type { Tour } from '../types';
import { fetchTours, createTour, deleteTour } from '../services/tourService';
import { usePOIs } from '../hooks/usePOIs';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function ToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [tourName, setTourName] = useState('');
  const [selectedPOIIds, setSelectedPOIIds] = useState<string[]>([]);
  const { pois } = usePOIs();

  useEffect(() => {
    fetchTours().then((t) => { setTours(t); setLoading(false); });
  }, []);

  const handleCreate = async () => {
    if (!tourName.trim() || selectedPOIIds.length === 0) return;
    const tour = await createTour(tourName.trim(), selectedPOIIds);
    setTours((prev) => [...prev, tour]);
    setShowCreate(false);
    setTourName('');
    setSelectedPOIIds([]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa tour này?')) return;
    await deleteTour(id);
    setTours((prev) => prev.filter((t) => t.id !== id));
  };

  const togglePOI = (id: string) => {
    setSelectedPOIIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Tours & QR</h2>
          <p className="text-sm text-gray-500">Quản lý tour và tạo QR cho khách</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
          + Tạo Tour
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-semibold text-gray-800">Tour mới</h3>
          <input value={tourName} onChange={(e) => setTourName(e.target.value)} placeholder="Tên tour"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Chọn POI:</p>
            <div className="flex flex-wrap gap-2">
              {pois.map((p) => (
                <button key={p.id} type="button" onClick={() => togglePOI(p.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    selectedPOIIds.includes(p.id) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Tạo
            </button>
            <button onClick={() => setShowCreate(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              Hủy
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {tours.map((tour) => (
          <div key={tour.id} className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">{tour.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{tour.poiIds.length} POI | Token: {tour.qrToken}</p>
                <p className="text-xs text-gray-400">Tạo: {new Date(tour.createdAt).toLocaleDateString('vi-VN')}</p>
                <p className="mt-2 text-xs font-mono text-indigo-600 bg-indigo-50 rounded px-2 py-1 inline-block">
                  {window.location.origin}/guest?token={tour.qrToken}
                </p>
              </div>
              <div className="flex gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tour.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {tour.isActive ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => handleDelete(tour.id)}
                  className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50">
                  Xóa
                </button>
              </div>
            </div>
          </div>
        ))}
        {tours.length === 0 && (
          <p className="py-8 text-center text-gray-400">Chưa có tour nào. Tạo tour mới để bắt đầu.</p>
        )}
      </div>
    </div>
  );
}