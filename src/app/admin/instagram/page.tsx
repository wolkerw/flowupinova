"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Instagram,
  Search,
  Bot,
  UserCheck,
  Send,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  User,
  ShieldAlert,
  Settings,
  HelpCircle,
  ExternalLink,
  MessageCircle,
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { InstagramMessage, InstagramChatSession } from "@/lib/types/instagram";
import type { WhatsAppKnowledgeTopic } from "@/lib/types/whatsapp-knowledge";

export default function AdminInstagramPage() {
  const [activeTab, setActiveTab] = useState<"conversas" | "conhecimento" | "configuracoes">("conversas");

  // Estado das Conversas
  const [chats, setChats] = useState<InstagramChatSession[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [selectedChat, setSelectedChat] = useState<InstagramChatSession | null>(null);
  const [messages, setMessages] = useState<InstagramMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [updatingAiToggle, setUpdatingAiToggle] = useState(false);
  const [filter, setFilter] = useState<"all" | "ai" | "human">("all");
  const [search, setSearch] = useState("");

  // Estado da Central de Conhecimento
  const [topics, setTopics] = useState<WhatsAppKnowledgeTopic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [editingTopic, setEditingTopic] = useState<WhatsAppKnowledgeTopic | null>(null);
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [savingTopic, setSavingTopic] = useState(false);
  const [topicForm, setTopicForm] = useState({
    title: "",
    category: "planos" as WhatsAppKnowledgeTopic["category"],
    content: "",
    isActive: true,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Busca lista de conversas
  const fetchChats = useCallback(async () => {
    setLoadingChats(true);
    try {
      const res = await fetch("/api/admin/instagram");
      if (res.status === 403 || res.status === 401) {
        window.location.href = `/acesso/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setChats(data.chats || []);
      }
    } catch (err) {
      console.error("Erro ao carregar conversas do Instagram:", err);
    } finally {
      setLoadingChats(false);
    }
  }, []);

  // Busca tópicos da Central de Conhecimento
  const fetchKnowledge = useCallback(async () => {
    setLoadingTopics(true);
    try {
      const res = await fetch("/api/admin/whatsapp/knowledge");
      if (res.ok) {
        const data = await res.json();
        setTopics(data.topics || []);
      }
    } catch (err) {
      console.error("Erro ao carregar central de conhecimento:", err);
    } finally {
      setLoadingTopics(false);
    }
  }, []);

  // Busca mensagens de uma conversa específica
  const loadMessages = useCallback(async (chat: InstagramChatSession) => {
    setSelectedChat(chat);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/admin/instagram?senderId=${chat.senderId || chat.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Erro ao carregar mensagens do chat:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicForm.title.trim() || !topicForm.content.trim() || savingTopic) return;

    setSavingTopic(true);
    try {
      const payload = {
        id: editingTopic?.id,
        category: topicForm.category,
        title: topicForm.title.trim(),
        content: topicForm.content.trim(),
        isActive: topicForm.isActive,
      };

      const res = await fetch("/api/admin/whatsapp/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsCreatingTopic(false);
        setEditingTopic(null);
        setTopicForm({ title: "", category: "planos", content: "", isActive: true });
        fetchKnowledge();
      }
    } catch (err) {
      console.error("Erro ao salvar tópico:", err);
    } finally {
      setSavingTopic(false);
    }
  };

  const handleDeleteTopic = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta informação da base de conhecimento da Maia?")) return;

    try {
      const res = await fetch(`/api/admin/whatsapp/knowledge?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchKnowledge();
      }
    } catch (err) {
      console.error("Erro ao excluir tópico:", err);
    }
  };

  useEffect(() => {
    fetchChats();
    fetchKnowledge();
  }, [fetchChats, fetchKnowledge]);

  // Scroll automático para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Alternar controle de IA
  const handleToggleAi = async () => {
    if (!selectedChat) return;
    setUpdatingAiToggle(true);
    const newAiState = !selectedChat.aiEnabled;

    try {
      const res = await fetch("/api/admin/instagram", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: selectedChat.senderId || selectedChat.id,
          aiEnabled: newAiState,
        }),
      });

      if (res.ok) {
        const updatedChat: InstagramChatSession = {
          ...selectedChat,
          aiEnabled: newAiState,
          humanTakeover: !newAiState,
          status: newAiState ? "active" : "waiting_human",
        };
        setSelectedChat(updatedChat);
        setChats((prev) =>
          prev.map((c) =>
            (c.senderId || c.id) === (selectedChat.senderId || selectedChat.id) ? updatedChat : c
          )
        );
      }
    } catch (err) {
      console.error("Erro ao alternar modo de IA:", err);
    } finally {
      setUpdatingAiToggle(false);
    }
  };

  // Envio de mensagem manual de atendente humano
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !inputText.trim() || sendingMessage) return;

    const textToSend = inputText.trim();
    setInputText("");
    setSendingMessage(true);

    try {
      const res = await fetch("/api/admin/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: selectedChat.senderId || selectedChat.id,
          message: textToSend,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        }

        const updatedChat: InstagramChatSession = {
          ...selectedChat,
          lastMessageText: textToSend,
          lastMessageAt: new Date().toISOString(),
          aiEnabled: false,
          humanTakeover: true,
          status: "waiting_human",
        };
        setSelectedChat(updatedChat);
        setChats((prev) =>
          prev.map((c) =>
            (c.senderId || c.id) === (selectedChat.senderId || selectedChat.id) ? updatedChat : c
          )
        );
      }
    } catch (err) {
      console.error("Erro ao enviar mensagem manual:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  // Filtros de busca
  const filteredChats = chats.filter((c) => {
    const matchesSearch =
      (c.contactName || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.username || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.lastMessageText || "").toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === "ai") return c.aiEnabled && !c.humanTakeover;
    if (filter === "human") return c.humanTakeover || !c.aiEnabled;
    return true;
  });

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-slate-50">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white shadow-md">
              <Instagram className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Atendimento Instagram Direct</h1>
              <p className="text-xs text-slate-500">
                Gerencie conversas de seguidores, controle o chatbot com IA e responda manualmente
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
              <button
                onClick={() => setActiveTab("conversas")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all",
                  activeTab === "conversas"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Conversas
                {chats.length > 0 && (
                  <span className="ml-1 rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] text-slate-700">
                    {chats.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("conhecimento")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all",
                  activeTab === "conhecimento"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Central de Conhecimento
                {topics.length > 0 && (
                  <span className="ml-1 rounded-full bg-pink-100 px-1.5 py-0.2 text-[10px] text-pink-700 font-bold">
                    {topics.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("configuracoes")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all",
                  activeTab === "configuracoes"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Settings className="h-3.5 w-3.5" />
                Instruções de Conexão
              </button>
            </div>

            <button
              onClick={fetchChats}
              disabled={loadingChats}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              title="Atualizar conversas"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loadingChats && "animate-spin")} />
              Atualizar
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      {activeTab === "conversas" ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Coluna Esquerda: Lista de Conversas */}
          <div className="flex w-full flex-col border-r border-slate-200 bg-white md:w-80 lg:w-96">
            {/* Campo de Busca */}
            <div className="border-b border-slate-100 p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou mensagem..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-pink-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
              </div>

              {/* Filtros Rápidos */}
              <div className="mt-2 flex gap-1 text-[11px]">
                <button
                  onClick={() => setFilter("all")}
                  className={cn(
                    "rounded-md px-2.5 py-1 font-medium transition",
                    filter === "all"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  Todos ({chats.length})
                </button>
                <button
                  onClick={() => setFilter("ai")}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition",
                    filter === "ai"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  <Bot className="h-3 w-3" />
                  IA Ativa
                </button>
                <button
                  onClick={() => setFilter("human")}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition",
                    filter === "human"
                      ? "bg-amber-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  <UserCheck className="h-3 w-3" />
                  Humano
                </button>
              </div>
            </div>

            {/* Lista com Scroll */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loadingChats ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <Instagram className="h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-semibold text-slate-600">Nenhuma conversa encontrada</p>
                  <p className="mt-1 text-xs">
                    As mensagens recebidas no direct do Instagram aparecerão aqui em tempo real.
                  </p>
                </div>
              ) : (
                filteredChats.map((chat) => {
                  const isSelected = (selectedChat?.senderId || selectedChat?.id) === (chat.senderId || chat.id);
                  const isAiControlled = chat.aiEnabled && !chat.humanTakeover;

                  return (
                    <button
                      key={chat.senderId || chat.id}
                      onClick={() => loadMessages(chat)}
                      className={cn(
                        "w-full text-left p-3.5 transition flex items-start gap-3 hover:bg-slate-50",
                        isSelected && "bg-pink-50/50 border-l-4 border-pink-500"
                      )}
                    >
                      <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 text-white text-xs font-bold shadow-sm">
                        {chat.contactName?.slice(0, 2).toUpperCase() || "IG"}
                        {isAiControlled ? (
                          <span
                            className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white text-[9px]"
                            title="Respondido por IA"
                          >
                            <Bot className="h-2.5 w-2.5" />
                          </span>
                        ) : (
                          <span
                            className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white text-[9px]"
                            title="Atendimento Humano"
                          >
                            <User className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {chat.contactName || chat.username}
                          </h4>
                          <span className="text-[10px] text-slate-400 flex-shrink-0">
                            {chat.lastMessageAt
                              ? new Date(chat.lastMessageAt).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                        </div>

                        <p className="mt-0.5 text-xs text-slate-500 truncate">
                          {chat.lastMessageText || "Nenhuma mensagem"}
                        </p>

                        <div className="mt-1 flex items-center gap-1.5">
                          {isAiControlled ? (
                            <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                              <Sparkles className="h-2.5 w-2.5" /> IA Ativa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                              <UserCheck className="h-2.5 w-2.5" /> Humano
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

          {/* Coluna Direita: Área de Mensagens */}
          <div className="flex flex-1 flex-col bg-slate-100">
            {selectedChat ? (
              <>
                {/* Header do Chat */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 text-white text-xs font-bold shadow-sm">
                      {selectedChat.contactName?.slice(0, 2).toUpperCase() || "IG"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          {selectedChat.contactName || selectedChat.username}
                        </h3>
                        <span className="text-[11px] text-slate-400">ID: {selectedChat.senderId || selectedChat.id}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Status:{" "}
                        <span className="font-semibold text-slate-700">
                          {selectedChat.aiEnabled && !selectedChat.humanTakeover
                            ? "🤖 IA Maia respondendo automaticamente"
                            : "👤 Atendimento Humano em andamento"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Toggle de IA */}
                  <button
                    onClick={handleToggleAi}
                    disabled={updatingAiToggle}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold shadow-sm transition disabled:opacity-50",
                      selectedChat.aiEnabled && !selectedChat.humanTakeover
                        ? "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                        : "border border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100"
                    )}
                  >
                    {updatingAiToggle ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : selectedChat.aiEnabled && !selectedChat.humanTakeover ? (
                      <>
                        <UserCheck className="h-3.5 w-3.5 text-amber-600" />
                        Assumir Atendimento (Pausar IA)
                      </>
                    ) : (
                      <>
                        <Bot className="h-3.5 w-3.5 text-blue-600" />
                        Ativar IA Maia
                      </>
                    )}
                  </button>
                </div>

                {/* Histórico de Mensagens */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {loadingMessages ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-slate-400">
                      <p className="text-xs">Nenhuma mensagem registrada nesta conversa.</p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isUser = m.role === "user";
                      const isAssistant = m.role === "assistant";
                      const isAdmin = m.role === "admin";

                      return (
                        <div
                          key={m.id}
                          className={cn(
                            "flex flex-col max-w-[80%] md:max-w-[70%]",
                            isUser ? "mr-auto items-start" : "ml-auto items-end"
                          )}
                        >
                          <div className="mb-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                            {isUser && <span>{selectedChat.contactName || "Seguidor"}</span>}
                            {isAssistant && (
                              <span className="flex items-center gap-1 font-semibold text-blue-600">
                                <Sparkles className="h-3 w-3" /> Maia (NumVapt IA)
                              </span>
                            )}
                            {isAdmin && (
                              <span className="flex items-center gap-1 font-semibold text-emerald-600">
                                <User className="h-3 w-3" /> Atendente Humano
                              </span>
                            )}
                            <span>•</span>
                            <span>
                              {m.timestamp
                                ? new Date(m.timestamp).toLocaleTimeString("pt-BR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </span>
                          </div>

                          <div
                            className={cn(
                              "rounded-2xl px-4 py-3 text-sm shadow-sm whitespace-pre-wrap leading-relaxed",
                              isUser && "rounded-tl-none bg-white text-slate-800 border border-slate-200/80",
                              isAssistant &&
                                "rounded-tr-none bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-200/60 text-slate-900 font-normal",
                              isAdmin && "rounded-tr-none bg-emerald-600 text-white"
                            )}
                          >
                            {m.text}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input de Envio Manual */}
                <form
                  onSubmit={handleSendMessage}
                  className="border-t border-slate-200 bg-white p-4 shadow-sm flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="Digite uma mensagem como Atendente Humano (isto pausará a IA)..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={sendingMessage}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-pink-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-500 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || sendingMessage}
                    className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-4 text-xs font-semibold text-white shadow-md transition hover:from-pink-500 hover:to-purple-500 disabled:opacity-50"
                  >
                    {sendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>Enviar</span>
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-400">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200/80 text-slate-400 mb-4">
                  <Instagram className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-slate-700">Nenhuma conversa selecionada</h3>
                <p className="mt-1 max-w-sm text-xs text-slate-500">
                  Clique em qualquer conversa na coluna à esquerda para ler o histórico, enviar mensagens manuais ou alternar o modo da IA.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === "conhecimento" ? (
        /* Aba da Central de Conhecimento Compartilhada */
        <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full space-y-6">
          {/* Header da Central */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-pink-500" />
                Base de Conhecimento Compartilhada (WhatsApp &amp; Instagram)
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Alimente aqui todas as informações, tabelas de preços, regras e promoções. A IA Maia consulta esta mesma base no Firestore em tempo real para responder seguidores no Instagram Direct e clientes no WhatsApp.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingTopic(null);
                setTopicForm({ title: "", category: "planos", content: "", isActive: true });
                setIsCreatingTopic(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:from-pink-500 hover:to-purple-500 transition shrink-0"
            >
              <Plus className="h-4 w-4" />
              Adicionar Novo Tópico
            </button>
          </div>

          {/* Modal / Formulário de Criação ou Edição */}
          {isCreatingTopic && (
            <div className="p-6 rounded-2xl border border-pink-200 bg-white shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Edit2 className="h-4 w-4 text-pink-600" />
                  {editingTopic ? "Editar Tópico de Conhecimento" : "Novo Tópico de Informação"}
                </h3>
                <button
                  onClick={() => {
                    setIsCreatingTopic(false);
                    setEditingTopic(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveTopic} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Título do Tópico</label>
                    <input
                      type="text"
                      placeholder="Ex: Tabela de Preços, Regras de Pagamento, etc."
                      value={topicForm.title}
                      onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-pink-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Categoria</label>
                    <select
                      value={topicForm.category}
                      onChange={(e) => setTopicForm({ ...topicForm, category: e.target.value as any })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-pink-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                    >
                      <option value="planos">Planos &amp; Preços</option>
                      <option value="contrato">Contrato &amp; Garantia</option>
                      <option value="empresa">Sobre a NumVapt</option>
                      <option value="promocoes">Promoções</option>
                      <option value="duvidas">Dúvidas Frequentes</option>
                      <option value="outros">Outros Assuntos</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Conteúdo Explicativo para a IA</label>
                  <textarea
                    rows={4}
                    placeholder="Descreva detalhadamente a regra ou informação para a IA consultar..."
                    value={topicForm.content}
                    onChange={(e) => setTopicForm({ ...topicForm, content: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-pink-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-500 font-mono"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={topicForm.isActive}
                      onChange={(e) => setTopicForm({ ...topicForm, isActive: e.target.checked })}
                      className="rounded border-slate-300 text-pink-600 focus:ring-pink-500 h-4 w-4"
                    />
                    <span className="text-xs font-medium text-slate-700">Tópico Ativo (disponível para a IA)</span>
                  </label>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingTopic(false);
                        setEditingTopic(null);
                      }}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={savingTopic}
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:from-pink-500 hover:to-purple-500 disabled:opacity-50"
                    >
                      {savingTopic ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Salvar Tópico
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Lista de Tópicos */}
          <div className="space-y-3">
            {loadingTopics ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
              </div>
            ) : topics.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium">Nenhum tópico cadastrado na central de conhecimento.</p>
              </div>
            ) : (
              topics.map((t) => (
                <div
                  key={t.id}
                  className={cn(
                    "p-5 rounded-2xl border transition bg-white shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-4",
                    t.isActive ? "border-slate-200" : "border-slate-200/60 opacity-60 bg-slate-50/50"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="rounded-full bg-pink-50 border border-pink-200 px-2 py-0.5 text-[10px] font-bold text-pink-700 uppercase tracking-wider">
                        {t.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{t.title}</h4>
                      {!t.isActive && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                      {t.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                    <button
                      onClick={() => {
                        setEditingTopic(t);
                        setTopicForm({
                          title: t.title,
                          category: t.category,
                          content: t.content,
                          isActive: t.isActive,
                        });
                        setIsCreatingTopic(true);
                      }}
                      className="p-2 rounded-lg text-slate-500 hover:text-pink-600 hover:bg-pink-50 transition"
                      title="Editar Tópico"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTopic(t.id)}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                      title="Excluir Tópico"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Aba de Configurações e Instruções da Meta */
        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Settings className="h-5 w-5 text-pink-600" />
              Instruções de Configuração no Meta for Developers
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Siga estes passos para conectar a conta oficial `@numvapt` do Instagram ao webhook do app ou ao n8n:
            </p>

            <div className="mt-6 space-y-4 text-xs text-slate-700">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="font-bold text-slate-900 block mb-1">1. URL do Webhook da NumVapt</span>
                <code className="rounded bg-slate-200 px-2 py-1 text-slate-900 select-all font-mono text-[11px]">
                  https://numvapt.com.br/api/webhooks/instagram
                </code>
                <p className="mt-1.5 text-slate-500 text-[11px]">
                  Cole essa URL no campo <strong>Callback URL</strong> do produto <em>Webhooks &gt; Instagram</em> no seu painel da Meta.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="font-bold text-slate-900 block mb-1">2. Token de Verificação (Verify Token)</span>
                <code className="rounded bg-slate-200 px-2 py-1 text-slate-900 select-all font-mono text-[11px]">
                  numvapt_instagram_verify_token
                </code>
                <p className="mt-1.5 text-slate-500 text-[11px]">
                  Insira este valor no campo <strong>Verify Token</strong> na Meta.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="font-bold text-slate-900 block mb-1">3. Campos de Inscrição no Webhook</span>
                <p className="text-slate-600 mb-2">
                  No painel do Webhook na Meta, marque o campo:
                </p>
                <div className="inline-block rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-emerald-800 font-semibold text-[11px]">
                  ✓ messages
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="font-bold text-slate-900 block mb-1">4. Variáveis de Ambiente no Servidor (.env)</span>
                <pre className="mt-2 rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto">
{`INSTAGRAM_VERIFY_TOKEN="numvapt_instagram_verify_token"
INSTAGRAM_PAGE_ACCESS_TOKEN="SEU_PAGE_ACCESS_TOKEN_DA_META"`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
