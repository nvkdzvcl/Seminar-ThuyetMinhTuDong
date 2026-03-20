import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DailyListenData } from '../../types';

export function ListenChart({ data }: { data: DailyListenData[] }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-gray-400">Không có dữ liệu</p>;
  }
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">Lượt nghe theo ngày</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Area type="monotone" dataKey="listens" stroke="#6366f1" fill="#eef2ff" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}