export type Role = "user" | "assistant";
export interface Msg { id: string; role: Role; content: string; feedback?: "up" | "down"; error?: string }
export interface Health { configured: boolean; provider: string; model: string; models: string[] }

const BASE = import.meta.env.VITE_API_URL ?? "";

export async function getHealth(): Promise<Health | null> {
  try { const r = await fetch(`${BASE}/api/health`); return r.ok ? await r.json() : null; } catch { return null; }
}

export interface StreamOpts { model?: string; temperature: number; customInstructions: string; signal: AbortSignal; onToken: (t: string) => void }

/** POSTs to /api/chat/stream and parses Server-Sent Events. Throws Error with a user-readable message. */
export async function streamChat(messages: Pick<Msg, "role" | "content">[], o: StreamOpts): Promise<void> {
  const res = await fetch(`${BASE}/api/chat/stream`, {
    method: "POST", headers: { "Content-Type": "application/json" }, signal: o.signal,
    body: JSON.stringify({ messages, model: o.model, temperature: o.temperature, custom_instructions: o.customInstructions || undefined }),
  });
  if (!res.ok || !res.body) {
    let msg = `Request failed (${res.status}).`;
    try { msg = (await res.json()).detail ?? msg; } catch { /* keep default */ }
    throw new Error(typeof msg === "string" ? msg : "Invalid request.");
  }
  const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = "";
  for (;;) {
    const { done, value } = await reader.read(); if (done) return;
    buf += dec.decode(value, { stream: true });
    let i: number;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 2);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") return;
      const evt = JSON.parse(data);
      if (evt.error) throw new Error(evt.error);
      if (evt.token) o.onToken(evt.token);
    }
  }
}
