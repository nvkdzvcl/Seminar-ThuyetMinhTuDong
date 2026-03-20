import { useState, useEffect } from 'react';
import type { POI } from '../../types';
import { isMainCategory } from '../../types';

interface POIFormProps {
  initialData?: POI | null;
  clickedLatLng?: { lat: number; lng: number } | null;
  onSave: (data: Omit<POI, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

const categories = [
  { value: 'food', label: 'Món ăn' },
  { value: 'drink', label: 'Đồ uống' },
  { value: 'snack', label: 'Ăn vặt' },
  { value: 'wc', label: 'WC' },
  { value: 'parking', label: 'Bãi đỗ xe' },
] as const;

export function POIForm({ initialData, clickedLatLng, onSave, onCancel }: POIFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState<POI['category']>(initialData?.category || 'food');
  const [lat, setLat] = useState(initialData?.lat ?? clickedLatLng?.lat ?? 0);
  const [lng, setLng] = useState(initialData?.lng ?? clickedLatLng?.lng ?? 0);
  const [radius, setRadius] = useState(initialData?.radius ?? 30);
  const [audioTab, setAudioTab] = useState<'upload' | 'tts'>(initialData?.textToSpeech ? 'tts' : 'upload');
  const [audioUrl, setAudioUrl] = useState(initialData?.audioUrl || '');
  const [ttsText, setTtsText] = useState(initialData?.textToSpeech || '');
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (clickedLatLng) {
      setLat(clickedLatLng.lat);
      setLng(clickedLatLng.lng);
    }
  }, [clickedLatLng]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!name.trim()) { setValidationError('Vui lòng nhập tên POI'); return; }
    if (isMainCategory(category) && !audioUrl && !ttsText.trim()) {
      setValidationError('Nhóm chính bắt buộc có Audio hoặc TTS');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        category,
        lat,
        lng,
        radius,
        audioUrl: audioTab === 'upload' ? audioUrl : undefined,
        textToSpeech: audioTab === 'tts' ? ttsText.trim() : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!initialData;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-5 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800">{isEdit ? 'Sửa POI' : 'Thêm POI mới'}</h3>

      {validationError && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{validationError}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Tên POI</label>
        <input value={name} onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Nhóm</label>
        <select value={category} onChange={(e) => setCategory(e.target.value as POI['category'])}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 outline-none">
          {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Latitude</label>
          <input type="number" step="any" value={lat} onChange={(e) => setLat(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Longitude</label>
          <input type="number" step="any" value={lng} onChange={(e) => setLng(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Bán kính (m): {radius}m</label>
        <input type="range" min={5} max={500} value={radius} onChange={(e) => setRadius(Number(e.target.value))}
          className="w-full accent-indigo-600" />
      </div>

      {isMainCategory(category) && (
        <div>
          <div className="flex gap-2 mb-2">
            <button type="button" onClick={() => setAudioTab('upload')}
              className={`rounded-lg px-3 py-1 text-sm ${audioTab === 'upload' ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-gray-500'}`}>
              Upload Audio
            </button>
            <button type="button" onClick={() => setAudioTab('tts')}
              className={`rounded-lg px-3 py-1 text-sm ${audioTab === 'tts' ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-gray-500'}`}>
              Text-to-Speech
            </button>
          </div>
          {audioTab === 'upload' ? (
            <div>
              <input type="text" placeholder="URL file audio (.mp3, .wav)" value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
              <p className="mt-1 text-xs text-gray-400">POC: Nhập URL. Production sẽ có upload file.</p>
            </div>
          ) : (
            <textarea value={ttsText} onChange={(e) => setTtsText(e.target.value)} rows={3}
              placeholder="Nhập nội dung thuyết minh..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none resize-none" />
          )}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={saving}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm POI'}
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          Hủy
        </button>
      </div>
    </form>
  );
}