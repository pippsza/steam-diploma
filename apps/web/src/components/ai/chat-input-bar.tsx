"use client";

import { MessageCircle, Send, X, Plus, Trash2, History } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatContext, type ChatSession } from "./chat-provider";
import { ChatMessages } from "./chat-messages";
import { cn } from "@/lib/utils";

function ChatHistorySidebar({
  t,
  sessions,
  currentSessionId,
  sessionsLoading,
  startNewChat,
  switchSession,
  removeSession,
  onSelect,
}: {
  t: (key: string) => string;
  sessions: ChatSession[];
  currentSessionId: string | null;
  sessionsLoading: boolean;
  startNewChat: () => void;
  switchSession: (id: string) => void;
  removeSession: (id: string) => void;
  onSelect?: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between border-b px-3 py-3">
        <h3 className="text-sm font-medium">{t("history")}</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={startNewChat}
          title={t("newChat")}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        {sessionsLoading ? (
          <div className="p-3 text-xs text-muted-foreground">
            {t("thinking")}
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-3 text-xs text-muted-foreground">
            {t("noChats")}
          </div>
        ) : (
          <div className="space-y-0.5 p-1">
            {sessions.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "group flex items-center gap-1 rounded-lg px-2 py-2 text-sm cursor-pointer transition-colors",
                  s.id === currentSessionId
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
                )}
                onClick={() => {
                  switchSession(s.id);
                  onSelect?.();
                }}
              >
                <span className="flex-1 truncate">{s.title}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSession(s.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </>
  );
}

export function ChatInputBar() {
  const { data: session } = useSession();
  const t = useTranslations("chat");
  const tAuth = useTranslations("auth");
  const {
    input,
    setInput,
    sendUserMessage,
    isOpen,
    open,
    close,
    isLoading,
    sessions,
    currentSessionId,
    switchSession,
    startNewChat,
    removeSession,
    sessionsLoading,
  } = useChatContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAuthenticated = !!session?.user;
  const [isVerified, setIsVerified] = useState(false);

  // Load isVerified from DB (JWT may be stale after admin changes it)
  useEffect(() => {
    if (!session?.user?.id) {
      setIsVerified(false);
      return;
    }
    fetch("/api/user/verified")
      .then((r) => r.json())
      .then((data) => setIsVerified(data.isVerified ?? false))
      .catch(() => setIsVerified(false));
  }, [session?.user?.id]);

  // Auto-focus input when chat opens + lock body scroll + ESC to close
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const timer = setTimeout(() => inputRef.current?.focus(), 200);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") close();
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        clearTimeout(timer);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, close]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      open();
      return;
    }
    sendUserMessage(input);
  };

  const sidebarProps = {
    t,
    sessions,
    currentSessionId,
    sessionsLoading,
    startNewChat,
    switchSession,
    removeSession,
  };

  return (
    <>
      {/* ── Collapsed pill ── */}
      <AnimatePresence>
        {!isOpen && (
          <div className="fixed bottom-6 inset-x-0 z-50 flex justify-center pointer-events-none">
            <motion.button
              type="button"
              onClick={open}
              className="pointer-events-auto flex items-center gap-3 rounded-full border bg-background px-5 py-3 shadow-lg"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
              whileTap={{ scale: 0.95 }}
            >
              <MessageCircle className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">
                {t("placeholder")}
              </span>
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* ── Expanded chat ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={close}
            />

            {/* Chat panel */}
            <motion.div
              className="fixed inset-4 top-20 bottom-4 z-50 sm:inset-x-[10%] sm:top-[10%] sm:bottom-[10%]"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            >
              <div className="relative flex h-full overflow-hidden rounded-2xl border bg-background shadow-2xl">
                {/* Sidebar — desktop */}
                {isAuthenticated && isVerified && (
                  <div
                    className="hidden sm:block shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out"
                    style={{ width: sidebarOpen ? "16rem" : "0px" }}
                  >
                    <div className="flex w-64 h-full flex-col border-r bg-muted/30">
                      <ChatHistorySidebar {...sidebarProps} />
                    </div>
                  </div>
                )}

                {/* Sidebar — mobile overlay */}
                <AnimatePresence>
                  {isAuthenticated && isVerified && sidebarOpen && (
                    <>
                      <motion.div
                        className="absolute inset-0 z-10 bg-black/40 sm:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                      />
                      <motion.div
                        className="absolute inset-y-0 left-0 z-20 flex w-64 flex-col rounded-l-2xl bg-background shadow-lg sm:hidden"
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      >
                        <ChatHistorySidebar
                          {...sidebarProps}
                          onSelect={() => setSidebarOpen(false)}
                        />
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                {/* Main chat area */}
                <div className="flex flex-1 flex-col min-w-0">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isAuthenticated && isVerified && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setSidebarOpen((p) => !p)}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      )}
                      <MessageCircle className="h-5 w-5" />
                      <h2 className="font-semibold">{t("title")}</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={close}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-h-0 overflow-hidden">
                    {isAuthenticated && isVerified ? (
                      <ChatMessages />
                    ) : isAuthenticated && !isVerified ? (
                      <div className="flex flex-1 h-full flex-col items-center justify-center gap-4 p-8 text-center">
                        <MessageCircle className="h-10 w-10 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {t("notVerified")}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-1 h-full flex-col items-center justify-center gap-4 p-8 text-center">
                        <MessageCircle className="h-10 w-10 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {tAuth("signInToUseAI")}
                        </p>
                        <Button onClick={() => signIn("google")}>
                          {tAuth("signInGoogle")}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  {isAuthenticated && isVerified && (
                    <form
                      onSubmit={handleSubmit}
                      className="flex items-center gap-2 border-t p-3"
                    >
                      <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t("placeholder")}
                        className="flex-1 border-0 bg-transparent focus-visible:ring-0"
                      />
                      <Button
                        type="submit"
                        size="icon"
                        disabled={!input.trim() || isLoading}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
