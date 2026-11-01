import { useEffect, useRef, useState } from "react";
import { ArrowUp, Square } from "lucide-react";

interface Props { generating: boolean; disabled: boolean; models: string[]; model: string; onModel: (m: string) => void; onSend: (t: string) => void; onStop: () => void; seed?: string }
const DRAFT = "17ai.draft";

export default function Composer({ generating, disabled, models, model, onModel, onSend, onStop, seed }: Props) {
  const [text, setText] = useState(() => localStorage.getItem(DRAFT) ?? "");
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (seed) { setText(seed.replace("\u200b", "")); ref.current?.focus(); } }, [seed]);
  useEffect(() => { localStorage.setItem(DRAFT, text); const el = ref.current; if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 200) + "px"; } }, [text]);
  const submit = () => { if (!text.trim() || generating || disabled) return; onSend(text); setText(""); };
  return (
    <div className="glass mx-auto w-full max-w-3xl rounded-3xl border border-line p-2 shadow-[0_8px_30px_rgba(0,0,0,.06)]">
      <textarea ref={ref} rows={1} value={text} onChange={(e) => setText(e.target.value)} disabled={disabled}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); } if (e.key === "Escape" && generating) onStop(); }}
        placeholder={disabled ? "Connect a model to start chatting" : "Message 17AI"} aria-label="Message"
        className="max-h-[200px] w-full resize-none bg-transparent px-3 py-2 text-[16px] outline-none placeholder:text-mute" />
      <div className="flex items-center justify-between px-1 pt-1">
        {models.length > 1 ? (
          <select aria-label="Model" value={model} onChange={(e) => onModel(e.target.value)} className="max-w-[55%] truncate rounded-lg bg-transparent px-2 py-1 text-xs text-mute outline-none">
            {models.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        ) : <span className="truncate px-2 text-xs text-mute">{models[0] ?? ""}</span>}
        {generating
          ? <button onClick={onStop} aria-label="Stop generating" className="grid h-10 w-10 place-items-center rounded-full bg-ink text-bg"><Square size={14} fill="currentColor" /></button>
          : <button onClick={submit} disabled={!text.trim() || disabled} aria-label="Send" className="grid h-10 w-10 place-items-center rounded-full bg-accent text-white disabled:opacity-35"><ArrowUp size={18} /></button>}
      </div>
    </div>
  );
}
