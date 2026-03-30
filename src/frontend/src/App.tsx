import { Link2, Loader2, LogOut, MessageCircle, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useActor } from "./hooks/useActor";
import type { ChatMessage } from "./hooks/useQueries";

const NICKNAME_KEY = "stormlink_nickname";

function formatTime(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  const date = new Date(ms);
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export default function App() {
  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem(NICKNAME_KEY) ?? "";
  });
  const [view, setView] = useState<"nickname" | "chat">(
    localStorage.getItem(NICKNAME_KEY) ? "chat" : "nickname",
  );

  const handleNicknameSubmit = (name: string) => {
    localStorage.setItem(NICKNAME_KEY, name);
    setNickname(name);
    setView("chat");
  };

  const handleChangeName = () => {
    localStorage.removeItem(NICKNAME_KEY);
    setNickname("");
    setView("nickname");
  };

  if (view === "nickname") {
    return <NicknameScreen onSubmit={handleNicknameSubmit} />;
  }

  return <ChatScreen nickname={nickname} onChangeName={handleChangeName} />;
}

function NicknameScreen({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      onSubmit(trimmed);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "oklch(0.10 0.012 230)" }}
    >
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: "oklch(0.65 0.12 215 / 0.15)",
              border: "1.5px solid oklch(0.65 0.12 215 / 0.3)",
            }}
          >
            <Link2
              className="w-8 h-8"
              style={{ color: "oklch(0.65 0.12 215)" }}
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            StormLink Basic
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "oklch(0.73 0.010 220)" }}
          >
            Chat across your local network
          </p>
        </div>

        <div
          className="rounded-2xl p-6"
          style={{
            background: "oklch(0.16 0.015 230)",
            border: "1px solid oklch(0.23 0.015 230)",
          }}
        >
          <h2 className="text-lg font-semibold mb-1 text-foreground">
            Enter your nickname
          </h2>
          <p
            className="text-sm mb-5"
            style={{ color: "oklch(0.73 0.010 220)" }}
          >
            Others will see this in the chat
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              ref={inputRef}
              data-ocid="nickname.input"
              type="text"
              placeholder="e.g. Alex, JohnDoe..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
              maxLength={24}
              className="w-full rounded-xl px-4 py-3 text-base outline-none transition-all"
              style={{
                background: "oklch(0.10 0.012 230)",
                border: "1.5px solid oklch(0.23 0.015 230)",
                color: "oklch(0.96 0.005 220)",
                fontSize: "16px",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "oklch(0.65 0.12 215)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "oklch(0.23 0.015 230)";
              }}
            />
            <button
              data-ocid="nickname.submit_button"
              type="submit"
              disabled={value.trim().length === 0}
              className="w-full rounded-xl py-3 font-semibold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "oklch(0.65 0.12 215)",
                color: "oklch(0.10 0.012 230)",
              }}
            >
              Start Chatting
            </button>
          </form>
        </div>
      </div>

      <footer
        className="mt-auto pt-8 pb-4 text-center text-xs"
        style={{ color: "oklch(0.50 0.008 220)" }}
      >
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}

