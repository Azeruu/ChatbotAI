import { useState } from "react";

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

export default RenameChatSection;
export type { RenameChatSectionProps };
