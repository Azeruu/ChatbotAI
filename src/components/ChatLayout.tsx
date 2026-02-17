import { HomeIcon, LogOut, Menu, NotebookPenIcon, Trash2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Logo from "../assets/opensawit.png";

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
    <div className="flex flex-col h-screen bg-emerald-600 text-gray-800">

      <main className="flex-1 overflow-y-auto p-4 space-y-4 max-w-3xl w-full mx-auto">
        {messages.length === 0 && !loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md space-y-2">
              <p className="text-2xl text-gray-900">
                Selamat datang di Open Sawit Chat.
              </p>
              <p className="text-md text-gray-600">
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
                  className={`max-w-[80%] px-4 py-2 rounded-2xl shadow-sm ${message.role === "user"
                    ? "bg-indigo-500 text-white rounded-tr-none"
                    : "bg-white text-gray-700 border border-gray-200 rounded-tl-none"
                    }`}
                >
                  <p className="text-xs font-bold mb-1 opacity-70">
                    {message.role === "user" ? "Kamu" : "Wowo Chan"}
                  </p>
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start italic text-sm text-gray-500 animate-pulse">
                Wowo Chan sedang berpikir...
              </div>
            )}

            <div ref={chatEndRef} />
          </>
        )}
      </main>

      <footer className="sticky pb-20 bg-emerald-600 shadow-md">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            className="flex-1 border border-gray-100 rounded-full px-5 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && sendMessage()}
            placeholder="Tanya Wowo Chan..."
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-full px-6 py-2 font-medium transition-colors shadow-sm"
          >
            Kirim
          </button>
        </div>
      </footer>
    </div>
  );
}

type RenameChatSectionProps = {
  sessionId: string;
  currentTitle: string | null;
  apiBaseUrl: string;
  onRenamed: (updated: { id: string; title: string | null; createdAt: string }) => void;
};

function RenameChatSection({
  sessionId,
  currentTitle,
  apiBaseUrl,
  onRenamed,
}: RenameChatSectionProps) {
  const [value, setValue] = useState(currentTitle ?? "");

  const handleSubmit = async () => {
    const trimmed = value.trim();

    try {
      const response = await fetch(`${apiBaseUrl}/api/chat/${sessionId}/title`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: trimmed }),
      });

      if (!response.ok) {
        return;
      }

      const updated = (await response.json()) as {
        id: string;
        title: string | null;
        createdAt: string;
      };

      onRenamed(updated);
    } catch (error) {
      console.error("Gagal mengganti nama chat", error);
    }
  };

  return (
    <div className="px-4 py-3 border-b">
      <p className="text-xs font-semibold text-gray-700 mb-1">
        Ganti nama chat
      </p>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Nama chat"
        />
        <button
          onClick={handleSubmit}
          className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-1"
        >
          Simpan
        </button>
      </div>
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

  const handleGoHomeChat = () => {
    onSessionIdChange(null);
  };

  const handleNewChat = () => {
    onSessionIdChange(null);
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

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      <aside className="w-72 border-r bg-emerald-600 flex flex-col">

        {/* Header */}
        <header className="sticky top-0 z-50 bg-emerald-700 text-gray-100 py-3 px-6 shadow-md flex justify-between items-center">
          <div className="flex items-center">
            <img src={Logo} alt="Logo Open Sawit" className="w-16 h-16" />
            <h1 className="text-sm font-bold text-center tracking-wide">Open Sawit</h1>
          </div>
          <Menu className="cursor-pointer" />
        </header>

        {/* Button Navigasi */}
        <div className="px-4 py-3 flex flex-col gap-2 mt-8">
          <button
            onClick={handleGoHomeChat}
            className="flex-1 text-sm bg-transparent hover:bg-gray-200/30 text-gray-900 rounded-full px-3 py-2 font-bold w-full items-start flex"
          >
            <HomeIcon className="w-5 h-5 mr-2" />
            Home
          </button>
          <button
            onClick={handleNewChat}
            className="flex-1 text-sm bg-transparent hover:bg-gray-200/30 text-gray-900 rounded-full px-3 py-2 font-bold items-start flex w-full"
          >
            <NotebookPenIcon className="w-5 h-5 mr-2" />
            Chat baru
          </button>
        </div>


        <div className="px-4 py-3">
          <p className="text-sm font-semibold text-gray-700 mb-3 mt-3">
            Riwayat chat
          </p>
          <div className="max-h-64 overflow-y-auto -mx-2 space-y-1">
            {sessions.map((item) => {
              const isActive = item.id === sessionId;
              const label =
                item.title && item.title.trim().length > 0
                  ? item.title
                  : "Chat tanpa judul";

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 px-2 py-1 rounded-lg ${isActive
                    ? "bg-indigo-100 text-indigo-700"
                    : "hover:bg-gray-100/30 text-gray-900"
                    }`}
                >
                  <button
                    onClick={() => onSessionIdChange(item.id)}
                    className="flex-1 text-left text-xs"
                  >
                    <span className="line-clamp-2">{label}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteSession(item.id)}
                    className="text-xs text-gray-600 hover:text-red-500 px-1 py-0.5 rounded"
                  >
                    <Trash2Icon className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
            {sessions.length === 0 && (
              <p className="text-xs text-gray-400 px-2 py-1">
                Belum ada riwayat chat.
              </p>
            )}
          </div>
        </div>
        {sessionId && (
          <RenameChatSection
            key={sessionId}
            sessionId={sessionId}
            apiBaseUrl={apiBaseUrl}
            currentTitle={
              sessions.find((item) => item.id === sessionId)?.title ?? null
            }
            onRenamed={(updated) => {
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
            }}
          />
        )}
        {/* Bagian Header User */}
        <div className="px-4 py-4 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-3">
            <img src="" alt="pp" className="w-10 h-10 rounded-full border border-white" />
            <div className="flex flex-col">
              <span className="text-sm text-gray-100">Masuk sebagai</span>
              <span className="text-sm font-semibold text-gray-800">
                {user.name}
              </span>
            </div>
          </div>
          {/* drawer nanti */}
          <button
            onClick={onLogout}
            className="text-xs text-gray-600 px-2 py-1 rounded-full hover:bg-red-50/30 transition-colors"
          >
            <LogOut/>
          </button>
        </div>
      </aside>
      <div className="flex-1">
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
