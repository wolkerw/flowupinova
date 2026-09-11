"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  MessageSquare,
  Search,
  Bot,
  UserCheck,
  Send,
  RefreshCw,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  User,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WhatsAppMessage, WhatsAppChatSession } from "@/lib/types/whatsapp";

export default function AdminWhatsAppPage() {
  const [chats, setChats] = useState<WhatsAppChatSession[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [selectedChat, setSelectedChat] = useState<WhatsAppChatSession | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [updatingAiToggle, setUpdatingAiToggle] = useState(false);
  const [filter, setFilter] = useState<"all" | "ai" | "human">("all");
  const [search, setSearch] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchChats = useCallback(async () => {
    setLoadingChats(true);
    try {
      const res = await fetch("/api/admin/whatsapp");
      if (res.status === 403 || res.status === 401) {
        window.location.href = `/acesso/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setChats(data.chats || []);
      }
    } catch (err) {
      console.error("Erro ao carregar conversas do WhatsApp:", err);
    } finally {
      setLoadingChats(false);
    }
  }, []);

  const loadMessages = useCallback(async (chat: WhatsAppChatSession) => {
    setSelectedChat(chat);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/admin/whatsapp?phone=${chat.cleanPhone || chat.phone}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Erro ao carregar mensagens:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 12000);
    return () => clearInterval(interval);
  }, [fetchChats]);

  useEffect(() => {
    if (selectedChat) {
      const interval = setInterval(() => {
        loadMessages(selectedChat);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [selectedChat, loadMessages]);

  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleToggleAi = async (enable: boolean) => {
    if (!selectedChat) return;
    setUpdatingAiToggle(true);
    try {
      const res = await fetch("/api/admin/whatsapp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: selectedChat.cleanPhone || selectedChat.phone,
          aiEnabled: enable,
          status: enable ? "active" : "waiting_human",
        }),
      });

      if (res.ok) {
        setSelectedChat((prev) => (prev ? { ...prev, aiEnabled: enable, humanTakeover: !enable } : null));
        fetchChats();
      }
    } catch (err) {
      console.error("Erro ao alterar modo da IA:", err);
    } finally {
      setUpdatingAiToggle(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !inputText.trim() || sendingMessage) return;

    const text = inputText.trim();
    setSendingMessage(true);

    try {
      const res = await fetch("/api/admin/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: selectedChat.cleanPhone || selectedChat.phone,
          text,
        }),
      });

      if (res.ok) {
        setInputText("");
        // Recarrega mensagens
        await loadMessages(selectedChat);
        fetchChats();
      }
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredChats = chats.filter((chat) => {
    const term = search.toLowerCase();
    const matchesSearch =
      (chat.contactName || "").toLowerCase().includes(term) ||
      (chat.phone || "").includes(term) ||
      (chat.lastMessageText || "").toLowerCase().includes(term);

    if (!matchesSearch) return false;
    if (filter === "ai") return chat.aiEnabled !== false;
    if (filter === "human") return chat.humanTakeover || chat.status === "waiting_human";
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">Atendimento WhatsApp & IA</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400 border border-green-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Online
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Número oficial: <strong className="text-slate-200">(51) 92004-4035</strong> • Monitoramento e transbordo humano em tempo real
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchChats}
            disabled={loadingChats}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <RefreshCw className={cn("h-4 w-4", loadingChats && "animate-spin")} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Grid Principal: Lista à esquerda e Chat à direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px] rounded-2xl border border-slate-700/60 bg-slate-900 overflow-hidden shadow-xl">
        {/* Coluna Esquerda: Lista de Conversas (4 colunas) */}
        <div className="lg:col-span-4 border-r border-slate-700/60 flex flex-col h-full bg-slate-900/90">
          {/* Busca e Filtros */}
          <div className="p-4 border-b border-slate-700/60 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por cliente ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => setFilter("all")}
                className={cn(
                  "flex-1 py-1 text-xs rounded-lg font-medium transition-colors",
                  filter === "all" ? "bg-violet-600 text-white" : "text-slate-400 hover:bg-slate-800"
                )}
              >
                Todas ({chats.length})
              </button>
              <button
                onClick={() => setFilter("ai")}
                className={cn(
                  "flex-1 py-1 text-xs rounded-lg font-medium transition-colors",
                  filter === "ai" ? "bg-green-600 text-white" : "text-slate-400 hover:bg-slate-800"
                )}
              >
                Com IA
              </button>
              <button
                onClick={() => setFilter("human")}
                className={cn(
                  "flex-1 py-1 text-xs rounded-lg font-medium transition-colors",
                  filter === "human" ? "bg-amber-600 text-white" : "text-slate-400 hover:bg-slate-800"
                )}
              >
                Humano
              </button>
            </div>
          </div>

          {/* Lista Rolável */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
            {loadingChats && chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin text-violet-500 mb-2" />
                <span className="text-xs">Carregando conversas...</span>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500 px-4">
                Nenhuma conversa encontrada neste filtro.
              </div>
            ) : (
              filteredChats.map((chat) => {
                const isSelected = selectedChat?.phone === chat.phone;
                const isWaitingHuman = chat.humanTakeover || chat.status === "waiting_human";

                return (
                  <button
                    key={chat.phone}
                    onClick={() => loadMessages(chat)}
                    className={cn(
                      "w-full text-left p-3.5 transition-colors flex items-start gap-3 hover:bg-slate-800/60",
                      isSelected ? "bg-slate-800/90 border-l-4 border-violet-500" : ""
                    )}
                  >
                    <div className="h-10 w-10 shrink-0 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center text-sm font-bold text-violet-300">
                      {(chat.contactName || "C").charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs text-white truncate">
                          {chat.contactName || chat.phone}
                        </span>
                        {chat.lastMessageAt && (
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {new Date(chat.lastMessageAt).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {chat.lastMessageText || "Sem mensagens"}
                      </p>

                      <div className="flex items-center gap-1.5 mt-2">
                        {isWaitingHuman ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/20">
                            <AlertCircle className="h-2.5 w-2.5" /> Aguardando Atendente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400 border border-green-500/20">
                            <Sparkles className="h-2.5 w-2.5" /> IA Sara Ativa
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna Direita: Janela de Chat (8 colunas) */}
        <div className="lg:col-span-8 flex flex-col h-full bg-slate-950/60">
          {selectedChat ? (
            <>
              {/* Header do Chat */}
              <div className="p-4 border-b border-slate-700/60 bg-slate-900/60 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-violet-600 flex items-center justify-center font-bold text-white text-sm">
                    {(selectedChat.contactName || "C").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-white">{selectedChat.contactName}</h2>
                    <p className="text-xs text-slate-400 font-mono">{selectedChat.phone}</p>
                  </div>
                </div>

                {/* Controles de Modo IA / Humano */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-xl bg-slate-800 p-1 border border-slate-700">
                    <button
                      onClick={() => handleToggleAi(true)}
                      disabled={updatingAiToggle}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                        selectedChat.aiEnabled !== false
                          ? "bg-green-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      )}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      IA Ativa
                    </button>
                    <button
                      onClick={() => handleToggleAi(false)}
                      disabled={updatingAiToggle}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                        selectedChat.aiEnabled === false
                          ? "bg-amber-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      )}
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      Atendimento Humano
                    </button>
                  </div>
                </div>
              </div>

              {/* Área de Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin text-violet-500 mb-2" />
                    <span className="text-xs">Carregando histórico da conversa...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                    <span className="text-xs">Nenhuma mensagem registrada ainda.</span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isUser = msg.role === "user";
                    const isAi = msg.role === "assistant";
                    const isAdmin = msg.role === "admin";

                    return (
                      <div
                        key={msg.id}
                        className={cn("flex flex-col", isUser ? "items-start" : "items-end")}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-[10px] font-semibold text-slate-400">
                            {isUser ? msg.senderName || "Cliente" : isAi ? "Sara (NumVapt IA)" : "Atendente Humano"}
                          </span>
                          <span className="text-[9px] text-slate-500">
                            {new Date(msg.timestamp).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm",
                            isUser
                              ? "bg-slate-800 text-white border border-slate-700/80 rounded-tl-sm"
                              : isAi
                                ? "bg-[#0083C7] text-white rounded-tr-sm"
                                : "bg-violet-600 text-white rounded-tr-sm"
                          )}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Barra de Resposta Manual */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-700/60 bg-slate-900/80 flex gap-2">
                <input
                  type="text"
                  placeholder={
                    selectedChat.aiEnabled !== false
                      ? "Escreva para responder manualmente (a IA será pausada)..."
                      : "Digite sua resposta de atendente humano..."
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !inputText.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
                >
                  {sendingMessage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Enviar
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center">
              <MessageSquare className="h-12 w-12 text-slate-700 mb-3" />
              <h3 className="font-semibold text-slate-300 text-sm">Nenhuma conversa selecionada</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Selecione uma conversa na lista à esquerda para visualizar o histórico de mensagens, monitorar as respostas da IA ou assumir o atendimento manualmente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
