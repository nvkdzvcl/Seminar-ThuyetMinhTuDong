import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/admin');
    } catch {}
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-indigo-100">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-800">AudioTour</h1>
            <p className="text-sm text-gray-500">Hệ thống Thuyết minh Tự động</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Tên đăng nhập</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                placeholder="admin" autoComplete="username" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Mật khẩu</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                placeholder="admin123" autoComplete="current-password" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-400">POC: admin / admin123</p>
        </div>
      </div>
    </div>
  );
}