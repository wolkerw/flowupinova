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
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WhatsAppMessage, WhatsAppChatSession } from "@/lib/types/whatsapp";
import type { WhatsAppKnowledgeTopic } from "@/lib/types/whatsapp-knowledge";

export default function AdminWhatsAppPage() {
  const [activeTab, setActiveTab] = useState<"conversas" | "conhecimento">("conversas");

  // Estado das Conversas
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
  }, [fetchChats]);

  useEffect(() => {
    if (activeTab === "conhecimento") {
      fetchKnowledge();
    }
  }, [activeTab, fetchKnowledge]);

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
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: selectedChat.cleanPhone || selectedChat.phone,
          aiEnabled: enable,
        }),
      });

      if (res.ok) {
        setSelectedChat((prev) => (prev ? { ...prev, aiEnabled: enable } : null));
        setChats((prev) =>
          prev.map((c) =>
            (c.cleanPhone || c.phone) === (selectedChat.cleanPhone || selectedChat.phone)
              ? { ...c, aiEnabled: enable }
              : c
          )
        );
      }
    } catch (err) {
      console.error("Erro ao alterar modo da IA:", err);
    } finally {
      setUpdatingAiToggle(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedChat || sendingMessage) return;

    const currentText = inputText.trim();
    setInputText("");
    setSendingMessage(true);

    const tempMsg: WhatsAppMessage = {
      id: `temp_${Date.now()}`,
      role: "admin",
      text: currentText,
      timestamp: new Date().toISOString(),
      senderName: "Atendente Humano",
    };

    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch("/api/admin/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: selectedChat.cleanPhone || selectedChat.phone,
          message: currentText,
        }),
      });

      if (res.ok) {
        setSelectedChat((prev) => (prev ? { ...prev, aiEnabled: false } : null));
        setChats((prev) =>
          prev.map((c) =>
            (c.cleanPhone || c.phone) === (selectedChat.cleanPhone || selectedChat.phone)
              ? { ...c, aiEnabled: false, lastMessage: currentText, lastMessageAt: new Date().toISOString() }
              : c
          )
        );
      }
    } catch (err) {
      console.error("Erro ao enviar mensagem manual:", err);
    } finally {
      setSendingMessage(false);
    }
  };

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
        setTopics((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error("Erro ao excluir tópico:", err);
    }
  };

  const handleToggleTopicStatus = async (topic: WhatsAppKnowledgeTopic) => {
    try {
      const updated = !topic.isActive;
      setTopics((prev) => prev.map((t) => (t.id === topic.id ? { ...t, isActive: updated } : t)));

      await fetch("/api/admin/whatsapp/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...topic, isActive: updated }),
      });
    } catch (err) {
      console.error("Erro ao alternar status do tópico:", err);
      fetchKnowledge();
    }
  };

  const filteredChats = chats.filter((c) => {
    const displayName = c.senderName || (c as any).contactName || "";
    const matchesSearch =
      displayName.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || "").includes(search) ||
      (c.cleanPhone || "").includes(search);

    if (!matchesSearch) return false;
    if (filter === "ai") return c.aiEnabled !== false;
    if (filter === "human") return c.aiEnabled === false;
    return true;
  });

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "planos":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "contrato":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "promocoes":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "empresa":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "duvidas":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Superior */}
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
            Número oficial: <strong className="text-slate-200">(51) 92004-4035</strong> • Monitoramento e base de conhecimento da Maia
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Navegação de Abas */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab("conversas")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                activeTab === "conversas"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Conversas ao Vivo ({chats.length})
            </button>
            <button
              onClick={() => setActiveTab("conhecimento")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                activeTab === "conhecimento"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Central de Informações (Maia)
            </button>
          </div>

          <button
            onClick={() => (activeTab === "conversas" ? fetchChats() : fetchKnowledge())}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <RefreshCw className={cn("h-4 w-4", (loadingChats || loadingTopics) && "animate-spin")} />
            Atualizar
          </button>
        </div>
      </div>

      {/* CONTEÚDO DA ABA: CONVERSAS AO VIVO */}
      {activeTab === "conversas" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px] rounded-2xl border border-slate-700/60 bg-slate-900 overflow-hidden shadow-xl">
          {/* Coluna Esquerda: Lista de Conversas (4 colunas) */}
          <div className="lg:col-span-4 border-r border-slate-700/60 flex flex-col h-full bg-slate-900/90">
            {/* Barra de Busca e Filtros */}
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
                    filter === "ai" ? "bg-violet-600 text-white" : "text-slate-400 hover:bg-slate-800"
                  )}
                >
                  Com IA
                </button>
                <button
                  onClick={() => setFilter("human")}
                  className={cn(
                    "flex-1 py-1 text-xs rounded-lg font-medium transition-colors",
                    filter === "human" ? "bg-violet-600 text-white" : "text-slate-400 hover:bg-slate-800"
                  )}
                >
                  Humano
                </button>
              </div>
            </div>

            {/* Lista com scroll */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
              {loadingChats ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin mb-2" />
                  <span className="text-xs">Carregando conversas...</span>
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="text-center p-8 text-slate-500 text-xs">
                  Nenhuma conversa encontrada.
                </div>
              ) : (
                filteredChats.map((chat) => {
                  const isSelected =
                    selectedChat &&
                    (selectedChat.cleanPhone || selectedChat.phone) === (chat.cleanPhone || chat.phone);
                  const isWaitingHuman = chat.aiEnabled === false;

                  return (
                    <button
                      key={chat.id || chat.phone}
                      onClick={() => loadMessages(chat)}
                      className={cn(
                        "w-full text-left p-3.5 transition-colors flex items-start gap-3 hover:bg-slate-800/60",
                        isSelected ? "bg-slate-800/90 border-l-4 border-violet-500" : ""
                      )}
                    >
                      <div className="h-10 w-10 shrink-0 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center text-sm font-bold text-violet-300">
                        {chat.senderName || (chat as any).contactName ? (chat.senderName || (chat as any).contactName).charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-xs text-white truncate">
                            {chat.senderName || (chat as any).contactName || chat.phone}
                          </span>
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {chat.lastMessageAt
                              ? new Date(chat.lastMessageAt).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {chat.lastMessage || (chat as any).lastMessageText || "Nova conversa iniciada"}
                        </p>

                        <div className="flex items-center gap-1.5 mt-2">
                          {isWaitingHuman ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/20">
                              <AlertCircle className="h-2.5 w-2.5" /> Aguardando Atendente
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400 border border-green-500/20">
                              <Sparkles className="h-2.5 w-2.5" /> IA Maia Ativa
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
          <div className="lg:col-span-8 flex flex-col h-full bg-slate-900/50">
            {selectedChat ? (
              <>
                {/* Header do Chat Ativo */}
                <div className="p-4 border-b border-slate-700/60 bg-slate-900/90 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center text-sm font-bold text-violet-300">
                      {selectedChat.senderName || (selectedChat as any).contactName ? (
                        (selectedChat.senderName || (selectedChat as any).contactName).charAt(0).toUpperCase()
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        {selectedChat.senderName || (selectedChat as any).contactName || "Cliente WhatsApp"}
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Phone className="h-3 w-3" />
                        <span>{selectedChat.phone}</span>
                      </div>
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
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/40">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span className="text-xs">Carregando histórico...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
                      <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
                      Nenhuma mensagem registrada nesta conversa.
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
                              {isUser ? msg.senderName || "Cliente" : isAi ? "Maia (NumVapt IA)" : "Atendente Humano"}
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
                              "max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-md whitespace-pre-wrap leading-relaxed",
                              isUser
                                ? "bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700/80"
                                : isAi
                                ? "bg-gradient-to-br from-violet-700 to-indigo-800 text-white rounded-tr-sm border border-violet-600/40"
                                : "bg-emerald-700 text-white rounded-tr-sm border border-emerald-600/40"
                            )}
                          >
                            {msg.text}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input de Envio Manual */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-700/60 bg-slate-900/90 flex gap-2">
                  <input
                    type="text"
                    placeholder="Escreva para responder manualmente (pausará a IA automaticamente)..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={sendingMessage}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || !inputText.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 transition-colors disabled:opacity-50"
                  >
                    {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Enviar
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center">
                <div className="h-16 w-16 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mb-4 text-slate-400">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <h3 className="text-base font-semibold text-white mb-1">Nenhuma conversa selecionada</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Selecione uma conversa na coluna à esquerda para ver o histórico e responder manualmente.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA: CENTRAL DE INFORMAÇÕES DA MAIA */}
      {activeTab === "conhecimento" && (
        <div className="space-y-6">
          {/* Card Explicativo e Botão de Novo Tópico */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl border border-slate-700/60 bg-slate-900/80">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-400" />
                Base de Conhecimento Dinâmica da Maia
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Alimente aqui todas as informações, tabelas de preços, regras de contrato e promoções vigentes. A IA Maia consulta esta central em tempo real para responder aos clientes no WhatsApp.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingTopic(null);
                setTopicForm({ title: "", category: "planos", content: "", isActive: true });
                setIsCreatingTopic(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-700 transition-colors shadow-sm shrink-0"
            >
              <Plus className="h-4 w-4" />
              Adicionar Novo Tópico
            </button>
          </div>

          {/* Modal / Formulário de Criação ou Edição */}
          {isCreatingTopic && (
            <div className="p-5 rounded-2xl border border-violet-500/40 bg-slate-900/95 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Edit2 className="h-4 w-4 text-violet-400" />
                  {editingTopic ? "Editar Tópico de Conhecimento" : "Novo Tópico de Informação"}
                </h3>
                <button
                  onClick={() => {
                    setIsCreatingTopic(false);
                    setEditingTopic(null);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveTopic} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">Título do Tópico</label>
                    <input
                      type="text"
                      placeholder="Ex: Tabela de Preços, Regra de Parcelamento, etc."
                      value={topicForm.title}
                      onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                      required
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Categoria</label>
                    <select
                      value={topicForm.category}
                      onChange={(e) => setTopicForm({ ...topicForm, category: e.target.value as any })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
                    >
                      <option value="planos">Planos & Preços</option>
                      <option value="contrato">Contrato & Garantia</option>
                      <option value="promocoes">Promoções Atuais</option>
                      <option value="empresa">Sobre a Empresa</option>
                      <option value="duvidas">Dúvidas Frequentes</option>
                      <option value="outros">Outros</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Conteúdo e Instruções para a IA</label>
                  <textarea
                    rows={4}
                    placeholder="Descreva detalhadamente os dados que a Maia deve utilizar ao falar sobre este assunto..."
                    value={topicForm.content}
                    onChange={(e) => setTopicForm({ ...topicForm, content: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-xs text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={topicForm.isActive}
                      onChange={(e) => setTopicForm({ ...topicForm, isActive: e.target.checked })}
                      className="rounded border-slate-700 text-violet-600 focus:ring-violet-500"
                    />
                    Tópico Ativo (a Maia pode usar imediatamente nas respostas)
                  </label>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingTopic(false);
                        setEditingTopic(null);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white border border-slate-700"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={savingTopic}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
                    >
                      {savingTopic ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Salvar Informação
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Grid de Tópicos Cadastrados */}
          {loadingTopics ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin mb-2" />
              <span className="text-xs">Carregando base de informações da Maia...</span>
            </div>
          ) : topics.length === 0 ? (
            <div className="p-8 rounded-2xl border border-slate-700/60 bg-slate-900/60 text-center text-slate-400 text-xs">
              Nenhum tópico cadastrado ainda. Clique no botão acima para adicionar a primeira informação!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all flex flex-col justify-between bg-slate-900/80 shadow-md",
                    topic.isActive ? "border-slate-700/80" : "border-slate-800 opacity-60"
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider", getCategoryBadge(topic.category))}>
                        {topic.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleTopicStatus(topic)}
                          title={topic.isActive ? "Desativar tópico" : "Ativar tópico"}
                          className={cn(
                            "px-2 py-0.5 text-[10px] font-semibold rounded-full border transition-all",
                            topic.isActive
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : "bg-slate-700 text-slate-400 border-slate-600"
                          )}
                        >
                          {topic.isActive ? "Ativo" : "Inativo"}
                        </button>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-2">{topic.title}</h4>
                    <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                      {topic.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-800 text-[10px] text-slate-500">
                    <span>Atualizado em: {new Date(topic.updatedAt).toLocaleDateString("pt-BR")}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingTopic(topic);
                          setTopicForm({
                            title: topic.title,
                            category: topic.category,
                            content: topic.content,
                            isActive: topic.isActive,
                          });
                          setIsCreatingTopic(true);
                        }}
                        className="text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        <Edit2 className="h-3 w-3" /> Editar
                      </button>
                      <button
                        onClick={() => handleDeleteTopic(topic.id)}
                        className="text-red-400 hover:text-red-300 flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" /> Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
