"use client";

import { createContext, useContext, useState } from "react";
import { useAppContext } from "@/contexts/app-context";
import { chatWithAI } from "../services/apiServices";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatbotContextType {
  messages: ChatMessage[];
  sendMessage: (msg: string) => Promise<void>;
  isLoading: boolean;
}

const ChatbotContext = createContext<ChatbotContextType | null>(null);

export const ChatbotProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const app = useAppContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (msg: string) => {
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setIsLoading(true);

    const activeSession = app.sessions.find(
      (s) => s.id === app.activeSessionId,
    );

    const context = {
      task: activeSession?.taskName ?? "No active task",
      pomodoroStatus: app.isBreakTime ? "break" : "focus",
      timeRemaining: app.isBreakTime
        ? app.breakTimeRemaining
        : app.sessionTimeRemaining,
      completedSessionsToday: app.completedSessionsCount,
    };

    try {
      const reply = await chatWithAI(msg, context);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatbotContext.Provider value={{ messages, sendMessage, isLoading }}>
      {children}
    </ChatbotContext.Provider>
  );
};

export const useChatbot = () => {
  const ctx = useContext(ChatbotContext);
  if (!ctx) throw new Error("useChatbot must be used inside ChatbotProvider");
  return ctx;
};
