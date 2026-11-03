"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Smartphone,
  CreditCard,
  QrCode,
  Share2,
  Copy,
  Download,
  Printer,
  ExternalLink,
  MessageCircle,
  Instagram,
  MapPin,
  UserPlus,
  Mail,
  Globe,
  RotateCw,
  Sparkles,
} from "lucide-react";

interface BusinessCardStudioProps {
  brandName: string;
  slogan?: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  lightLogoUrl?: string;
  initialPhone?: string;
  initialInstagram?: string;
  initialWebsite?: string;
  initialEmail?: string;
}

export function BusinessCardStudio({
  brandName,
  slogan = "",
  primaryColor,
  secondaryColor,
  logoUrl,
  lightLogoUrl,
  initialPhone = "",
  initialInstagram = "",
  initialWebsite = "",
  initialEmail = "",
}: BusinessCardStudioProps) {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"digital" | "physical">("digital");
  const [physicalSide, setPhysicalSide] = useState<"front" | "back">("front");
  const [showBleedGuides, setShowBleedGuides] = useState(false);
  const [logoContrastMode, setLogoContrastMode] = useState<"auto" | "white">("auto");

  // Logo efetiva para fundos escuros
  const effectiveDarkLogo = lightLogoUrl || logoUrl;

  // Campos do Cartão
  const [personName, setPersonName] = useState("Seu Nome Aqui");
  const [personRole, setPersonRole] = useState("Diretor(a) / Fundador(a)");
  const [phone, setPhone] = useState(initialPhone || "(11) 99999-8888");
  const [instagram, setInstagram] = useState(initialInstagram ? initialInstagram.replace("@", "") : "seunegocio");
  const [email, setEmail] = useState(initialEmail || "contato@suaempresa.com.br");
  const [website, setWebsite] = useState(initialWebsite || "www.suaempresa.com.br");
  const [address, setAddress] = useState("Av. Paulista, 1000 - São Paulo, SP");
  const [whatsappMessage, setWhatsappMessage] = useState(
    "Olá! Acessei seu cartão de visitas e gostaria de saber mais sobre seus produtos e serviços."
  );

  // Link para o Cartão Digital
  const cleanPhone = phone.replace(/\D/g, "");
  const cardShareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/c/${cleanPhone || "contato"}`
    : `https://numvapt.com.br/c/${cleanPhone || "contato"}`;

  // Gerador de arquivo vCard (.vcf) para salvar na agenda
  const handleDownloadVCard = () => {
    const vcardContent = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${personName};;;;`,
      `FN:${personName}`,
      `ORG:${brandName}`,
      `TITLE:${personRole}`,
      `TEL;TYPE=CELL,VOICE:${cleanPhone ? `+55${cleanPhone}` : phone}`,
      `EMAIL;TYPE=WORK,INTERNET:${email}`,
      `URL:${website.startsWith("http") ? website : `https://${website}`}`,
      `ADR;TYPE=WORK:;;${address};;;;`,
      `NOTE:Contato salvo via Cartão Digital NumVapt - ${brandName}`,
      "END:VCARD",
    ].join("\r\n");

    const blob = new Blob([vcardContent], { type: "text/vcard;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `contato-${personName.toLowerCase().replace(/\s+/g, "-")}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "vCard Gerado com Sucesso! 📇",
      description: "O arquivo .vcf foi baixado. Ao abrir no celular, o contato é salvo na agenda com 1 toque.",
    });
  };

  // Copiar link do cartão digital
  const handleCopyLink = () => {
    navigator.clipboard.writeText(cardShareUrl);
    toast({
      title: "Link Copiado!",
      description: "Link do cartão digital copiado para a área de transferência.",
    });
  };

  // Compartilhar no WhatsApp
  const handleShareWhatsApp = () => {
    const text = `Olá! Segue meu Cartão de Visitas Digital com todos os meus contatos e localização:\n${cardShareUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  // Impressão gráfica do cartão físico
  const handlePrintPhysicalCard = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Seletor do Tipo de Cartão: Digital vs Físico */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs print:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("digital")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "digital"
                ? "bg-[#0083C7] text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Smartphone className="h-4 w-4" />
            Cartão de Visitas Digital Interativo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("physical")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "physical"
                ? "bg-[#0083C7] text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Cartão Físico Tradicional (Gráfica)
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "digital" ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="text-xs font-semibold"
              >
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copiar Link
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleShareWhatsApp}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                <Share2 className="h-3.5 w-3.5 mr-1" />
                Enviar no WhatsApp
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowBleedGuides(!showBleedGuides)}
                className="text-xs font-semibold"
              >
                {showBleedGuides ? "Ocultar Sangria" : "Ver Sangria (3mm)"}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handlePrintPhysicalCard}
                className="bg-[#0083C7] hover:bg-[#0083C7]/90 text-white text-xs font-bold"
              >
                <Printer className="h-3.5 w-3.5 mr-1" />
                Imprimir / Salvar PDF
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start print:hidden">
        {/* Formulário de Edição dos Dados (5 colunas) */}
        <Card className="lg:col-span-5 border border-slate-200 shadow-sm bg-white rounded-2xl">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#0083C7]" />
              Dados do Cartão de Visitas
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Personalize as informações de contato exibidas para seus clientes e parceiros.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Seu Nome / Profissional</Label>
                <Input
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="Ex: Fernando Silva"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Cargo / Função</Label>
                <Input
                  value={personRole}
                  onChange={(e) => setPersonRole(e.target.value)}
                  placeholder="Ex: Diretor Comercial"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">WhatsApp de Atendimento</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-8888"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Usuário do Instagram</Label>
                <div className="flex items-center">
                  <span className="h-9 px-2.5 flex items-center bg-slate-100 border border-r-0 border-slate-200 rounded-l-md text-xs text-slate-500 font-mono">
                    @
                  </span>
                  <Input
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value.replace("@", ""))}
                    placeholder="seunegocio"
                    className="h-9 text-xs rounded-l-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">E-mail Profissional</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@empresa.com"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Website Oficial</Label>
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="www.empresa.com.br"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Endereço Comercial (Para Waze / Maps)</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, Número, Bairro - Cidade, Estado"
                className="h-9 text-xs"
              />
            </div>

            {activeTab === "digital" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Mensagem Automática do Botão WhatsApp
                </Label>
                <Input
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  placeholder="Mensagem pronta ao iniciar conversa"
                  className="h-9 text-xs"
                />
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Cores Herdados da Marca:</span>
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded-full border shadow-2xs" style={{ backgroundColor: primaryColor }} />
                  <div className="h-4 w-4 rounded-full border shadow-2xs" style={{ backgroundColor: secondaryColor }} />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                O cartão sincroniza automaticamente com o logotipo e paleta oficial definidos no Cérebro do Negócio.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Prévia Visual do Cartão (7 colunas) */}
        <div className="lg:col-span-7 space-y-6">
          {activeTab === "digital" ? (
            /* =================================================================== */
            /* PRÉVIA DO CARTÃO DIGITAL (MOCKUP SMARTPHONE PWA) */
            /* =================================================================== */
            <div className="flex flex-col items-center">
              <div className="w-full max-w-sm rounded-[36px] p-3 bg-slate-900 shadow-2xl border-4 border-slate-800">
                {/* Tela do Celular */}
                <div className="rounded-[28px] bg-slate-950 overflow-hidden text-white flex flex-col min-h-[580px]">
                  {/* Topo do Celular / Dynamic Island */}
                  <div className="pt-2 pb-1 flex justify-center bg-slate-950">
                    <div className="h-4 w-24 bg-slate-800 rounded-full" />
                  </div>

                  {/* Header Visual com Cores da Marca */}
                  <div
                    className="p-6 text-center relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                    }}
                  >
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="h-16 max-w-[200px] flex items-center justify-center mb-2">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={brandName}
                            className="max-h-16 max-w-full object-contain drop-shadow-md"
                          />
                        ) : (
                          <span className="text-xl font-black text-white drop-shadow-md">
                            {brandName.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {!logoUrl && (
                        <h4 className="text-lg font-extrabold text-white tracking-tight drop-shadow-xs">
                          {brandName}
                        </h4>
                      )}
                      {slogan && (
                        <p className="text-[11px] text-white/90 font-medium tracking-wide mt-1">
                          {slogan}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Corpo do Cartão Digital */}
                  <div className="flex-1 bg-white text-slate-900 p-5 space-y-5 rounded-t-3xl -mt-4 relative z-20">
                    <div className="text-center">
                      <h5 className="text-base font-extrabold text-slate-900">{personName}</h5>
                      <p className="text-xs font-semibold text-[#0083C7]">{personRole}</p>
                    </div>

                    {/* Os 4 Botões Principais de Alta Conversão */}
                    <div className="space-y-2.5">
                      {/* Botão 1: WhatsApp */}
                      <a
                        href={`https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(
                          whatsappMessage
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all shadow-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <MessageCircle className="h-4 w-4" />
                          <span>Conversar no WhatsApp</span>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                      </a>

                      {/* Botão 2: Instagram */}
                      <a
                        href={`https://instagram.com/${instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-95 text-white font-bold text-xs transition-all shadow-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <Instagram className="h-4 w-4" />
                          <span>Seguir no Instagram</span>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                      </a>

                      {/* Botão 3: Endereço / GPS */}
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <MapPin className="h-4 w-4 text-[#FA6305]" />
                          <span>Abrir Rota no Google Maps</span>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                      </a>

                      {/* Botão 4: Salvar Contato na Agenda (vCard) */}
                      <button
                        type="button"
                        onClick={handleDownloadVCard}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0083C7] hover:bg-[#0083C7]/90 text-white font-bold text-xs transition-all shadow-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <UserPlus className="h-4 w-4" />
                          <span>Salvar Contato na Agenda (vCard)</span>
                        </div>
                        <Download className="h-3.5 w-3.5 opacity-80" />
                      </button>
                    </div>

                    {/* Dados Secundários: E-mail e Site */}
                    <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate">{email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate">{website}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de Ação Rápida */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadVCard}
                  className="text-xs font-semibold"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Testar Baixar .vCard
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleShareWhatsApp}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  <Share2 className="h-3.5 w-3.5 mr-1" />
                  Compartilhar no WhatsApp
                </Button>
              </div>
            </div>
          ) : (
            /* =================================================================== */
            /* PRÉVIA DO CARTÃO FÍSICO (PADRÃO GRÁFICO 9x5 CM) */
            /* =================================================================== */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Formato Padrão Gráfico: 9x5 cm (300 DPI)
                </span>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setPhysicalSide("front")}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      physicalSide === "front" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                    }`}
                  >
                    Frente
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhysicalSide("back")}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      physicalSide === "back" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                    }`}
                  >
                    Verso
                  </button>
                </div>

                {physicalSide === "front" && (
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-500 px-1">Contraste:</span>
                    <button
                      type="button"
                      onClick={() => setLogoContrastMode(logoContrastMode === "auto" ? "white" : "auto")}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-800 shadow-2xs hover:bg-slate-50 transition-all"
                      title="Alternar entre logo colorida original e versão branca de alto contraste"
                    >
                      {logoContrastMode === "white" ? "⚪ Logo Branca" : "🎨 Logo Colorida"}
                    </button>
                  </div>
                )}
              </div>

              {/* Card 9x5 cm Visual */}
              <div className="flex justify-center p-4 sm:p-8 bg-slate-100 rounded-2xl border border-slate-200">
                <div
                  className={`w-full max-w-[450px] aspect-[9/5] rounded-xl shadow-xl overflow-hidden relative transition-all ${
                    showBleedGuides ? "ring-2 ring-red-400 ring-offset-2" : ""
                  }`}
                  style={{
                    backgroundColor: physicalSide === "front" ? "#0F172A" : "#FFFFFF",
                  }}
                >
                  {/* Linhas de Sangria (3mm) se ativado */}
                  {showBleedGuides && (
                    <div className="absolute inset-2 border border-dashed border-red-400 pointer-events-none z-30 flex items-start justify-end p-1">
                      <span className="text-[9px] font-bold text-red-500 bg-white/90 px-1 rounded">
                        Área de Corte (3mm)
                      </span>
                    </div>
                  )}

                  {physicalSide === "front" ? (
                    /* FRENTE DO CARTÃO */
                    <div className="h-full flex flex-col justify-between p-6 sm:p-8 text-white relative">
                      {/* Faixa decorativa com as cores da marca */}
                      <div
                        className="absolute top-0 left-0 right-0 h-2"
                        style={{
                          background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                        }}
                      />

                      <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="h-16 max-w-[200px] flex items-center justify-center mb-2">
                          {effectiveDarkLogo ? (
                            <img
                              src={effectiveDarkLogo}
                              alt={brandName}
                              className={`max-h-16 max-w-full object-contain ${
                                logoContrastMode === "white"
                                  ? "brightness-0 invert drop-shadow-md"
                                  : "drop-shadow-lg"
                              }`}
                            />
                          ) : (
                            <span className="text-xl font-black text-white">
                              {brandName.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        {!effectiveDarkLogo && (
                          <h3 className="text-xl font-black tracking-wider text-white">
                            {brandName.toUpperCase()}
                          </h3>
                        )}
                        {slogan && (
                          <p className="text-xs sm:text-[13px] text-slate-200 font-medium tracking-widest uppercase mt-2 drop-shadow-xs">
                            {slogan}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-between items-end text-[10px] text-slate-400 border-t border-slate-800 pt-2">
                        <span>Cartão Corporativo Oficial</span>
                        <span style={{ color: secondaryColor }} className="font-bold">
                          {website}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* VERSO DO CARTÃO */
                    <div className="h-full flex flex-col justify-between p-6 text-slate-900 relative">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="text-base font-extrabold text-slate-900 leading-tight">
                            {personName}
                          </h4>
                          <p className="text-xs font-bold" style={{ color: primaryColor }}>
                            {personRole}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{brandName}</p>
                        </div>

                        {/* Mini QR Code apontando para o Cartão Digital */}
                        <div className="text-center shrink-0">
                          <div className="h-16 w-16 p-1 border border-slate-200 rounded-lg bg-white shadow-2xs flex items-center justify-center">
                            <QrCode className="h-12 w-12 text-slate-800" />
                          </div>
                          <span className="text-[8px] font-bold text-slate-500 mt-0.5 block">
                            Escanear Contato
                          </span>
                        </div>
                      </div>

                      {/* Linhas de Contato no Verso */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-700 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 truncate">
                          <MessageCircle className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <Instagram className="h-3 w-3 text-pink-600 shrink-0" />
                          <span className="truncate">@{instagram}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="h-3 w-3 text-slate-500 shrink-0" />
                          <span className="truncate">{email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <Globe className="h-3 w-3 text-blue-600 shrink-0" />
                          <span className="truncate">{website}</span>
                        </div>
                        <div className="col-span-2 flex items-center gap-1.5 truncate text-[9px] text-slate-500">
                          <MapPin className="h-3 w-3 text-[#FA6305] shrink-0" />
                          <span className="truncate">{address}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPhysicalSide(physicalSide === "front" ? "back" : "front")}
                  className="text-xs font-semibold"
                >
                  <RotateCw className="h-3.5 w-3.5 mr-1" />
                  Virar Cartão ({physicalSide === "front" ? "Ver Verso" : "Ver Frente"})
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handlePrintPhysicalCard}
                  className="bg-[#0083C7] hover:bg-[#0083C7]/90 text-white text-xs font-bold"
                >
                  <Printer className="h-3.5 w-3.5 mr-1" />
                  Imprimir Frente & Verso (PDF 300 DPI)
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* PRANCHA DE IMPRESSÃO GRÁFICA EXCLUSIVA (PRINT SHEET - 90x50 MM)     */}
      {/* Visível SOMENTE na impressão (@media print) e oculta na tela        */}
      {/* =================================================================== */}
      <div className="hidden print:block w-full max-w-[210mm] mx-auto py-6 px-4 bg-white text-slate-900 font-sans">
        {/* Cabeçalho Técnico de Gabarito */}
        <div className="border-b-2 border-slate-900 pb-3 mb-8 flex items-end justify-between">
          <div>
            <span className="text-[10px] font-black tracking-widest text-[#0083C7] uppercase block">
              Gabarito Oficial de Produção Gráfica
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {brandName.toUpperCase()} — CARTÃO DE VISITAS
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Formato Final Refilado: <strong>90 × 50 mm</strong> • Padrão Gráfico Internacional
            </p>
          </div>
          <div className="text-right text-[10px] text-slate-600 space-y-0.5">
            <div>
              Cor Primária:{" "}
              <span className="font-mono font-bold" style={{ color: primaryColor }}>
                {primaryColor}
              </span>
            </div>
            <div>
              Cor Secundária:{" "}
              <span className="font-mono font-bold" style={{ color: secondaryColor }}>
                {secondaryColor}
              </span>
            </div>
            <div className="font-bold text-slate-800">Resolução: 300 DPI | CMYK Ready</div>
          </div>
        </div>

        {/* Prancha dos Cartões: Frente e Verso com Marcas de Corte */}
        <div className="space-y-10 my-6">
          {/* 1. FRENTE */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-700">
              <span className="h-2 w-2 rounded-full bg-[#0083C7]" />
              FRENTE (90 × 50 mm)
            </div>

            {/* Container com Marcas de Corte */}
            <div className="relative p-3">
              {/* Marcas de corte nos 4 cantos */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-slate-800 pointer-events-none" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-slate-800 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-slate-800 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-slate-800 pointer-events-none" />

              {/* Corpo da Frente do Cartão */}
              <div
                className="w-[90mm] h-[50mm] rounded-none shadow-none overflow-hidden relative flex flex-col justify-between p-5 text-white"
                style={{ backgroundColor: "#0F172A" }}
              >
                {/* Faixa decorativa com degradê da marca */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{
                    background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                  }}
                />

                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="h-12 max-w-[160px] flex items-center justify-center mb-1">
                    {effectiveDarkLogo ? (
                      <img
                        src={effectiveDarkLogo}
                        alt={brandName}
                        className={`max-h-12 max-w-full object-contain ${
                          logoContrastMode === "white"
                            ? "brightness-0 invert drop-shadow-md"
                            : "drop-shadow-lg"
                        }`}
                      />
                    ) : (
                      <span className="text-lg font-black text-white">
                        {brandName.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {!effectiveDarkLogo && (
                    <h3 className="text-base font-black tracking-wider text-white">
                      {brandName.toUpperCase()}
                    </h3>
                  )}
                  {slogan && (
                    <p className="text-[10px] text-slate-200 font-medium tracking-widest uppercase mt-1">
                      {slogan}
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-end text-[9px] text-slate-400 border-t border-slate-800 pt-1.5">
                  <span>Cartão Corporativo Oficial</span>
                  <span style={{ color: secondaryColor }} className="font-bold">
                    {website}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. VERSO */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-700">
              <span className="h-2 w-2 rounded-full bg-[#FA6305]" />
              VERSO (90 × 50 mm)
            </div>

            {/* Container com Marcas de Corte */}
            <div className="relative p-3">
              {/* Marcas de corte nos 4 cantos */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-slate-800 pointer-events-none" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-slate-800 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-slate-800 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-slate-800 pointer-events-none" />

              {/* Corpo do Verso do Cartão */}
              <div
                className="w-[90mm] h-[50mm] rounded-none shadow-none overflow-hidden relative flex flex-col justify-between p-5 text-slate-900 border border-slate-300"
                style={{ backgroundColor: "#FFFFFF" }}
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                      {personName}
                    </h4>
                    <p className="text-[11px] font-bold" style={{ color: primaryColor }}>
                      {personRole}
                    </p>
                    <p className="text-[9px] text-slate-500 mt-0.5">{brandName}</p>
                  </div>

                  {/* Mini QR Code */}
                  <div className="text-center shrink-0">
                    <div className="h-12 w-12 p-0.5 border border-slate-300 rounded bg-white flex items-center justify-center">
                      <QrCode className="h-10 w-10 text-slate-800" />
                    </div>
                    <span className="text-[7px] font-bold text-slate-500 mt-0.5 block">
                      Escanear
                    </span>
                  </div>
                </div>

                {/* Grade de Contatos */}
                <div className="grid grid-cols-2 gap-1.5 text-[9px] text-slate-700 pt-1.5 border-t border-slate-200">
                  <div className="flex items-center gap-1 truncate">
                    <MessageCircle className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{phone}</span>
                  </div>
                  <div className="flex items-center gap-1 truncate">
                    <Instagram className="h-2.5 w-2.5 text-pink-600 shrink-0" />
                    <span className="truncate">@{instagram}</span>
                  </div>
                  <div className="flex items-center gap-1 truncate">
                    <Mail className="h-2.5 w-2.5 text-slate-500 shrink-0" />
                    <span className="truncate">{email}</span>
                  </div>
                  <div className="flex items-center gap-1 truncate">
                    <Globe className="h-2.5 w-2.5 text-blue-600 shrink-0" />
                    <span className="truncate">{website}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1 truncate text-[8.5px] text-slate-500">
                    <MapPin className="h-2.5 w-2.5 text-[#FA6305] shrink-0" />
                    <span className="truncate">{address}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé de Instruções Técnicas */}
        <div className="border-t border-slate-200 pt-4 mt-8 flex flex-col sm:flex-row sm:items-center justify-between text-[9px] text-slate-500 gap-2">
          <div>
            <strong>Instruções de Impressão:</strong> Papel Couchê 300g (Fosco ou Brilho) ou Papel Supremo. Refilar nas marcas de corte.
          </div>
          <div className="text-right">
            Gerado via <strong>Estúdio de Marca NumVapt</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
