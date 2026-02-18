import { HomeIcon, LogOut, Menu, NotebookPenIcon, Trash2Icon } from "lucide-react";
import Logo from "../assets/opensawit.png";
import RenameChatSection from "./RenameChatSection";

type User = {
  id: string;
  name: string;
};

type Session = {
  id: string;
  title: string | null;
  createdAt: string;
};

type SidebarProps = {
  isOpen: boolean;
  user: User;
  sessionId: string | null;
  sessions: Session[];
  apiBaseUrl: string;
  onToggle: () => void;
  onSessionIdChange: (sessionId: string | null) => void;
  onDeleteSession: (id: string) => void;
  onLogout: () => void;
  onSessionRenamed: (updated: { id: string; title: string | null; createdAt: string }) => void;
};

function Sidebar({
  isOpen,
  user,
  sessionId,
  sessions,
  apiBaseUrl,
  onToggle,
  onSessionIdChange,
  onDeleteSession,
  onLogout,
  onSessionRenamed,
}: SidebarProps) {
  const handleGoHomeChat = () => {
    onSessionIdChange(null);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      onToggle();
    }
  };

  const handleNewChat = () => {
    onSessionIdChange(null);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      onToggle();
    }
  };

  const handleSessionClick = (id: string) => {
    onSessionIdChange(id);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      onToggle();
    }
  };

  return (
    <aside
      className={`bg-secondary flex flex-col h-full z-50 transition-all duration-300 ease-in-out ${
        isOpen 
          ? "w-72 translate-x-0 border-r fixed md:static md:flex" 
          : "w-0 -translate-x-full md:hidden fixed overflow-hidden"
      }`}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-secondary text-foreground py-3 px-6 shadow-md flex justify-between items-center">
        <div className="flex items-center">
          <img src={Logo} alt="Logo Open Sawit" className="w-16 h-16" />
          <h1 className="text-sm font-bold text-center tracking-wide">Open Sawit</h1>
        </div>
        <button onClick={onToggle}>
          <Menu className="cursor-pointer w-6 h-6" />
        </button>
      </header>

      {/* Button Navigasi */}
      <div className="px-4 py-3 flex flex-col gap-2 mt-8 text-foreground">
        <button
          onClick={handleGoHomeChat}
          className="flex-1 text-sm bg-transparent hover:bg-gray-200/30 rounded-full px-3 py-2 font-bold w-full items-start flex"
        >
          <HomeIcon className="w-5 h-5 mr-2" />
          Home
        </button>
        <button
          onClick={handleNewChat}
          className="flex-1 text-sm bg-transparent hover:bg-gray-200/30  rounded-full px-3 py-2 font-bold items-start flex w-full"
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
                className={`flex items-center gap-2 px-2 py-1 rounded-lg ${
                  isActive
                    ? "bg-indigo-100 text-indigo-700"
                    : "hover:bg-gray-100/30 text-gray-900"
                }`}
              >
                <button
                  onClick={() => handleSessionClick(item.id)}
                  className="flex-1 text-left text-xs"
                >
                  <span className="line-clamp-2">{label}</span>
                </button>
                <button
                  onClick={() => onDeleteSession(item.id)}
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
          onRenamed={onSessionRenamed}
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
  );
}

export default Sidebar;
export type { SidebarProps };
