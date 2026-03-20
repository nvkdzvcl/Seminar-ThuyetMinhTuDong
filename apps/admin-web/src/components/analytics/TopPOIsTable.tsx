import type { TopPOI } from '../../types';

const catColors: Record<string, string> = {
  food: 'bg-orange-100 text-orange-700',
  drink: 'bg-blue-100 text-blue-700',
  snack: 'bg-pink-100 text-pink-700',
};

export function TopPOIsTable({ data }: { data: TopPOI[] }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-gray-400">Không có dữ liệu</p>;
  }
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">Top POI được nghe nhiều nhất</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="pb-2 font-medium">#</th>
            <th className="pb-2 font-medium">Tên POI</th>
            <th className="pb-2 font-medium">Nhóm</th>
            <th className="pb-2 font-medium text-right">Lượt nghe</th>
            <th className="pb-2 font-medium text-right">TB (giây)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p, i) => (
            <tr key={p.poiId} className="border-b last:border-0">
              <td className="py-2 font-bold text-gray-400">{i + 1}</td>
              <td className="py-2 font-medium text-gray-800">{p.poiName}</td>
              <td className="py-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${catColors[p.category] || 'bg-gray-100 text-gray-600'}`}>
                  {p.category}
                </span>
              </td>
              <td className="py-2 text-right font-semibold">{p.totalListens}</td>
              <td className="py-2 text-right text-gray-600">{Math.round(p.avgDurationMs / 1000)}s</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}