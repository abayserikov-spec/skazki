import { Loader2 } from "lucide-react";
import { T, CSS } from "./components/UI.jsx";
import { AppProvider, useApp } from "./context/AppContext.jsx";
import { StoryProvider } from "./context/StoryContext.jsx";
import AuthView from "./views/AuthView.jsx";
import DashboardView from "./views/DashboardView.jsx";
import SetupView from "./views/SetupView.jsx";
import SessionView from "./views/SessionView.jsx";
import ReportView from "./views/ReportView.jsx";
import LibraryView from "./views/LibraryView.jsx";
import CharactersView from "./views/CharactersView.jsx";

function ViewRouter() {
  const { view } = useApp();

  if (view === "loading") return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{CSS}</style>
      <Loader2 size={24} color={T.accent} style={{ animation: "spin 1s linear infinite" }} />
    </div>
  );

  if (view === "auth") return <AuthView />;

  // All views below need StoryProvider
  return (
    <StoryProvider>
      <StoryViewRouter view={view} />
    </StoryProvider>
  );
}

function StoryViewRouter({ view }) {
  switch (view) {
    case "dashboard": return <DashboardView />;
    case "setup": return <SetupView />;
    case "session": return <SessionView />;
    case "report": return <ReportView />;
    case "library": return <LibraryView />;
    case "characters": return <CharactersView />;
    default: return <DashboardView />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <ViewRouter />
    </AppProvider>
  );
}
