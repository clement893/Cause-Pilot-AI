"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Loader2,
  ChevronDown,
  Lightbulb,
} from "lucide-react";
import CausePilotAvatar from "./CausePilotAvatar";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface CausePilotChatProps {
  currentPage?: string;
}

export default function CausePilotChat({ currentPage = "dashboard" }: CausePilotChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Comment augmenter mes dons ?",
    "Conseils pour ma prochaine campagne",
    "Comment fidéliser mes donateurs ?",
  ]);
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    setShowWelcome(false);
    const userMessage: Message = {
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/causepilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context: { page: currentPage },
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Désolé, je rencontre un problème technique. Réessayez dans quelques instants.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  return (
    <>
      {/* Floating Button with Avatar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 group"
        title="Parler à CausePilot"
      >
        <div className={`relative transition-transform duration-300 ${isOpen ? 'scale-90' : 'hover:scale-110'}`}>
          <CausePilotAvatar size="lg" animated={!isOpen} />
          {!isOpen && (
            <>
              {/* Notification badge */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center animate-bounce">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
              {/* Tooltip */}
              <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-surface-secondary text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg border border-border">
                Besoin d&apos;aide ? Demandez à CausePilot !
                <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-surface-secondary border-r border-b border-border" />
              </div>
            </>
          )}
          {isOpen && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-primary/80 rounded-full">
              <ChevronDown className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-surface-primary rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CausePilotAvatar size="sm" animated={false} />
              <div>
                <h3 className="font-bold text-white">CausePilot</h3>
                <p className="text-xs text-white/80">Votre assistant fundraising</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96 min-h-[300px]">
            {/* Welcome Message */}
            {showWelcome && messages.length === 0 && (
              <div className="text-center py-6">
                <div className="mx-auto mb-4">
                  <CausePilotAvatar size="xl" animated={true} />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">
                  Bonjour ! Je suis CausePilot 👋
                </h4>
                <p className="text-muted-foreground text-sm mb-4">
                  Je suis là pour vous aider à maximiser vos collectes de fonds.
                  Posez-moi vos questions !
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-text-tertiary">
                  <Lightbulb className="w-4 h-4" />
                  <span>Suggestions ci-dessous</span>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                      : "bg-surface-secondary text-gray-200"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-2">
                      <CausePilotAvatar size="sm" animated={false} className="w-6 h-6" />
                      <span className="text-xs font-medium text-accent">CausePilot</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-surface-secondary rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <CausePilotAvatar size="sm" animated={true} className="w-6 h-6" />
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-accent animate-spin" />
                      <span className="text-sm text-muted-foreground">CausePilot réfléchit...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {!isLoading && suggestions.length > 0 && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-xs px-3 py-1.5 bg-surface-secondary hover:bg-surface-tertiary text-foreground rounded-full transition-colors border border-border"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-border">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question..."
                className="flex-1 bg-surface-secondary border border-border rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent text-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:from-pink-600 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
