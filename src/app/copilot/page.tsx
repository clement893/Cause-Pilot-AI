"use client";

import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { sanitizeHTML } from "@/lib/sanitize";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Suggestion {
  text: string;
  icon: string;
}

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSuggestions();
    // Message de bienvenue
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `# 👋 Bienvenue dans le Copilote IA

Je suis votre assistant intelligent pour Nucleus Cause. Je peux vous aider à :

- **Analyser** vos données de donateurs et de dons
- **Rechercher** des informations spécifiques
- **Générer** des recommandations personnalisées
- **Répondre** à vos questions sur votre base de données

Posez-moi une question ou cliquez sur une suggestion ci-dessous pour commencer !`,
        timestamp: new Date(),
      },
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchSuggestions = async () => {
    try {
      const response = await fetch("/api/copilot/chat");
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.data.suggestions);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.data.message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error("Failed to get response");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Désolé, une erreur s&apos;est produite. Veuillez réessayer.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    sendMessage(suggestion.text);
  };

  const renderMarkdown = (content: string) => {
    // Simple markdown rendering
    let html = content
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-white mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-white mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-white mt-2 mb-3">$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
      // Tables
      .replace(/\|(.+)\|/g, (match) => {
        const cells = match.split("|").filter((c) => c.trim());
        if (cells.every((c) => c.trim().match(/^[-:]+$/))) {
          return ""; // Skip separator row
        }
        const isHeader = match.includes("---");
        const cellTag = isHeader ? "th" : "td";
        const cellClass = isHeader
          ? "px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
          : "px-3 py-2 text-sm text-foreground";
        return `<tr>${cells.map((c) => `<${cellTag} class="${cellClass}">${c.trim()}</${cellTag}>`).join("")}</tr>`;
      })
      // Line breaks
      .replace(/\n\n/g, "</p><p class='mb-3'>")
      .replace(/\n/g, "<br/>");

    // Wrap tables
    if (html.includes("<tr>")) {
      html = html.replace(
        /(<tr>[\s\S]*?<\/tr>)+/g,
        '<div class="overflow-x-auto my-4"><table class="min-w-full divide-y divide-slate-700"><tbody class="divide-y divide-slate-800">$&</tbody></table></div>'
      );
    }

    return html;
  };

  return (
    <AppLayout breadcrumbs={[{ name: "Copilote IA" }]}>
      <div className="flex flex-col h-[calc(100vh-120px)]">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Copilote IA</h1>
              <p className="text-sm text-muted-foreground">Votre assistant intelligent pour la gestion philanthropique</p>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 bg-surface-primary rounded-xl border border-border overflow-hidden flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                      : "bg-surface-secondary text-gray-200"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div
                      className="prose prose-invert prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: sanitizeHTML(renderMarkdown(message.content)) }}
                    />
                  ) : (
                    <p>{message.content}</p>
                  )}
                  <p className={`text-xs mt-2 ${message.role === "user" ? "text-purple-200" : "text-text-tertiary"}`}>
                    {message.timestamp.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-surface-secondary rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-brand rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-brand rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && suggestions.length > 0 && (
            <div className="px-4 pb-4">
              <p className="text-xs text-text-tertiary mb-2">Suggestions :</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-2 bg-surface-secondary hover:bg-surface-tertiary border border-border rounded-lg text-sm text-foreground transition-colors flex items-center gap-2"
                  >
                    <span>{suggestion.icon}</span>
                    <span>{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question..."
                className="flex-1 px-4 py-3 bg-surface-secondary border border-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Envoyer
              </button>
            </form>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => sendMessage("Montre-moi les statistiques")}
            className="p-4 bg-surface-primary border border-border rounded-xl hover:bg-surface-secondary transition-colors text-left"
          >
            <div className="w-10 h-10 bg-info/20 rounded-lg flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-info-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white">Statistiques</p>
            <p className="text-xs text-text-tertiary">Vue d&apos;ensemble</p>
          </button>

          <button
            onClick={() => sendMessage("Qui sont les top 5 donateurs ?")}
            className="p-4 bg-surface-primary border border-border rounded-xl hover:bg-surface-secondary transition-colors text-left"
          >
            <div className="w-10 h-10 bg-warning/20 rounded-lg flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white">Top Donateurs</p>
            <p className="text-xs text-text-tertiary">Les meilleurs contributeurs</p>
          </button>

          <button
            onClick={() => sendMessage("Quels sont les derniers dons ?")}
            className="p-4 bg-surface-primary border border-border rounded-xl hover:bg-surface-secondary transition-colors text-left"
          >
            <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-success-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white">Dons Récents</p>
            <p className="text-xs text-text-tertiary">Dernières contributions</p>
          </button>

          <button
            onClick={() => sendMessage("Que me recommandes-tu ?")}
            className="p-4 bg-surface-primary border border-border rounded-xl hover:bg-surface-secondary transition-colors text-left"
          >
            <div className="w-10 h-10 bg-brand/20 rounded-lg flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-brand-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white">Recommandations</p>
            <p className="text-xs text-text-tertiary">Conseils personnalisés</p>
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
