import { Link } from 'react-router-dom';
import { usePOIs } from '../hooks/usePOIs';
import { StatCard } from '../components/analytics/StatCard';
import { MOCK_TOURS } from '../data/mockData';

export function DashboardPage() {
  const { pois } = usePOIs();
  const mainPois = pois.filter((p) => ['food', 'drink', 'snack'].includes(p.category));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-sm text-gray-500">Tổng quan hệ thống AudioTour</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Tổng POI" value={pois.length} icon="📍" />
        <StatCard title="POI chính" value={mainPois.length} sub="food, drink, snack" icon="🍜" />
        <StatCard title="Tours" value={MOCK_TOURS.length} icon="🗺️" />
        <StatCard title="Lượt nghe (mock)" value={8} sub="Tổng cộng" icon="🎧" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/admin/pois"
          className="flex items-center gap-3 rounded-xl bg-white p-5 shadow-sm border border-gray-100 hover:border-indigo-300 transition-colors">
          <span className="text-3xl">📍</span>
          <div>
            <p className="font-semibold text-gray-800">Quản lý POI</p>
            <p className="text-sm text-gray-500">Thêm, sửa, xóa điểm tham quan trên bản đồ</p>
          </div>
        </Link>
        <Link to="/admin/analytics"
          className="flex items-center gap-3 rounded-xl bg-white p-5 shadow-sm border border-gray-100 hover:border-indigo-300 transition-colors">
          <span className="text-3xl">📈</span>
          <div>
            <p className="font-semibold text-gray-800">Thống kê</p>
            <p className="text-sm text-gray-500">Xem biểu đồ lượt nghe và top POI</p>
          </div>
        </Link>
        <Link to="/admin/tours"
          className="flex items-center gap-3 rounded-xl bg-white p-5 shadow-sm border border-gray-100 hover:border-indigo-300 transition-colors">
          <span className="text-3xl">🗺️</span>
          <div>
            <p className="font-semibold text-gray-800">Tours & QR</p>
            <p className="text-sm text-gray-500">Quản lý tour và tạo QR cho khách</p>
          </div>
        </Link>
      </div>

      <div className="rounded-xl bg-indigo-50 p-4 border border-indigo-100">
        <p className="text-sm text-indigo-700">
          <strong>Guest App URL:</strong>{' '}
          <span className="font-mono text-xs">
            {window.location.origin}/guest?token=abc123-token-xyz
          </span>
        </p>
      </div>
    </div>
  );
}