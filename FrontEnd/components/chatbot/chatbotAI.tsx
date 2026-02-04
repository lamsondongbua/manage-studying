"use client";

import { useState, useRef, useEffect } from "react";
import { useChatbot } from "@/contexts/chatbot-context";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";
import './chatbotAI.css'

export default function ChatbotResponsive() {
  const { messages, sendMessage, isLoading } = useChatbot();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto focus input khi mở chat
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const msg = input.trim();
    setInput("");
    await sendMessage(msg);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button - Fixed position */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed chatbot-fab right-4  md:right-6 z-50 rounded-full p-3 md:p-4 shadow-xl transition-all duration-300 transform hover:scale-110 ${
          isOpen
            ? "bg-red-500 hover:bg-red-600 rotate-90"
            : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        }`}
        aria-label={isOpen ? "Đóng chatbot" : "Mở chatbot"}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <div className="relative">
            <MessageCircle className="h-6 w-6 text-white" />
            {/* Pulse effect */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
            </span>
          </div>
        )}
      </button>

      {/* Chat Window - Responsive */}
      {isOpen && (
        <>
          {/* Backdrop cho mobile */}
          <div
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-x-0 chatbot-window md:right-6 md:left-auto z-50 flex flex-col bg-white shadow-2xl md:h-[550px] md:w-[400px] md:rounded-lg h-[85vh] animate-in slide-in-from-bottom-8 md:slide-in-from-bottom-5 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-4 text-white md:rounded-t-lg">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Sparkles className="h-6 w-6" />
                  <span className="absolute -bottom-1 -right-1 flex h-3 w-3 rounded-full bg-green-400 border-2 border-white"></span>
                </div>
                <div>
                  <h3 className="font-bold text-base">AI Study Assistant</h3>
                  <p className="text-xs text-white/80">
                    Luôn sẵn sàng hỗ trợ bạn 🍅
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="md:hidden p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 bg-gradient-to-b from-gray-50 to-white form-container">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center space-y-4 px-4">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                      <MessageCircle className="h-10 w-10 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">
                        Chào bạn! 👋
                      </h4>
                      <p className="text-sm text-gray-600">
                        Tôi là trợ lý AI của Pomodoro
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Hỏi tôi về tiến độ học tập nhé!
                      </p>
                    </div>

                    {/* Suggestion chips */}
                    <div className="flex flex-wrap gap-2 justify-center pt-4">
                      <button
                        onClick={() =>
                          setInput("Hôm nay tôi học được bao lâu?")
                        }
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs rounded-full transition-colors"
                      >
                        📊 Tiến độ hôm nay
                      </button>
                      <button
                        onClick={() =>
                          setInput("Cho tôi lời khuyên để tập trung hơn")
                        }
                        className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 text-xs rounded-full transition-colors"
                      >
                        💡 Lời khuyên
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    } animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    <div
                      className={`max-w-[85%] md:max-w-[80%] rounded-2xl px-4 py-2.5 ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                          : "bg-white text-gray-800 shadow-sm border border-gray-100"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {new Date().toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
                  <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      <span className="text-sm text-gray-500">
                        Đang suy nghĩ...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4 bg-white md:rounded-b-lg">
              <div className="flex gap-2 items-end">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập câu hỏi của bạn..."
                  disabled={isLoading}
                  className="flex-1 rounded-full border-2 border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:bg-gray-50 disabled:text-gray-400 transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-2.5 text-white transition-all hover:from-blue-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                  aria-label="Gửi tin nhắn"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>

              {/* Typing indicator */}
              <p className="text-xs text-gray-400 mt-2 text-center">
                Nhấn Enter để gửi tin nhắn
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
