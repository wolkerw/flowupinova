"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Printer,
  Copy,
  Download,
  Sparkles,
  Building,
  Mail,
  Phone,
  Globe,
  MapPin,
} from "lucide-react";

interface LetterheadStudioProps {
  brandName: string;
  slogan?: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  initialPhone?: string;
  initialEmail?: string;
  initialWebsite?: string;
  initialAddress?: string;
}

export function LetterheadStudio({
  brandName,
  slogan = "",
  primaryColor,
  secondaryColor,
  logoUrl,
  initialPhone = "(11) 99999-8888",
  initialEmail = "contato@empresa.com.br",
  initialWebsite = "www.suaempresa.com.br",
  initialAddress = "Av. Paulista, 1000 - Bela Vista - São Paulo, SP - CEP 01310-100",
}: LetterheadStudioProps) {
  const { toast } = useToast();

  const [docType, setDocType] = useState<"proposta" | "orcamento" | "oficio">("proposta");
  const [docTitle, setDocTitle] = useState("PROPOSTA COMERCIAL & PLANEJAMENTO ESTRATÉGICO");
  const [recipient, setRecipient] = useState("À Atenção da Diretoria / Departamento Comercial");
  const [docDate, setDocDate] = useState(() => {
    return new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  });

  const [cnpj, setCnpj] = useState("00.000.000/0001-00");
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail);
  const [website, setWebsite] = useState(initialWebsite);
  const [address, setAddress] = useState(initialAddress);

  // Modelos de Texto Pré-definidos
  const templates: Record<string, string> = {
    proposta: `Apresentamos nossa proposta técnica e comercial para estruturação de serviços com foco em alta performance e excelência operacional.

1. ESCOPO DOS SERVIÇOS
- Diagnóstico completo de comunicação e presença de marca;
- Planejamento estratégico de ações corporativas;
- Implementação e acompanhamento de métricas de conversão.

2. INVESTIMENTO E PRAZOS
O investimento total para execução do projeto é estruturado em etapas quinzenais, com cronograma de entrega estimado em 30 (trinta) dias úteis a contar da aprovação deste instrumento.

Permanecemos à disposição para dirimir eventuais dúvidas e avançarmos na formalização da parceria.`,
    orcamento: `Encaminhamos a cotação formal dos itens e serviços solicitados para validação e faturamento:

ITEM 01: Pacote de Consultoria Estratégica Mensal .................... R$ 1.850,00
ITEM 02: Criação e Gestão de Identidade Visual Corporativa ........ R$ 1.200,00
ITEM 03: Produção de Materiais Gráficos e Digitais ................... R$ 950,00

VALOR TOTAL ESTIMADO: R$ 4.000,00 (Quatro mil reais)
Condições de Pagamento: 50% no aceite e 50% na conclusão das entregas.
Validade deste orçamento: 15 (quinze) dias corridos.`,
    oficio: `Por meio deste comunicado oficial, informamos aos nossos clientes, parceiros e fornecedores o início do novo ciclo de atendimento e expansão corporativa da ${brandName}.

Reiteramos nosso compromisso com a qualidade, pontualidade e segurança em todas as operações realizadas em conjunto, colocando nossos canais de atendimento à total disposição.`,
  };

  const [bodyText, setBodyText] = useState(templates.proposta);

  const handleSelectTemplate = (type: "proposta" | "orcamento" | "oficio") => {
    setDocType(type);
    if (type === "proposta") {
      setDocTitle("PROPOSTA COMERCIAL & PLANEJAMENTO ESTRATÉGICO");
      setBodyText(templates.proposta);
    } else if (type === "orcamento") {
      setDocTitle("ORÇAMENTO COMERCIAL OFICIAL");
      setBodyText(templates.orcamento);
    } else {
      setDocTitle("COMUNICADO & OFÍCIO OFICIAL");
      setBodyText(templates.oficio);
    }
  };

  // Impressão / Salvar em PDF
  const handlePrint = () => {
    window.print();
  };

  // Copiar Texto
  const handleCopyText = () => {
    const fullText = `${brandName.toUpperCase()}\n${docTitle}\nData: ${docDate}\n${recipient}\n\n${bodyText}\n\n${brandName} - ${phone} | ${email}`;
    navigator.clipboard.writeText(fullText);
    toast({
      title: "Texto Copiado!",
      description: "Conteúdo do documento copiado para a área de transferência.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Barra de Ações Superiores */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs print:hidden">
        <div>
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#0083C7]" />
            Papel Timbrado Oficial Corporativo (A4)
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Gere propostas, orçamentos e contratos com a identidade visual e dados jurídicos da sua marca.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyText}
            className="text-xs font-semibold text-slate-700"
          >
            <Copy className="h-3.5 w-3.5 mr-1" />
            Copiar Texto
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handlePrint}
            className="bg-[#0083C7] hover:bg-[#0083C7]/90 text-white text-xs font-bold shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1" />
            Imprimir / Salvar em PDF (A4)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Formulário de Conteúdo (5 colunas) */}
        <Card className="lg:col-span-5 border border-slate-200 shadow-sm bg-white rounded-2xl print:hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#0083C7]" />
              Edição do Documento
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Escolha o modelo de texto ou edite livremente para gerar seu documento formal.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            {/* Seletor de Modelo */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Modelo Rápido</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "proposta", label: "Proposta" },
                  { id: "orcamento", label: "Orçamento" },
                  { id: "oficio", label: "Ofício / Nota" },
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      docType === tpl.id
                        ? "bg-[#0083C7] text-white border-[#0083C7] shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Título do Documento</Label>
              <Input
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="Ex: PROPOSTA COMERCIAL"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Destinatário</Label>
                <Input
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Nome do Cliente / Empresa"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Data de Emissão</Label>
                <Input
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  placeholder="Data"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Corpo do Documento</Label>
              <Textarea
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                rows={8}
                className="text-xs leading-relaxed"
                placeholder="Digite o texto oficial do documento..."
              />
            </div>

            {/* Rodapé Jurídico */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <span className="text-xs font-bold text-slate-700 block">Dados do Rodapé Jurídico:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-slate-500">CNPJ / Inscrição</Label>
                  <Input
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-slate-500">Telefone</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">Endereço Completo</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prévia em Proporção A4 (7 colunas) */}
        <div className="lg:col-span-7 flex justify-center print:w-full print:block">
          <div className="w-full max-w-[560px] aspect-[210/297] bg-white rounded-xl shadow-2xl border border-slate-200 p-8 sm:p-12 flex flex-col justify-between text-slate-900 relative overflow-hidden print:max-w-none print:shadow-none print:border-none print:rounded-none">
            {/* Faixa decorativa superior com gradiente da marca */}
            <div
              className="absolute top-0 left-0 right-0 h-3"
              style={{
                background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
              }}
            />

            {/* 1. CABEÇALHO DO TIMBRADO */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-6 pt-2">
              <div className="flex items-center gap-3">
                <div className="h-14 max-w-[180px] flex items-center justify-center shrink-0">
                  {logoUrl ? (
                    <img src={logoUrl} alt={brandName} className="max-h-14 max-w-full object-contain drop-shadow-xs" />
                  ) : (
                    <span className="text-base font-black text-slate-800">
                      {brandName.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  {!logoUrl && (
                    <h3 className="text-base font-black text-slate-900 tracking-wider">
                      {brandName.toUpperCase()}
                    </h3>
                  )}
                  {slogan && <p className="text-[10px] text-slate-500 font-medium">{slogan}</p>}
                </div>
              </div>

              <div className="text-right text-[10px] text-slate-500 space-y-0.5">
                <p className="font-semibold text-slate-700">{website}</p>
                <p>{email}</p>
                <p>{phone}</p>
              </div>
            </div>

            {/* 2. CORPO DO DOCUMENTO */}
            <div className="flex-1 py-8 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-slate-100 pb-3">
                <h4 className="text-xs font-black tracking-wide text-slate-900" style={{ color: primaryColor }}>
                  {docTitle}
                </h4>
                <span className="text-[10px] text-slate-400">{docDate}</span>
              </div>

              <p className="text-xs font-bold text-slate-700 italic">
                {recipient}
              </p>

              <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed text-justify">
                {bodyText}
              </div>

              {/* Assinatura formal no rodapé do documento */}
              <div className="pt-10 flex flex-col items-center justify-center text-center">
                <div className="w-48 border-t border-slate-400 mb-1" />
                <p className="text-xs font-bold text-slate-800">{brandName}</p>
                <p className="text-[10px] text-slate-500">Representação Legal / Diretoria Comercial</p>
              </div>
            </div>

            {/* 3. RODAPÉ INSTITUCIONAL */}
            <div className="border-t border-slate-200 pt-4 text-[9px] text-slate-500 text-center space-y-1">
              <p className="font-semibold text-slate-700">
                {brandName} • CNPJ: {cnpj}
              </p>
              <p>{address}</p>
              <p className="text-[8px] text-slate-400">
                Documento gerado através do Estúdio de Marca e Papelaria NumVapt
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
