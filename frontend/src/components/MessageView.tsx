import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Check, Copy, RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";
import type { Msg } from "../lib/api";

interface Props { m: Msg; streaming: boolean; isLast: boolean; onRegenerate: () => void; onFeedback: (f: "up" | "down") => void }

export default function MessageView({ m, streaming, isLast, onRegenerate, onFeedback }: Props) {
  const [copied, setCopied] = useState(false);
  if (m.role === "user")
    return <div className="flex justify-end"><div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-[15px] text-white">{m.content}</div></div>;
  const live = streaming && isLast;
  return (
    <div className="group">
      {m.content && <div className={`prose-17 ${live ? "cursor" : ""}`}><ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{m.content}</ReactMarkdown></div>}
      {live && !m.content && <p className="text-sm text-mute">Thinking…</p>}
      {m.error && (
        <div role="alert" className="mt-2 rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm">
          <p>{m.error}</p><button onClick={onRegenerate} className="mt-1 font-medium text-accent">Try again</button>
        </div>
      )}
      {!live && m.content && (
        <div className="mt-2 flex gap-1 text-mute">
          <button aria-label="Copy response" className="rounded-lg p-1.5 hover:bg-bg" onClick={() => { navigator.clipboard.writeText(m.content); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? <Check size={15} /> : <Copy size={15} />}</button>
          {isLast && <button aria-label="Regenerate response" className="rounded-lg p-1.5 hover:bg-bg" onClick={onRegenerate}><RefreshCw size={15} /></button>}
          <button aria-label="Good response" aria-pressed={m.feedback === "up"} className={`rounded-lg p-1.5 hover:bg-bg ${m.feedback === "up" ? "text-accent" : ""}`} onClick={() => onFeedback("up")}><ThumbsUp size={15} /></button>
          <button aria-label="Bad response" aria-pressed={m.feedback === "down"} className={`rounded-lg p-1.5 hover:bg-bg ${m.feedback === "down" ? "text-accent" : ""}`} onClick={() => onFeedback("down")}><ThumbsDown size={15} /></button>
        </div>
      )}
    </div>
  );
}
