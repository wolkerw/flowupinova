"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  Copy,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  HelpCircle,
  Smartphone,
  Globe,
  Instagram,
  User,
  Building,
} from "lucide-react";

interface EmailSignatureStudioProps {
  brandName: string;
  slogan?: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  initialName?: string;
  initialRole?: string;
  initialPhone?: string;
  initialEmail?: string;
  initialWebsite?: string;
  initialInstagram?: string;
}

export function EmailSignatureStudio({
  brandName,
  slogan = "",
  primaryColor,
  secondaryColor,
  logoUrl,
  initialName = "Seu Nome Completo",
  initialRole = "Diretor Executivo",
  initialPhone = "(11) 99999-8888",
  initialEmail = "contato@empresa.com.br",
  initialWebsite = "www.suaempresa.com.br",
  initialInstagram = "seunegocio",
}: EmailSignatureStudioProps) {
  const { toast } = useToast();

  const [template, setTemplate] = useState<"horizontal" | "compact" | "badge">("horizontal");
  const [personName, setPersonName] = useState(initialName);
  const [personRole, setPersonRole] = useState(initialRole);
  const [department, setDepartment] = useState("Comercial & Atendimento");
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail);
  const [website, setWebsite] = useState(initialWebsite);
  const [instagram, setInstagram] = useState(initialInstagram.replace("@", ""));
  const [copied, setCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Geração do Código HTML com CSS Inline Rígido para Compatibilidade Máxima
  const getSignatureHtml = () => {
    const cleanPhone = phone.replace(/\D/g, "");
    const siteUrl = website.startsWith("http") ? website : `https://${website}`;
    const instaUrl = `https://instagram.com/${instagram}`;
    const waUrl = `https://api.whatsapp.com/send?phone=55${cleanPhone}`;

    if (template === "compact") {
      return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.4; color: #1e293b; max-width: 450px;">
  <tr>
    <td style="padding-bottom: 8px;">
      <span style="font-size: 15px; font-weight: bold; color: #0f172a;">${personName}</span>
      <span style="color: #64748b; font-size: 12px;"> | ${personRole}</span>
    </td>
  </tr>
  <tr>
    <td style="padding-bottom: 10px; border-bottom: 2px solid ${primaryColor};">
      <span style="font-weight: bold; color: ${primaryColor};">${brandName}</span>
      ${slogan ? `<span style="color: #64748b; font-size: 11px;"> — ${slogan}</span>` : ""}
    </td>
  </tr>
  <tr>
    <td style="padding-top: 10px; font-size: 12px; color: #475569;">
      <span>📱 <a href="${waUrl}" style="color: #0284c7; text-decoration: none;">${phone}</a></span> &nbsp;|&nbsp;
      <span>✉️ <a href="mailto:${email}" style="color: #0284c7; text-decoration: none;">${email}</a></span><br/>
      <span>🌐 <a href="${siteUrl}" style="color: #0284c7; text-decoration: none;">${website}</a></span> &nbsp;|&nbsp;
      <span>📸 <a href="${instaUrl}" style="color: #0284c7; text-decoration: none;">@${instagram}</a></span>
    </td>
  </tr>
</table>`.trim();
    }

    if (template === "badge") {
      return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.4; color: #1e293b; background: #f8fafc; border-left: 4px solid ${primaryColor}; border-radius: 4px; padding: 12px 16px; max-width: 500px;">
  <tr>
    <td style="vertical-align: middle; padding-right: 14px;">
      ${
        logoUrl
          ? `<img src="${logoUrl}" alt="${brandName}" width="54" height="54" style="display: block; object-contain: contain;" />`
          : `<div style="width: 50px; height: 50px; border-radius: 8px; background: ${primaryColor}; color: #ffffff; font-weight: bold; font-size: 18px; line-height: 50px; text-align: center;">${brandName.slice(0, 2).toUpperCase()}</div>`
      }
    </td>
    <td style="vertical-align: middle;">
      <div style="font-size: 15px; font-weight: bold; color: #0f172a;">${personName}</div>
      <div style="font-size: 12px; font-weight: bold; color: ${primaryColor};">${personRole} • ${brandName}</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
        <a href="${waUrl}" style="color: #475569; text-decoration: none;">WhatsApp: ${phone}</a> &nbsp;|&nbsp;
        <a href="mailto:${email}" style="color: #475569; text-decoration: none;">${email}</a>
      </div>
      <div style="font-size: 11px; color: #64748b;">
        <a href="${siteUrl}" style="color: ${secondaryColor}; font-weight: bold; text-decoration: none;">${website}</a>
      </div>
    </td>
  </tr>
</table>`.trim();
    }

    // Default: Horizontal Executivo Clássico
    return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.4; color: #1e293b; max-width: 520px;">
  <tr>
    <td style="vertical-align: middle; padding-right: 16px; border-right: 2px solid ${primaryColor};">
      ${
        logoUrl
          ? `<img src="${logoUrl}" alt="${brandName}" width="68" height="68" style="display: block; border-radius: 10px; object-contain: contain;" />`
          : `<div style="width: 60px; height: 60px; border-radius: 10px; background: ${primaryColor}; color: #ffffff; font-weight: bold; font-size: 20px; line-height: 60px; text-align: center;">${brandName.slice(0, 2).toUpperCase()}</div>`
      }
    </td>
    <td style="vertical-align: middle; padding-left: 16px;">
      <div style="font-size: 16px; font-weight: bold; color: #0f172a; margin-bottom: 2px;">${personName}</div>
      <div style="font-size: 12px; font-weight: bold; color: ${primaryColor};">${personRole}</div>
      <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">${department} • <strong style="color: #334155;">${brandName}</strong></div>

      <div style="font-size: 11px; color: #475569; line-height: 1.5;">
        <span>📱 WhatsApp: <a href="${waUrl}" style="color: #0284c7; text-decoration: none; font-weight: bold;">${phone}</a></span><br/>
        <span>✉️ E-mail: <a href="mailto:${email}" style="color: #0284c7; text-decoration: none;">${email}</a></span><br/>
        <span>🌐 Website: <a href="${siteUrl}" style="color: #0284c7; text-decoration: none;">${website}</a></span> &nbsp;|&nbsp;
        <span>📸 <a href="${instaUrl}" style="color: #ec4899; text-decoration: none;">@${instagram}</a></span>
      </div>
    </td>
  </tr>
</table>`.trim();
  };

  // Copiar código formatado como rich HTML para a área de transferência
  const handleCopySignature = async () => {
    const html = getSignatureHtml();
    try {
      if (typeof window !== "undefined" && window.navigator && window.navigator.clipboard) {
        // Tenta gravar rich HTML se a API ClipboardItem estiver disponível
        if (typeof ClipboardItem !== "undefined") {
          const blobHtml = new Blob([html], { type: "text/html" });
          const blobText = new Blob([`${personName} - ${personRole} | ${brandName}`], { type: "text/plain" });
          const item = new ClipboardItem({
            "text/html": blobHtml,
            "text/plain": blobText,
          });
          await navigator.clipboard.write([item]);
        } else {
          await navigator.clipboard.writeText(html);
        }

        setCopied(true);
        setTimeout(() => setCopied(false), 3000);

        toast({
          title: "Assinatura Copiada com Sucesso! ✉️",
          description: "Agora basta colar (Ctrl+V) no campo de assinatura do seu Gmail, Outlook ou Webmail.",
        });
      }
    } catch (err) {
      // Fallback em caso de restrição do navegador
      navigator.clipboard.writeText(html);
      toast({
        title: "HTML Copiado!",
        description: "Código da assinatura copiado para a área de transferência.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Ações Superiores */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div>
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#0083C7]" />
            Gerador de Assinatura de E-mail Profissional
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Gera tabelas HTML com estilos inline rígidos, 100% à prova de falhas no Gmail, Outlook e Apple Mail.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs font-semibold text-slate-700"
          >
            <HelpCircle className="h-3.5 w-3.5 mr-1 text-[#0083C7]" />
            Como Colar no Gmail/Outlook
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleCopySignature}
            className="bg-[#0083C7] hover:bg-[#0083C7]/90 text-white text-xs font-bold shadow-xs"
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Copiado com Sucesso!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copiar Assinatura HTML
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Guia Rápido de Instalação (se ativado) */}
      {showGuide && (
        <Card className="border border-blue-200 bg-blue-50/60 p-5 rounded-2xl animate-in fade-in-50 duration-200">
          <h5 className="text-xs font-bold text-blue-900 mb-2 flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4 text-[#0083C7]" /> Passo a passo para ativar a assinatura:
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-blue-800 leading-relaxed">
            <div className="p-3 bg-white/80 rounded-xl border border-blue-100">
              <p className="font-bold mb-1">📬 No Gmail (Google Workspace):</p>
              <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-700">
                <li>Clique no botão <strong>Copiar Assinatura HTML</strong> acima.</li>
                <li>No Gmail, abra <strong>Configurações (engrenagem)</strong> &gt; <strong>Ver todas as configurações</strong>.</li>
                <li>Na aba <strong>Geral</strong>, role até a seção <strong>Assinatura</strong>.</li>
                <li>Crie uma nova assinatura e pressione <strong>Ctrl + V</strong> (Colar).</li>
                <li>Role até o final da página e clique em <strong>Salvar alterações</strong>.</li>
              </ol>
            </div>
            <div className="p-3 bg-white/80 rounded-xl border border-blue-100">
              <p className="font-bold mb-1">💼 No Outlook (Web ou Aplicativo):</p>
              <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-700">
                <li>Clique no botão <strong>Copiar Assinatura HTML</strong> acima.</li>
                <li>No Outlook, vá em <strong>Arquivo &gt; Opções &gt; Email &gt; Assinaturas</strong>.</li>
                <li>Clique em <strong>Nova</strong> e dê um nome (ex: &ldquo;Padrão NumVapt&rdquo;).</li>
                <li>No campo de texto, pressione <strong>Ctrl + V</strong> (Colar) e clique em <strong>OK</strong>.</li>
              </ol>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Formulário de Customização (5 colunas) */}
        <Card className="lg:col-span-5 border border-slate-200 shadow-sm bg-white rounded-2xl">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#0083C7]" />
              Dados do Profissional & Layout
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Escolha o modelo visual e ajuste as informações do signatário.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            {/* Seletor de Modelo Visual */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Estilo da Assinatura</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "horizontal", label: "Executivo" },
                  { id: "compact", label: "Compacto" },
                  { id: "badge", label: "Cartão Badge" },
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setTemplate(tpl.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      template === tpl.id
                        ? "bg-[#0083C7] text-white border-[#0083C7] shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Nome do Signatário</Label>
                <Input
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="Nome Completo"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Cargo / Título</Label>
                <Input
                  value={personRole}
                  onChange={(e) => setPersonRole(e.target.value)}
                  placeholder="Ex: Diretor Executivo"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Departamento / Setor</Label>
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Ex: Vendas, Suporte, Diretoria"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">WhatsApp</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-8888"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">E-mail</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@empresa.com"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Website</Label>
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="www.empresa.com.br"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Instagram</Label>
                <Input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value.replace("@", ""))}
                  placeholder="seunegocio"
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prévia em Caixa de E-mail Simulada (7 colunas) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
            {/* Header Simulado de Mensagem de E-mail */}
            <div className="border-b border-slate-200 bg-slate-100 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold text-slate-600 ml-2">Nova Mensagem — Outlook / Gmail</span>
              </div>
              <Badge variant="outline" className="text-[10px] bg-white border-slate-200">
                Prévia em Tempo Real
              </Badge>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Corpo Simulado do E-mail */}
              <div className="space-y-2 text-xs text-slate-600 pb-4 border-b border-slate-100">
                <p>
                  <strong>Para:</strong> cliente.potencial@empresa.com.br
                </p>
                <p>
                  <strong>Assunto:</strong> Proposta Comercial & Parceria NumVapt
                </p>
                <p className="pt-2 text-slate-700">
                  Olá! Segue em anexo a apresentação completa do nosso projeto conforme conversamos.
                  Fico à total disposição para alinharmos os próximos passos.
                </p>
                <p className="text-slate-700">Atenciosamente,</p>
              </div>

              {/* Assinatura Renderizada */}
              <div
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: getSignatureHtml() }}
              />

              {/* Botão de Cópia da Assinatura */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  type="button"
                  onClick={handleCopySignature}
                  className="w-full sm:flex-1 bg-[#0083C7] hover:bg-[#0083C7]/90 text-white font-bold h-10 text-xs rounded-xl shadow-xs"
                >
                  <Copy className="h-3.5 w-3.5 mr-2" />
                  Copiar Assinatura Formatada para Gmail / Outlook
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
