import { useState } from "react";
import { Moon, Monitor, Pencil, Plus, Search, Sun, Trash2, X } from "lucide-react";
import type { Conv, Prefs } from "../hooks/useChat";

interface Props {
  convs: Conv[]; activeId?: string; open: boolean; prefs: Prefs; onClose: () => void;
  onNew: () => void; onSelect: (id: string) => void; onRename: (id: string, t: string) => void;
  onRemove: (id: string) => void; onClearAll: () => void; onTheme: (t: Prefs["theme"]) => void;
}

export default function Sidebar(p: Props) {
  const [q, setQ] = useState("");
  const list = p.convs.filter((c) => c.title.toLowerCase().includes(q.toLowerCase()));
  const themes = [["light", Sun], ["system", Monitor], ["dark", Moon]] as const;
  return (
    <>
      {p.open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={p.onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-line bg-panel safe-t transition-transform md:static md:translate-x-0 ${p.open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-2.5 p-4">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-accent text-sm font-semibold text-white">17</div>
          <span className="text-lg font-semibold tracking-tight">17AI</span>
          <button aria-label="Close sidebar" className="ml-auto p-2 md:hidden" onClick={p.onClose}><X size={18} /></button>
        </div>
        <div className="space-y-2 px-3">
          <button onClick={() => { p.onNew(); p.onClose(); }} className="flex w-full items-center gap-2 rounded-xl bg-accent px-3 py-2.5 text-sm font-medium text-white"><Plus size={16} />New chat</button>
          <label className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm text-mute">
            <Search size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search chats" className="w-full bg-transparent text-ink outline-none" />
          </label>
        </div>
        <nav className="mt-3 flex-1 space-y-0.5 overflow-y-auto px-2" aria-label="Conversations">
          {list.length === 0 && <p className="px-3 py-6 text-sm text-mute">{p.convs.length ? "No chats match." : "Your chats will appear here."}</p>}
          {list.map((c) => (
            <div key={c.id} className={`group flex items-center rounded-lg pr-1 ${c.id === p.activeId ? "bg-bg" : "hover:bg-bg"}`}>
              <button onClick={() => { p.onSelect(c.id); p.onClose(); }} className="min-w-0 flex-1 truncate px-3 py-2.5 text-left text-sm">{c.title}</button>
              <button aria-label="Rename chat" className="p-2 text-mute md:opacity-0 md:group-hover:opacity-100" onClick={() => { const t = window.prompt("Rename chat", c.title); if (t) p.onRename(c.id, t); }}><Pencil size={14} /></button>
              <button aria-label="Delete chat" className="p-2 text-mute md:opacity-0 md:group-hover:opacity-100" onClick={() => window.confirm("Delete this chat?") && p.onRemove(c.id)}><Trash2 size={14} /></button>
            </div>
          ))}
        </nav>
        <div className="space-y-2 border-t border-line p-3 safe-b">
          <div className="flex rounded-xl bg-bg p-1" role="group" aria-label="Theme">
            {themes.map(([t, Icon]) => (
              <button key={t} aria-label={`${t} theme`} aria-pressed={p.prefs.theme === t} onClick={() => p.onTheme(t)}
                className={`flex flex-1 justify-center rounded-lg py-1.5 ${p.prefs.theme === t ? "bg-panel shadow-sm" : "text-mute"}`}><Icon size={15} /></button>
            ))}
          </div>
          {p.convs.length > 0 && <button onClick={() => window.confirm("Delete all chats on this device?") && p.onClearAll()} className="w-full rounded-lg py-1.5 text-xs text-mute hover:text-ink">Clear all chats</button>}
        </div>
      </aside>
    </>
  );
}
