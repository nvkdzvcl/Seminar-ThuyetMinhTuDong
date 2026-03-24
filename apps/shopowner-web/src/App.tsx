import { useEffect, useState } from "react";
import { LoginScreen } from "@/components/screens/login-screen";
import { AppShell } from "@/components/app-shell";
import { clearOwnerSession, isOwnerAuthenticated, setOwnerSession } from "@/lib/auth";
import { getCurrentUser, login, logout } from "@/services/auth-service";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(isOwnerAuthenticated());
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const restoreSession = async () => {
      if (!isOwnerAuthenticated()) {
        setIsLoggedIn(false);
        setIsCheckingSession(false);
        return;
      }

      try {
        await getCurrentUser();
        setIsLoggedIn(true);
      } catch {
        clearOwnerSession();
        setIsLoggedIn(false);
      } finally {
        setIsCheckingSession(false);
      }
    };

    void restoreSession();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const result = await login({ email, password });
      if (!result.authenticated || !result.accessToken) {
        throw new Error("Đăng nhập thất bại");
      }
      setOwnerSession(result.accessToken, result.refreshToken);
      setIsLoggedIn(true);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Đăng nhập thất bại");
      setIsLoggedIn(false);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Always clear local session even if API logout fails.
    }
    clearOwnerSession();
    setIsLoggedIn(false);
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        isLoading={isLoggingIn}
        errorMessage={loginError}
      />
    );
  }

  return <AppShell onLogout={() => { void handleLogout(); }} />;
}

export default App;
