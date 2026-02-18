import { useState } from "react";
import { HomePage } from "./components/HomePage";
import { ChatLayout } from "./components/ChatLayout";
import { LoginPage, type User } from "./components/LoginPage";
import { ThemeProvider } from "./components/theme-provider";

type Page = "home" | "login" | "chat";

const STORAGE_USER_KEY = "wowo_user";
const STORAGE_SESSION_KEY = "wowo_session";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

function App() {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const storedUserRaw = window.localStorage.getItem(STORAGE_USER_KEY);

    if (!storedUserRaw) {
      return null;
    }

    try {
      const storedUser = JSON.parse(storedUserRaw) as User;

      if (storedUser?.id && storedUser?.name) {
        return storedUser;
      }
    } catch (error) {
      console.error("Gagal membaca user dari storage", error);
    }

    return null;
  });

  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const storedSessionId = window.localStorage.getItem(STORAGE_SESSION_KEY);
    if (!storedSessionId) {
      return null;
    }

    return storedSessionId;
  });

  const [page, setPage] = useState<Page>(() => (user ? "chat" : "home"));

  const handleLogin = (nextUser: User) => {
    setUser(nextUser);
    setSessionId(null);
    window.localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(nextUser));
    window.localStorage.removeItem(STORAGE_SESSION_KEY);
    setPage("chat");
  };

  const handleSessionIdChange = (nextSessionId: string | null) => {
    setSessionId(nextSessionId);

    if (nextSessionId) {
      window.localStorage.setItem(STORAGE_SESSION_KEY, nextSessionId);
    } else {
      window.localStorage.removeItem(STORAGE_SESSION_KEY);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setSessionId(null);
    window.localStorage.removeItem(STORAGE_USER_KEY);
    window.localStorage.removeItem(STORAGE_SESSION_KEY);
    setPage("home");
  };

  if (!user) {
    if (page === "login") {
      return <LoginPage apiBaseUrl={API_BASE_URL} onLogin={handleLogin} open={true} onOpenChange={(open) => setPage(open ? "chat" : "home")} />;
    }

    return <HomePage apiBaseUrl={API_BASE_URL} onLogin={handleLogin} />;
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      {/* {children} */}
      <ChatLayout
        user={user}
        sessionId={sessionId}
        apiBaseUrl={API_BASE_URL}
        onSessionIdChange={handleSessionIdChange}
        onLogout={handleLogout}
      />
    </ThemeProvider>
  );
}

export default App;
