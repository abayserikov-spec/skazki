import { CSS, T } from "components/UI";
import { useApp } from "context/AppContext";
import { StoryProvider } from "context/StoryContext";
import { Loader2 } from "lucide-react";
import CharactersView from "views/CharactersView";
import DashboardView from "views/DashboardView";
import LibraryView from "views/LibraryView";
import ReportView from "views/ReportView";
import SessionView from "views/SessionView";
import SetupView from "views/SetupView";

export default function Dashboard() {
  const { view } = useApp();

  if (view === "loading")
    return (
      <div
        style={{
          minHeight: "100vh",
          background: T.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <style>{CSS}</style>
        <Loader2
          size={24}
          color={T.accent}
          style={{ animation: "spin 1s linear infinite" }}
        />
      </div>
    );

  if (view === "auth") {
    window.location.replace("/app/login");
    return null;
  }

  return (
    <StoryProvider>
      <StoryViewRouter view={view} />
    </StoryProvider>
  );
}

function StoryViewRouter({ view }: { view: string }) {
  switch (view) {
    case "dashboard":
      return <DashboardView />;
    case "setup":
      return <SetupView />;
    case "session":
      return <SessionView />;
    case "report":
      return <ReportView />;
    case "library":
      return <LibraryView />;
    case "characters":
      return <CharactersView />;
    default:
      return <DashboardView />;
  }
}
