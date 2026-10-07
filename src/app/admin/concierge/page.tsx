"use client";

import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  Clock,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  Search,
  Filter,
  Sparkles,
  User,
  Share2,
  RefreshCw,
  Phone,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ConciergePostItem {
  id: string;
  userId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  text: string;
  imageUrl: string | null;
  imageUrls: string[];
  isCarousel: boolean;
  platforms: string[];
  status: string;
  scheduledAt: string | null;
  createdAt: string | null;
  approval: {
    approvalToken: string;
    tokenExpiresAt: string;
    status: string;
    requestedAt?: string;
    reviewedAt?: string;
    reviewerFeedback?: string;
  } | null;
  magicLinkUrl: string | null;
}

export default function AdminConciergePage() {
  const [posts, setPosts] = useState<ConciergePostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchConciergeData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/concierge");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do concierge:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConciergeData();
  }, []);

  const handleCopyLink = (url: string, token: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 3000);
  };

  const handleSendWhatsApp = (phone: string | undefined, url: string, clientName: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    const cleanPhone = phone?.replace(/\D/g, "") || "";
    const message = encodeURIComponent(
      `Olá, ${clientName}! 👋\n\nSua nova publicação criada pela equipe NumVapt já está pronta para sua revisão.\n\nClique no link abaixo para visualizar as artes e aprovar com 1 clique:\n${fullUrl}`
    );
    const waUrl = cleanPhone
      ? `https://wa.me/55${cleanPhone}?text=${message}`
      : `https://api.whatsapp.com/send?text=${message}`;
    window.open(waUrl, "_blank");
  };

  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.text.toLowerCase().includes(searchTerm.toLowerCase());

    const appStatus = p.approval?.status || "pending_approval";
    const matchesStatus = statusFilter === "all" || appStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const countPending = posts.filter((p) => (p.approval?.status || p.status) === "pending_approval").length;
  const countChanges = posts.filter((p) => (p.approval?.status || p.status) === "changes_requested").length;
  const countApproved = posts.filter((p) => (p.approval?.status || p.status) === "approved").length;

  return (
    <div className="space-y-6">
      {/* Topo / Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">NumVapt Concierge</h1>
              <p className="text-xs text-slate-400">
                Gestão centralizada de aprovações de clientes atendidos no modelo Done-For-You
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={fetchConciergeData}
          variant="outline"
          size="sm"
          className="bg-slate-900 border-slate-700 text-slate-200 text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Atualizar Lista
        </Button>
      </div>

      {/* Cards de Métricas de Fila */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Aguardando Cliente</span>
            <span className="text-2xl font-bold text-amber-400">{countPending}</span>
          </div>
          <Clock className="w-8 h-8 text-amber-400/30" />
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Ajustes Solicitados</span>
            <span className="text-2xl font-bold text-rose-400">{countChanges}</span>
          </div>
          <MessageSquare className="w-8 h-8 text-rose-400/30" />
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Aprovados / Agendados</span>
            <span className="text-2xl font-bold text-emerald-400">{countApproved}</span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-400/30" />
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, e-mail ou trecho do texto..."
            className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-hidden"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-hidden"
        >
          <option value="all">Todos os Status</option>
          <option value="pending_approval">⏳ Aguardando Aprovação</option>
          <option value="changes_requested">✏️ Ajustes Solicitados</option>
          <option value="approved">✅ Aprovados</option>
        </select>
      </div>

      {/* Grid de Postagens */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">
          Carregando fila de aprovações do Concierge...
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
          Nenhuma publicação encontrada para os filtros selecionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPosts.map((post) => {
            const approvalStatus = post.approval?.status || post.status;
            return (
              <div
                key={post.id}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all shadow-md"
              >
                <div>
                  {/* Cabeçalho do Card */}
                  <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">{post.clientName}</span>
                      <span className="text-[10px] text-slate-400 block">{post.clientEmail}</span>
                    </div>

                    <Badge
                      className={`text-[10px] font-semibold ${
                        approvalStatus === "approved"
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : approvalStatus === "changes_requested"
                            ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                            : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {approvalStatus === "approved"
                        ? "Aprovado"
                        : approvalStatus === "changes_requested"
                          ? "Ajustes Pedidos"
                          : "Pendente"}
                    </Badge>
                  </div>

                  {/* Prévia da Arte */}
                  <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                    {post.imageUrl ? (
                      <img
                        src={post.imageUrl}
                        alt="Criativo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-slate-600">Sem imagem anexada</span>
                    )}

                    {post.isCarousel && (
                      <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                        Carrossel
                      </span>
                    )}
                  </div>

                  {/* Texto do Post */}
                  <div className="p-3.5 space-y-2">
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {post.text}
                    </p>

                    {/* Exibição de Feedback do Cliente (se houver pedido de ajuste) */}
                    {approvalStatus === "changes_requested" && post.approval?.reviewerFeedback && (
                      <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-1">
                        <span className="font-bold flex items-center gap-1 text-[11px]">
                          <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
                          Feedback do cliente:
                        </span>
                        <p className="italic text-[11px] leading-relaxed">
                          "{post.approval.reviewerFeedback}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações de Compartilhamento do Link Mágico */}
                <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between gap-2">
                  {post.magicLinkUrl ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleCopyLink(post.magicLinkUrl!, post.approval!.approvalToken)
                        }
                        className="text-[11px] h-8 text-slate-300 hover:text-white"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        <span>
                          {copiedToken === post.approval?.approvalToken ? "Copiado!" : "Copiar Link"}
                        </span>
                      </Button>

                      <Button
                        size="sm"
                        onClick={() =>
                          handleSendWhatsApp(
                            post.clientPhone,
                            post.magicLinkUrl!,
                            post.clientName
                          )
                        }
                        className="text-[11px] h-8 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        <span>WhatsApp</span>
                      </Button>

                      <a
                        href={post.magicLinkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        title="Abrir página de aprovação"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </>
                  ) : (
                    <span className="text-[11px] text-slate-500">Sem token gerado</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
