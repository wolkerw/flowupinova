"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Send,
  XCircle,
  Instagram,
  Facebook,
  Linkedin,
  Share2,
  Calendar,
} from "lucide-react";
import type { ConciergeApprovalPublicView, PostApprovalStatus } from "@/lib/types/concierge";

interface ApprovalClientViewProps {
  initialPost: ConciergeApprovalPublicView;
}

export function ApprovalClientView({ initialPost }: ApprovalClientViewProps) {
  const [post, setPost] = useState<ConciergeApprovalPublicView>(initialPost);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const images = post.imageUrls && post.imageUrls.length > 0 ? post.imageUrls : [];
  const currentImage = images[currentImageIndex] || null;

  const handleApprove = async () => {
    if (submitting || post.status !== "pending_approval") return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/concierge/posts/${post.token}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao aprovar publicação.");

      setPost((prev) => ({ ...prev, status: "approved" }));
      setActionSuccess("Publicação aprovada com sucesso! A equipe NumVapt já programou o disparo.");
    } catch (err: any) {
      setErrorMessage(err.message || "Não foi possível concluir a aprovação.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!feedbackText.trim() || submitting) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/concierge/posts/${post.token}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request_changes", feedback: feedbackText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao solicitar alterações.");

      setPost((prev) => ({
        ...prev,
        status: "changes_requested",
        reviewerFeedback: feedbackText.trim(),
      }));
      setShowChangesModal(false);
      setActionSuccess("Alterações enviadas para os desenvolvedores da NumVapt! Vamos ajustar sua arte.");
    } catch (err: any) {
      setErrorMessage(err.message || "Falha ao enviar solicitação.");
    } finally {
      setSubmitting(false);
    }
  };

  const formattedSchedule = () => {
    try {
      const date = new Date(post.scheduledAt);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return post.scheduledAt;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-primary selection:text-white">
      {/* Top Bar com Identidade NumVapt & Cliente */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0083C7] flex items-center justify-center text-white font-black text-sm shadow-sm">
              NV
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                NumVapt Concierge
              </span>
              <span className="text-xs font-bold text-white block -mt-0.5">
                Central de Aprovação
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {post.businessLogo ? (
              <img
                src={post.businessLogo}
                alt={post.businessName}
                className="w-7 h-7 rounded-full object-cover border border-slate-700"
              />
            ) : null}
            <span className="text-xs font-semibold text-slate-200 max-w-[120px] truncate">
              {post.businessName}
            </span>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal (Mobile First) */}
      <main className="max-w-xl mx-auto w-full px-4 py-5 flex-1 space-y-4">
        {/* Banner de Status */}
        {actionSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 shadow-sm animate-in fade-in duration-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-medium">{actionSuccess}</div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {post.status === "approved" && !actionSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Esta publicação já foi <strong>aprovada</strong> e está agendada para disparo.</span>
          </div>
        )}

        {post.status === "changes_requested" && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <MessageSquare className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Ajustes solicitados pela sua empresa:</span>
            </div>
            {post.reviewerFeedback && (
              <p className="text-[11px] italic bg-slate-900/60 p-2 rounded-lg border border-amber-500/20 text-slate-200">
                "{post.reviewerFeedback}"
              </p>
            )}
            <span className="text-[10px] text-amber-400/90 block">
              Nossa equipe está produzindo as alterações solicitadas.
            </span>
          </div>
        )}

        {/* Card Mockup de Feed do Instagram/Rede Social */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl">
          {/* Header do Mockup */}
          <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[1.5px]">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                  {post.businessLogo ? (
                    <img src={post.businessLogo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-white">
                      {(post.businessName || "NV").substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-white block leading-tight">
                  {post.businessName || "Sua Marca"}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5 text-[#0083C7]" />
                  Programado: {formattedSchedule()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              {post.platforms.includes("instagram") && <Instagram className="w-3.5 h-3.5" />}
              {post.platforms.includes("facebook") && <Facebook className="w-3.5 h-3.5" />}
              {post.platforms.includes("linkedin") && <Linkedin className="w-3.5 h-3.5" />}
            </div>
          </div>

          {/* Área da Imagem / Carrossel */}
          <div className="relative aspect-square w-full bg-slate-950 flex items-center justify-center overflow-hidden">
            {currentImage ? (
              <img
                src={currentImage}
                alt="Criativo NumVapt"
                className="w-full h-full object-contain select-none"
              />
            ) : (
              <div className="text-slate-500 text-xs">Sem mídia visual anexada</div>
            )}

            {/* Controles de Navegação do Carrossel */}
            {images.length > 1 && (
              <>
                {currentImageIndex > 0 && (
                  <button
                    onClick={() => setCurrentImageIndex((prev) => prev - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs"
                    aria-label="Imagem anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {currentImageIndex < images.length - 1 && (
                  <button
                    onClick={() => setCurrentImageIndex((prev) => prev + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs"
                    aria-label="Próxima imagem"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}

                <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                  {currentImageIndex + 1}/{images.length}
                </div>
              </>
            )}
          </div>

          {/* Legenda e Texto */}
          <div className="p-4 space-y-2.5">
            <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
              <strong className="text-white mr-1.5">{post.businessName}</strong>
              {post.text}
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FA6305]" />
                Criado com IA pela Equipe NumVapt
              </span>
              <span>{images.length > 1 ? `${images.length} artes (carrossel)` : "Arte única"}</span>
            </div>
          </div>
        </div>

        {/* Bloco de Decisão / Ações do Cliente */}
        {post.status === "pending_approval" && (
          <div className="pt-2 space-y-2.5">
            <button
              onClick={handleApprove}
              disabled={submitting}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Aprovar e Agendar Publicação</span>
            </button>

            <button
              onClick={() => setShowChangesModal(true)}
              disabled={submitting}
              className="w-full h-11 bg-slate-800 hover:bg-slate-700 active:scale-[0.99] text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-all disabled:opacity-50"
            >
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>Solicitar Ajustes ou Mudanças</span>
            </button>
          </div>
        )}
      </main>

      {/* Modal / Gaveta de Pedido de Alterações */}
      {showChangesModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>O que você gostaria de ajustar?</span>
              </div>
              <button
                onClick={() => setShowChangesModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-normal">
              Descreva as mudanças na arte, preço, texto ou data que você deseja que os desenvolvedores da NumVapt realizem:
            </p>

            <textarea
              rows={4}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Ex: Gostei da arte, mas gostaria de alterar o título para 'Promoção de Primavera' e mudar o valor para R$ 129,90..."
              className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-amber-400 resize-none"
            />

            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setShowChangesModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                onClick={handleRequestChanges}
                disabled={submitting || !feedbackText.trim()}
                className="px-5 py-2.5 text-xs font-bold bg-[#FA6305] hover:bg-orange-600 text-white rounded-xl flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar para a Equipe</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Discreto */}
      <footer className="border-t border-slate-900 py-4 text-center text-[10px] text-slate-600">
        © 2026 NumVapt • Soluções Inteligentes em Conteúdo e IA
      </footer>
    </div>
  );
}
