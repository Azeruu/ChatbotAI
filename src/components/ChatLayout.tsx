import { Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Sidebar from "./Sidebar";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type User = {
  id: string;
  name: string;
};

type ChatPageProps = {
  user: User;
  sessionId: string | null;
  apiBaseUrl: string;
  onSessionIdChange: (sessionId: string | null) => void;
  onSessionChanged?: () => void;
};

function ChatPage({
  user,
  sessionId,
  apiBaseUrl,
  onSessionIdChange,
  onSessionChanged,
}: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      return;
    }

    const loadHistory = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/chat/${sessionId}`);

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          id: string;
          content: string;
          role: "user" | "assistant";
        }[];

        setMessages(
          data.map((item) => ({
            id: item.id,
            role: item.role,
            content: item.content,
          })),
        );
      } catch (error) {
        console.error("Gagal memuat riwayat chat", error);
      }
    };

    loadHistory();
  }, [apiBaseUrl, sessionId]);

  const sendMessage = async () => {
    if (!input.trim()) {
      return;
    }

    let targetSessionId = sessionId;

    if (!targetSessionId) {
      try {
        const response = await fetch(`${apiBaseUrl}/api/chat/start`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: user.id }),
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (!data?.id) {
          return;
        }

        targetSessionId = data.id as string;
        onSessionIdChange(targetSessionId);
      } catch (error) {
        console.error("Gagal membuat sesi chat", error);
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    const assistantMessageId = (Date.now() + 1).toString();

    setMessages((previous) => [
      ...previous,
      userMessage,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
      },
    ]);

    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/chat-stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: currentInput,
          userId: user.id,
          sessionId: targetSessionId,
        }),
      });

      if (!response.body) {
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;

        setMessages((previous) =>
          previous.map((message) =>
            message.id === assistantMessageId
              ? {
                ...message,
                content: accumulatedContent,
              }
              : message,
          ),
        );
      }

      if (targetSessionId) {
        try {
          const historyResponse = await fetch(
            `${apiBaseUrl}/api/chat/${targetSessionId}`,
          );

          if (historyResponse.ok) {
            const data = (await historyResponse.json()) as {
              id: string;
              content: string;
              role: "user" | "assistant";
            }[];

            setMessages(
              data.map((item) => ({
                id: item.id,
                role: item.role,
                content: item.content,
              })),
            );
          }
        } catch (historyError) {
          console.error("Gagal memuat ulang riwayat chat", historyError);
        }
      }

      if (onSessionChanged) {
        onSessionChanged();
      }
    } catch (error) {
      console.error("Gagal mengirim pesan", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-primary overflow-hidden">

      <main className="flex-1 overflow-y-auto overflow-x-hidden p-5 md:p-5 space-y-4 md:max-w-3xl w-full mx-auto">
        {messages.length === 0 && !loading ? (
          <div className="h-full flex items-center justify-center px-4">
            <div className="text-center max-w-md space-y-2">
              <p className="text-xl md:text-2xl text-primary">
                Selamat datang di Open Sawit Chat.
              </p>
              <p className="text-sm md:text-md text-muted-foreground">
                Tulis pertanyaan pertama kamu di bawah untuk mulai ngobrol dengan
                Wowo Chan.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[80%] px-3 md:px-4 py-2 rounded-2xl shadow-sm ${message.role === "user"
                    ? "bg-secondary text-primary border border-primary rounded-tr-none"
                    : "bg-primary text-gray-700 border border-gray-200 rounded-tl-none"
                    }`}
                >
                  <p className="text-xs md:text-xs font-bold mb-1 opacity-70">
                    {message.role === "user" ? "Kamu" : "Wowo Chan"}
                  </p>
                  <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start italic text-xs md:text-sm text-gray-500 animate-pulse px-3 md:px-0">
                Wowo Chan sedang berpikir...
              </div>
            )}

            <div ref={chatEndRef} />
          </>
        )}
      </main>

      <footer className="sticky bottom-0 md:pb-5 pb-4 pt-2 bg-secondary shadow-md w-full">
        <div className="max-w-3xl mx-auto mt-4 flex gap-2 px-3 md:px-0 items-center justify-center">
          <input
            className="flex-1 border border-foreground rounded-full px-4 md:px-5 py-2 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && sendMessage()}
            placeholder="Tanya Wowo Chan..."
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-full px-10 md:px-6 py-2 font-sm md:text-base transition-colors shadow-sm"
          >
            Kirim
          </button>
        </div>
      </footer>
    </div>
  );
}

