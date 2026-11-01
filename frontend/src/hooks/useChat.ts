import { useCallback, useEffect, useRef, useState } from "react";
import { Msg, streamChat } from "../lib/api";

export interface Conv { id: string; title: string; messages: Msg[]; updatedAt: number }
export interface Prefs { model: string; temperature: number; customInstructions: string; theme: "light" | "dark" | "system" }
const KEY = "17ai.convs.v1", PKEY = "17ai.prefs.v1";
const uid = () => crypto.randomUUID();
const load = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) ?? "") as T; } catch { return d; } };

export function usePrefs() {
  const [prefs, set] = useState<Prefs>(() => ({ model: "", temperature: 0.7, customInstructions: "", theme: "system", ...load<Partial<Prefs>>(PKEY, {}) }));
  useEffect(() => {
    localStorage.setItem(PKEY, JSON.stringify(prefs));
    const dark = prefs.theme === "dark" || (prefs.theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  }, [prefs]);
  return [prefs, (p: Partial<Prefs>) => set((s) => ({ ...s, ...p }))] as const;
}

export function useChat(prefs: Prefs) {
  const [convs, setConvs] = useState<Conv[]>(() => load<Conv[]>(KEY, []));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(convs)); }, [convs]);

  const patch = (id: string, fn: (c: Conv) => Conv) => setConvs((cs) => cs.map((c) => (c.id === id ? fn(c) : c)));
  const patchLast = (id: string, fn: (m: Msg) => Msg) => patch(id, (c) => ({ ...c, messages: c.messages.map((m, i) => (i === c.messages.length - 1 ? fn(m) : m)) }));

  const run = useCallback(async (id: string, history: Msg[]) => {
    const ctl = new AbortController(); abort.current = ctl; setGenerating(true);
    try {
      await streamChat(history.map(({ role, content }) => ({ role, content })), {
        model: prefs.model || undefined, temperature: prefs.temperature, customInstructions: prefs.customInstructions,
        signal: ctl.signal, onToken: (t) => patchLast(id, (m) => ({ ...m, content: m.content + t })),
      });
    } catch (e) {
      if ((e as Error).name !== "AbortError") patchLast(id, (m) => ({ ...m, error: (e as Error).message }));
    } finally { setGenerating(false); abort.current = null; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.model, prefs.temperature, prefs.customInstructions]);

  const active = convs.find((c) => c.id === activeId) ?? null;

  const send = (text: string) => {
    if (!text.trim() || generating) return;
    const user: Msg = { id: uid(), role: "user", content: text.trim() };
    const bot: Msg = { id: uid(), role: "assistant", content: "" };
    const history = [...(active?.messages ?? []), user];
    let id = active?.id;
    if (!id) {
      id = uid(); const nid = id;
      setConvs((cs) => [{ id: nid, title: text.trim().slice(0, 48), messages: [user, bot], updatedAt: Date.now() }, ...cs]);
      setActiveId(nid);
    } else patch(id, (c) => ({ ...c, messages: [...c.messages, user, bot], updatedAt: Date.now() }));
    run(id, history);
  };

  const regenerate = () => {
    if (!active || generating) return;
    const msgs = [...active.messages]; if (msgs.at(-1)?.role === "assistant") msgs.pop();
    patch(active.id, (c) => ({ ...c, messages: [...msgs, { id: uid(), role: "assistant", content: "" }] }));
    run(active.id, msgs);
  };

  return {
    convs, active, generating, send, regenerate,
    stop: () => abort.current?.abort(),
    newChat: () => setActiveId(null), select: setActiveId,
    rename: (id: string, title: string) => { if (title.trim()) patch(id, (c) => ({ ...c, title: title.trim() })); },
    remove: (id: string) => { setConvs((cs) => cs.filter((c) => c.id !== id)); if (id === activeId) setActiveId(null); },
    clearAll: () => { setConvs([]); setActiveId(null); },
    feedback: (mid: string, f: "up" | "down") => { if (active) patch(active.id, (c) => ({ ...c, messages: c.messages.map((m) => (m.id === mid ? { ...m, feedback: m.feedback === f ? undefined : f } : m)) })); },
  };
}
