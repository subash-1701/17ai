import { BookOpen, Code2, FileSearch, PenLine } from "lucide-react";

const CARDS = [
  { icon: BookOpen, title: "Learn something new", prompt: "Teach me something fascinating I probably don't know. Ask me what I'm curious about first." },
  { icon: PenLine, title: "Write or improve content", prompt: "Help me write or improve some content. Ask what it's for and who will read it." },
  { icon: Code2, title: "Help me code", prompt: "Help me with a programming problem. Ask which language I'm using and what I'm trying to build." },
  { icon: FileSearch, title: "Analyze a document", prompt: "I want to analyze a document. Let me know what you need from me to get started." },
];

export default function Welcome({ onPick, disabled }: { onPick: (p: string) => void; disabled: boolean }) {
  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-4 text-center">
      <div className="orb mb-6" aria-hidden />
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Hello, I'm 17AI.</h1>
      <p className="mt-2 text-mute">What would you like to explore today?</p>
      <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {CARDS.map(({ icon: I, title, prompt }) => (
          <button key={title} disabled={disabled} onClick={() => onPick(prompt)} className="flex items-center gap-3 rounded-2xl border border-line bg-panel p-4 text-left text-sm font-medium transition-colors hover:border-accent disabled:opacity-50">
            <I size={18} className="shrink-0 text-accent" />{title}
          </button>
        ))}
      </div>
    </div>
  );
}
