import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import { getHealth, Health } from "./lib/api";
import { useChat, usePrefs } from "./hooks/useChat";
import Sidebar from "./components/Sidebar";
import Composer from "./components/Composer";
import Welcome from "./components/Welcome";
import MessageView from "./components/MessageView";

export default function App() {
  const [prefs, setPrefs] = usePrefs();
  const chat = useChat(prefs);
  const [health, setHealth] = useState<Health | null | undefined>(undefined);
  const [nav, setNav] = useState(false);
  const [seed, setSeed] = useState<string>();
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { getHealth().then(setHealth); }, []);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [chat.active?.messages]);

  const ready = !!health?.configured;
  const msgs = chat.active?.messages ?? [];
  return (
    <div className="flex h-full">
      <Sidebar convs={chat.convs} activeId={chat.active?.id} open={nav} prefs={prefs} onClose={() => setNav(false)}
        onNew={chat.newChat} onSelect={chat.select} onRename={chat.rename} onRemove={chat.remove} onClearAll={chat.clearAll} onTheme={(theme) => setPrefs({ theme })} />
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 p-3 safe-t md:hidden">
          <button aria-label="Open sidebar" onClick={() => setNav(true)} className="p-2"><Menu size={20} /></button>
          <span className="font-semibold">17AI</span>
        </header>
        {health === null && <Banner>Can't reach the 17AI backend. Start it with <code>uvicorn app.main:app --reload</code> in <code>backend/</code>.</Banner>}
        {health && !health.configured && <Banner>No model is configured. Copy <code>backend/.env.example</code> to <code>.env</code> and set <code>MODEL_BASE_URL</code>, <code>MODEL_NAME</code> and <code>MODEL_API_KEY</code>.</Banner>}
        <div className="flex-1 overflow-y-auto">
          {msgs.length === 0 ? <Welcome disabled={!ready} onPick={(p) => setSeed(p + "\u200b")} /> : (
            <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
              {msgs.map((m, i) => (
                <MessageView key={m.id} m={m} isLast={i === msgs.length - 1} streaming={chat.generating}
                  onRegenerate={chat.regenerate} onFeedback={chat.feedback.bind(null, m.id)} />
              ))}
              <div ref={end} />
            </div>
          )}
        </div>
        <div className="px-3 pt-2 safe-b">
          <Composer generating={chat.generating} disabled={!ready} models={health?.models ?? []} model={prefs.model || health?.model || ""}
            onModel={(model) => setPrefs({ model })} onSend={chat.send} onStop={chat.stop} seed={seed} />
        </div>
      </main>
    </div>
  );
}

const Banner = ({ children }: { children: React.ReactNode }) => (
  <div role="status" className="mx-3 mt-2 rounded-xl border border-line bg-panel px-4 py-3 text-sm text-mute [&_code]:rounded [&_code]:bg-bg [&_code]:px-1">{children}</div>
);
