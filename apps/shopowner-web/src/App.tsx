import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { LoginScreen, type OwnerRegisterFormInput } from "@/components/screens/login-screen";
import { AppShell } from "@/components/app-shell";
import { clearOwnerSession, isOwnerAuthenticated, setOwnerSession } from "@/lib/auth";
import { getCurrentUser, login, logout, registerOwner } from "@/services/auth-service";

const OWNER_DRAFT_SHOP_NAME_KEY = "owner_draft_shop_name";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

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
    setRegisterError(null);
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

  const handleRegister = async (payload: OwnerRegisterFormInput) => {
    setIsRegistering(true);
    setRegisterError(null);
    setLoginError(null);
    try {
      await registerOwner({
        fullName: payload.ownerName,
        phoneNumber: payload.phoneNumber,
        email: payload.email,
        password: payload.password,
        language: "vi",
      });

      const loginResult = await login({ email: payload.email, password: payload.password });
      if (!loginResult.authenticated || !loginResult.accessToken) {
        throw new Error("Đăng ký thành công nhưng đăng nhập tự động thất bại");
      }

      if (payload.shopName?.trim() && typeof window !== "undefined") {
        window.localStorage.setItem(OWNER_DRAFT_SHOP_NAME_KEY, payload.shopName.trim());
      }

      setOwnerSession(loginResult.accessToken, loginResult.refreshToken);
      setIsLoggedIn(true);
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : "Đăng ký tài khoản chủ quán thất bại");
      setIsLoggedIn(false);
    } finally {
      setIsRegistering(false);
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

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={isLoggedIn ? "/app" : "/login"} replace />}
      />
      <Route
        path="/login"
        element={
          isLoggedIn ? (
            <Navigate to="/app" replace />
          ) : (
            <LoginScreen
              onLogin={handleLogin}
              onRegister={handleRegister}
              isLoading={isLoggingIn}
              isRegistering={isRegistering}
              errorMessage={loginError}
              registerErrorMessage={registerError}
            />
          )
        }
      />
      <Route
        path="/app/*"
        element={
          isLoggedIn ? (
            <AppShell
              onLogout={() => {
                void handleLogout();
              }}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="*"
        element={<Navigate to={isLoggedIn ? "/app" : "/login"} replace />}
      />
    </Routes>
  );
}

export default App;
