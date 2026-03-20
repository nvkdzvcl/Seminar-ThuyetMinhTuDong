import { useAnalytics } from '../hooks/useAnalytics';
import { StatCard } from '../components/analytics/StatCard';
import { ListenChart } from '../components/analytics/ListenChart';
import { TopPOIsTable } from '../components/analytics/TopPOIsTable';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { TimeRange } from '../types';

const ranges: { value: TimeRange; label: string }[] = [
  { value: 'day', label: 'Hôm nay' },
  { value: 'week', label: 'Tuần này' },
  { value: 'month', label: 'Tháng này' },
  { value: 'all', label: 'Tất cả' },
];

export function AnalyticsPage() {
  const { range, setRange, summary, dailyData, topPois, loading } = useAnalytics();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Thống kê</h2>
          <p className="text-sm text-gray-500">Dữ liệu lượt nghe thuyết minh</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {ranges.map((r) => (
            <button key={r.value} onClick={() => setRange(r.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                range === r.value ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Tổng lượt nghe" value={summary.totalListens} icon="🎧" />
          <StatCard title="TB thời gian" value={`${Math.round(summary.avgDurationMs / 1000)}s`} icon="⏱️" />
          <StatCard title="Phiên duy nhất" value={summary.uniqueSessions} icon="👤" />
          <StatCard title="Tỷ lệ hoàn thành" value={`${summary.completionRate}%`} icon="✅" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ListenChart data={dailyData} />
        <TopPOIsTable data={topPois} />
      </div>
    </div>
  );
}