function ChatScreen({
  nickname,
  onChangeName,
}: { nickname: string; onChangeName: () => void }) {
  const { actor, isFetching } = useActor();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const highestIdRef = useRef<bigint>(BigInt(-1));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const actorRef = useRef(actor);
  const prevMsgCountRef = useRef(0);

  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Initial load
  useEffect(() => {
    if (!actor || isFetching) return;
    (async () => {
      try {
        const all = (await (actor as any).getAllMessages()) as ChatMessage[];
        setMessages(all);
        if (all.length > 0) {
          const maxId = all.reduce(
            (m, msg) => (msg.id > m ? msg.id : m),
            BigInt(0),
          );
          highestIdRef.current = maxId;
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, [actor, isFetching]);

  // Scroll to bottom whenever messages array changes
  useEffect(() => {
    if (messages.length !== prevMsgCountRef.current) {
      prevMsgCountRef.current = messages.length;
      scrollToBottom();
    }
  });

  // Polling every 2 seconds
  useEffect(() => {
    if (!actor || isFetching || isLoading) return;

    pollingRef.current = setInterval(async () => {
      const currentActor = actorRef.current;
      if (!currentActor) return;
      try {
        const sinceId =
          highestIdRef.current === BigInt(-1)
            ? BigInt(0)
            : highestIdRef.current + BigInt(1);
        const newMsgs = (await (currentActor as any).getMessages(
          sinceId,
        )) as ChatMessage[];
        if (newMsgs.length > 0) {
          const maxId = newMsgs.reduce(
            (m, msg) => (msg.id > m ? msg.id : m),
            BigInt(0),
          );
          highestIdRef.current = maxId;
          setMessages((prev) => [...prev, ...newMsgs]);
        }
      } catch (_e) {
        // ignore polling errors
      }
    }, 2000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [actor, isFetching, isLoading]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !actor || isSending) return;
    setInputText("");
    setIsSending(true);
    try {
      const newId = (await (actor as any).postMessage(
        nickname,
        text,
      )) as bigint;
      const optimistic: ChatMessage = {
        id: newId,
        nickname,
        text,
        timestamp: BigInt(Date.now()) * BigInt(1_000_000),
      };
      setMessages((prev) => {
        if (prev.some((m) => m.id === newId)) return prev;
        return [...prev, optimistic];
      });
      if (newId > highestIdRef.current) {
        highestIdRef.current = newId;
      }
    } catch (_e) {
      setInputText(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="flex flex-col h-screen max-w-lg mx-auto"
      style={{ background: "oklch(0.10 0.012 230)" }}
    >
      {/* Header */}
      <header
        data-ocid="chat.panel"
        className="flex items-center justify-between px-4 py-3 shrink-0 z-10"
        style={{
          background: "oklch(0.13 0.013 230)",
          borderBottom: "1px solid oklch(0.23 0.015 230)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "oklch(0.65 0.12 215 / 0.15)" }}
          >
            <MessageCircle
              className="w-4 h-4"
              style={{ color: "oklch(0.65 0.12 215)" }}
            />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-none text-foreground">
              StormLink Basic
            </h1>
            <p
              className="text-xs mt-0.5"
              style={{ color: "oklch(0.73 0.010 220)" }}
            >
              @{nickname}
            </p>
          </div>
        </div>
        <button
          type="button"
          data-ocid="chat.secondary_button"
          onClick={onChangeName}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
          style={{
            background: "oklch(0.20 0.012 230)",
            color: "oklch(0.73 0.010 220)",
            border: "1px solid oklch(0.23 0.015 230)",
          }}
        >
          <LogOut className="w-3.5 h-3.5" />
          Change Name
        </button>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {isLoading ? (
          <div
            data-ocid="chat.loading_state"
            className="flex flex-col items-center justify-center h-full gap-3"
          >
            <Loader2
              className="w-8 h-8 animate-spin"
              style={{ color: "oklch(0.65 0.12 215)" }}
            />
            <p className="text-sm" style={{ color: "oklch(0.73 0.010 220)" }}>
              Connecting…
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div
            data-ocid="chat.empty_state"
            className="flex flex-col items-center justify-center h-full gap-3 text-center"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: "oklch(0.65 0.12 215 / 0.10)",
                border: "1px solid oklch(0.65 0.12 215 / 0.2)",
              }}
            >
              <MessageCircle
                className="w-6 h-6"
                style={{ color: "oklch(0.65 0.12 215)" }}
              />
            </div>
            <p className="text-sm font-medium text-foreground">
              No messages yet
            </p>
            <p className="text-xs" style={{ color: "oklch(0.73 0.010 220)" }}>
              Be the first to say something!
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.nickname === nickname;
            return (
              <div
                key={msg.id.toString()}
                data-ocid={`chat.item.${index + 1}`}
                className={`flex flex-col ${
                  isOwn ? "items-end" : "items-start"
                } animate-fade-in`}
              >
                {!isOwn && (
                  <span
                    className="text-xs font-medium mb-1 px-1"
                    style={{ color: "oklch(0.65 0.12 215)" }}
                  >
                    {msg.nickname}
                  </span>
                )}
                <div
                  className="max-w-[78%] rounded-2xl px-4 py-2.5"
                  style={
                    isOwn
                      ? {
                          background: "oklch(0.65 0.12 215)",
                          color: "oklch(0.10 0.012 230)",
                          borderBottomRightRadius: "4px",
                        }
                      : {
                          background: "oklch(0.18 0.015 230)",
                          color: "oklch(0.96 0.005 220)",
                          border: "1px solid oklch(0.23 0.015 230)",
                          borderBottomLeftRadius: "4px",
                        }
                  }
                >
                  <p className="text-sm leading-relaxed break-words">
                    {msg.text}
                  </p>
                </div>
                <span
                  className="text-[10px] mt-1 px-1"
                  style={{ color: "oklch(0.50 0.008 220)" }}
                >
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input bar */}
      <div
        className="shrink-0 px-4 py-3 flex items-end gap-2"
        style={{
          background: "oklch(0.13 0.013 230)",
          borderTop: "1px solid oklch(0.23 0.015 230)",
        }}
      >
        <input
          data-ocid="chat.input"
          type="text"
          placeholder="Type a message…"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 rounded-xl px-4 py-3 text-base outline-none transition-all"
          style={{
            background: "oklch(0.16 0.015 230)",
            border: "1.5px solid oklch(0.23 0.015 230)",
            color: "oklch(0.96 0.005 220)",
            fontSize: "16px",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "oklch(0.65 0.12 215)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "oklch(0.23 0.015 230)";
          }}
        />
        <button
          type="button"
          data-ocid="chat.primary_button"
          onClick={handleSend}
          disabled={!inputText.trim() || isSending || isLoading}
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "oklch(0.65 0.12 215)" }}
          aria-label="Send message"
        >
          {isSending ? (
            <Loader2
              className="w-5 h-5 animate-spin"
              style={{ color: "oklch(0.10 0.012 230)" }}
            />
          ) : (
            <Send
              className="w-5 h-5"
              style={{ color: "oklch(0.10 0.012 230)" }}
            />
          )}
        </button>
      </div>
    </div>
  );
}
