import { AppProvider } from "context/AppContext";
import Dashboard from "pages/dashboard";
import Landing from "pages/landing";
import Login from "pages/login";
import Register from "pages/register";

export default function App() {
  const path = window.location.pathname.toLowerCase();

  if (path === "/app" || path === "/app/") {
    return (
      <AppProvider>
        <Dashboard />
      </AppProvider>
    );
  }

  if (path === "/app/login") {
    try {
      const v = localStorage.getItem("skazka_user");
      if (v && JSON.parse(v)) { window.location.replace("/app"); return null; }
    } catch {}
    return <Login />;
  }

  if (path === "/app/register") {
    try {
      const v = localStorage.getItem("skazka_user");
      if (v && JSON.parse(v)) { window.location.replace("/app"); return null; }
    } catch {}
    return <Register />;
  }

  return <Landing />;
}
