import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot, Trash2, ChevronDown, Loader2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
}

// ── Persistence ───────────────────────────────────────────────────────────────

const HIST_KEY = "vitalia_chat_history";

function loadHistory(): Message[] {
  try { return JSON.parse(localStorage.getItem(HIST_KEY) ?? "[]"); } catch { return []; }
}
function saveHistory(msgs: Message[]) {
  localStorage.setItem(HIST_KEY, JSON.stringify(msgs.slice(-40)));
}

// ── API call — goes to our own backend proxy, NOT directly to OpenAI ──────────

async function sendMessage(messages: Message[]): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  const data = await res.json() as { reply?: string; error?: string };

  if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
  if (!data.reply) throw new Error("Respuesta vacía del servidor");
  return data.reply;
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-[#E8F5F0] flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
          <Bot className="w-3.5 h-3.5 text-[#1B6B5B]" />
        </div>
      )}
      <div
        className={`max-w-[78%] px-4 py-3 rounded-[18px] text-[14px] leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-[#1B6B5B] text-white rounded-br-[4px]"
            : "bg-white text-[#1A1A2E] shadow-[0_2px_10px_rgba(0,0,0,0.07)] rounded-bl-[4px]"
        }`}
      >
        {msg.content}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface AssistantViewProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTED = [
  "¿Puedo comer arroz integral?",
  "¿Qué ejercicio es mejor para quemar grasa?",
  "¿Algún alimento que interfiera con el Eutirox?",
  "Propón un almuerzo alto en proteínas",
];

export function AssistantView({ isOpen, onClose }: AssistantViewProps) {
  const [messages, setMessages] = useState<Message[]>(loadHistory);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);
    setShowMenu(false);

    const updated: Message[] = [...messages, { role: "user", content: text }];
    setMessages(updated);
    saveHistory(updated);
    setLoading(true);

    try {
      const reply = await sendMessage(updated);
      const final: Message[] = [...updated, { role: "assistant", content: reply }];
      setMessages(final);
      saveHistory(final);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al conectar con el asistente");
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setMessages([]);
    saveHistory([]);
    setShowMenu(false);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed inset-0 z-[60] bg-[#F5F7FA] flex flex-col"
        >
          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 pt-12 pb-4 bg-white border-b border-black/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#E8F5F0] flex items-center justify-center">
                <Bot className="w-5 h-5 text-[#1B6B5B]" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-[#1A1A2E]">Asistente Vitalia</p>
                <p className="text-[11px] text-[#9CA3AF]">Nutrición · Ejercicios · Medicamentos</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(v => !v)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-[#9CA3AF] active:bg-[#F3F4F6]"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-9 bg-white rounded-[14px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] py-1.5 w-44 z-10"
                    >
                      <button
                        onClick={handleClear}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#374151] active:bg-[#F3F4F6]"
                      >
                        <Trash2 className="w-4 h-4" />
                        Borrar historial
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Close */}
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F3F4F6] text-[#6B7280] active:scale-95 transition-transform"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Messages ────────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2">
            {messages.length === 0 && (
              <div className="space-y-3 mt-2">
                <p className="text-[13px] text-[#9CA3AF] text-center mb-4">
                  Pregúntame sobre tu salud, comidas o ejercicios
                </p>
                {SUGGESTED.map(q => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="w-full text-left px-4 py-3 bg-white rounded-[14px] text-[13px] text-[#374151] shadow-[0_2px_8px_rgba(0,0,0,0.05)] active:scale-[0.98] transition-transform"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}

            {loading && (
              <div className="flex justify-start mb-3">
                <div className="w-7 h-7 rounded-full bg-[#E8F5F0] flex items-center justify-center mr-2 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-[#1B6B5B]" />
                </div>
                <div className="bg-white px-4 py-3 rounded-[18px] rounded-bl-[4px] shadow-[0_2px_10px_rgba(0,0,0,0.07)]">
                  <Loader2 className="w-4 h-4 text-[#1B6B5B] animate-spin" />
                </div>
              </div>
            )}

            {error && (
              <div className="mx-1 mb-3 px-4 py-3 bg-red-50 border border-red-100 rounded-[14px]">
                <p className="text-[12px] text-red-500">{error}</p>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── Input ───────────────────────────────────────────────────── */}
          <div className="px-4 py-3 pb-6 bg-white border-t border-black/[0.06]">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Pregunta algo..."
                rows={1}
                className="flex-1 resize-none px-4 py-3 rounded-[16px] bg-[#F3F4F6] text-[14px] text-[#1A1A2E] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1B6B5B]/30 max-h-28"
                style={{ lineHeight: "1.4" }}
              />
              <button
                onClick={() => void handleSend()}
                disabled={!input.trim() || loading}
                className="w-11 h-11 rounded-full bg-[#1B6B5B] flex items-center justify-center flex-shrink-0 disabled:opacity-40 active:scale-95 transition-all"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
