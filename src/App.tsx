import { AppProvider } from "context/AppContext";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

const Landing = lazy(() => import("pages/landing"));
const Dashboard = lazy(() => import("pages/dashboard"));
const Login = lazy(() => import("pages/login"));
const Register = lazy(() => import("pages/register"));

function isLoggedIn() {
  try {
    const v = localStorage.getItem("skazka_user");
    if (v && JSON.parse(v)) return true;
    // Supabase stores its session before AppContext runs; check it as fallback
    const sbKey = Object.keys(localStorage).find(
      (k) => k.startsWith("sb-") && k.endsWith("-auth-token"),
    );
    if (sbKey) {
      const session = JSON.parse(localStorage.getItem(sbKey) ?? "null");
      return !!(session?.access_token && session.expires_at * 1000 > Date.now());
    }
    return false;
  } catch {
    return false;
  }
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  return isLoggedIn() ? <Navigate to="/app" replace /> : <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return isLoggedIn() ? <>{children}</> : <Navigate to="/app/login" replace />;
}

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppProvider>
                <Dashboard />
              </AppProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/app/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />
        <Route path="/" element={<Landing />} />
      </Routes>
    </Suspense>
  );
}