type ChatLayoutProps = {
  user: User;
  sessionId: string | null;
  apiBaseUrl: string;
  onSessionIdChange: (sessionId: string | null) => void;
  onLogout: () => void;
};

function ChatLayout({
  user,
  sessionId,
  apiBaseUrl,
  onSessionIdChange,
  onLogout,
}: ChatLayoutProps) {
  const [sessions, setSessions] = useState<
    { id: string; title: string | null; createdAt: string }[]
  >([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/chat/sessions?userId=${encodeURIComponent(
            user.id,
          )}`,
        );

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          id: string;
          title: string | null;
          createdAt: string;
        }[];

        if (isCancelled) {
          return;
        }

        setSessions(data);
      } catch (error) {
        console.error("Gagal memuat daftar sesi chat", error);
      }
    };

    load();

    return () => {
      isCancelled = true;
    };
  }, [apiBaseUrl, user.id, sessionId]);

  // Set initial sidebar state based on screen size
  useEffect(() => {
    const checkScreenSize = () => {
      // Tablet breakpoint is typically 768px, desktop is 1024px
      // Hide sidebar by default on screens smaller than 768px (mobile only)
      // Tablet (768px+) and Desktop (1024px+) should show sidebar by default
      const isMobile = window.innerWidth < 768;
      setIsSidebarOpen(!isMobile);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleDeleteSession = async (id: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/chat/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        return;
      }

      setSessions((previous) => previous.filter((item) => item.id !== id));

      if (sessionId === id) {
        onSessionIdChange(null);
      }
    } catch (error) {
      console.error("Gagal menghapus sesi chat", error);
    }
  };

  const handleSessionChanged = () => {
    if (!user.id) {
      return;
    }

    void (async () => {
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/chat/sessions?userId=${encodeURIComponent(
            user.id,
          )}`,
        );

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          id: string;
          title: string | null;
          createdAt: string;
        }[];

        setSessions(data);
      } catch (error) {
        console.error("Gagal memuat daftar sesi chat", error);
      }
    })();
  };

  const handleSessionRenamed = (updated: { id: string; title: string | null; createdAt: string }) => {
    setSessions((previous) =>
      previous.map((item) =>
        item.id === updated.id
          ? {
              ...item,
              title: updated.title,
              createdAt: updated.createdAt,
            }
          : item,
      ),
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 relative overflow-hidden w-full">
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      <Sidebar
        isOpen={isSidebarOpen}
        user={user}
        sessionId={sessionId}
        sessions={sessions}
        apiBaseUrl={apiBaseUrl}
        onToggle={toggleSidebar}
        onSessionIdChange={onSessionIdChange}
        onDeleteSession={handleDeleteSession}
        onLogout={onLogout}
        onSessionRenamed={handleSessionRenamed}
      />
      <div className="flex-1 relative overflow-hidden w-full">
        {/* Menu button for mobile and desktop */}
        {!isSidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="fixed top-3 left-3 md:top-4 md:left-4 z-30 bg-emerald-600 text-white p-2 rounded-lg shadow-lg hover:bg-emerald-700 transition-colors"
          >
            <Menu className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        )}
        <ChatPage
          user={user}
          sessionId={sessionId}
          apiBaseUrl={apiBaseUrl}
          onSessionIdChange={onSessionIdChange}
          onSessionChanged={handleSessionChanged}
        />
      </div>
    </div>
  );
}

export type { ChatLayoutProps };
export { ChatLayout };
