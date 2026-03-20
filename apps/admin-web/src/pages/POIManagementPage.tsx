import { useState } from 'react';
import { usePOIs } from '../hooks/usePOIs';
import { AdminMap } from '../components/map/AdminMap';
import { POIForm } from '../components/poi/POIForm';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { POI } from '../types';
import { isMainCategory } from '../types';

export function POIManagementPage() {
  const { pois, loading, addPOI, editPOI, removePOI } = usePOIs();
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [clickedLatLng, setClickedLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<'add' | 'edit'>('add');

  const handleMapClick = (lat: number, lng: number) => {
    setClickedLatLng({ lat, lng });
    setSelectedPOI(null);
    setMode('add');
    setShowForm(true);
  };

  const handlePOIClick = (poi: POI) => {
    setSelectedPOI(poi);
    setMode('edit');
    setShowForm(true);
  };

  const handleSave = async (data: Omit<POI, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (mode === 'edit' && selectedPOI) {
      await editPOI(selectedPOI.id, data);
    } else {
      await addPOI(data);
    }
    setShowForm(false);
    setSelectedPOI(null);
    setClickedLatLng(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa POI này?')) {
      await removePOI(id);
      setShowForm(false);
      setSelectedPOI(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Quản lý POI</h2>
          <p className="text-sm text-gray-500">Click trên bản đồ để thêm POI mới. Click marker để sửa.</p>
        </div>
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
          {pois.length} POI
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AdminMap pois={pois} selectedPOI={selectedPOI} onMapClick={handleMapClick} onPOIClick={handlePOIClick} />
        </div>
        <div className="space-y-3">
          {showForm && (
            <POIForm
              initialData={mode === 'edit' ? selectedPOI : null}
              clickedLatLng={mode === 'add' ? clickedLatLng : null}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setSelectedPOI(null); }}
            />
          )}
          {mode === 'edit' && selectedPOI && showForm && (
            <button onClick={() => handleDelete(selectedPOI.id)}
              className="w-full rounded-lg border border-red-300 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
              Xóa POI này
            </button>
          )}

          <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
            <h4 className="mb-2 text-sm font-semibold text-gray-700">Danh sách POI</h4>
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {pois.map((p) => (
                <button key={p.id} onClick={() => handlePOIClick(p)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    selectedPOI?.id === p.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'
                  }`}>
                  <span className="font-medium">{p.name}</span>
                  <span className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${
                    isMainCategory(p.category) ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {p.category}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}