import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const links = [
  { to: '/admin', label: 'Dashboard', icon: '📊' },
  { to: '/admin/pois', label: 'Quản lý POI', icon: '📍' },
  { to: '/admin/analytics', label: 'Thống kê', icon: '📈' },
  { to: '/admin/tours', label: 'Tours', icon: '🗺️' },
];

export function Sidebar() {
  const { logout, user } = useAuth();
  return (
    <aside className="flex h-screen w-64 flex-col bg-indigo-900 text-white">
      <div className="px-6 py-5">
        <h1 className="text-xl font-bold">AudioTour</h1>
        <p className="text-xs text-indigo-300">Admin Panel</p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-indigo-700 text-white' : 'text-indigo-200 hover:bg-indigo-800'
              }`
            }
          >
            <span>{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-indigo-700 px-4 py-4">
        <p className="text-xs text-indigo-300 mb-2">Xin chào, {user?.username}</p>
        <button
          onClick={logout}
          className="w-full rounded-lg bg-indigo-700 px-3 py-2 text-sm hover:bg-indigo-600 transition-colors"
        >
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}