import type { AdminUser } from '../types';

const MOCK_ADMIN = { id: 'admin-1', username: 'admin', lastLoginAt: new Date().toISOString() };
const MOCK_PASSWORD = 'admin123';
const FAKE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-token';

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function loginApi(username: string, password: string): Promise<{ token: string; user: AdminUser }> {
  await delay(600);
  if (username === MOCK_ADMIN.username && password === MOCK_PASSWORD) {
    return { token: FAKE_TOKEN, user: { ...MOCK_ADMIN, lastLoginAt: new Date().toISOString() } };
  }
  throw new Error('Sai tên đăng nhập hoặc mật khẩu');
}

export async function logoutApi(): Promise<void> {
  await delay(300);
}