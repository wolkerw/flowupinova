"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, CheckCircle2, Printer, FileText, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  SubscriptionPlanModalidade,
  PaymentMethodType,
  ContractClause19Aceites,
  UserContractDoc,
} from "@/lib/types/contract";

export interface DigitalContractViewerProps {
  modalidade: SubscriptionPlanModalidade;
  formaPagamento: PaymentMethodType;
  initialAssinante?: {
    nomeOuRazaoSocial?: string;
    cpfOuCnpj?: string;
    email?: string;
  };
  readOnly?: boolean;
  signedContract?: UserContractDoc | null;
  onSignContract?: (contractData: {
    assinante: { nomeOuRazaoSocial: string; cpfOuCnpj: string; email: string };
    modalidade: SubscriptionPlanModalidade;
    formaPagamento: PaymentMethodType;
    aceites: ContractClause19Aceites;
  }) => Promise<void> | void;
  onBack?: () => void;
  isSigning?: boolean;
}

const CLAUSULA_19_ITEMS: { key: keyof ContractClause19Aceites; label: string }[] = [
  { key: "modalidadeEValor", label: "Modalidade escolhida e valor do ciclo" },
  { key: "prazoAcesso", label: "Prazo de acesso correspondente à modalidade escolhida" },
  { key: "valorTotalCiclo", label: "Valor total do ciclo escolhido, conforme a modalidade selecionada" },
  { key: "descontosEBeneficios", label: "Descontos e benefícios correspondentes à modalidade escolhida" },
  { key: "desistencia7Dias", label: "Desistência total e irrestrita em até 7 dias, sem qualquer ônus" },
  { key: "direitoArrependimento", label: "Direito legal de arrependimento, quando aplicável" },
  { key: "regrasCancelamento", label: "Regras de cancelamento e cálculo proporcional" },
  { key: "multaCompensatoria10", label: "Multa compensatória máxima de 10% sobre eventual saldo restituível" },
  { key: "semPromessaResultado", label: "Não há promessa de resultado de vendas ou faturamento" },
  { key: "politicaPrivacidade", label: "Política de Privacidade" },
];

export function DigitalContractViewer({
  modalidade,
  formaPagamento,
  initialAssinante,
  readOnly = false,
  signedContract,
  onSignContract,
  onBack,
  isSigning = false,
}: DigitalContractViewerProps) {
  const [nome, setNome] = useState(
    signedContract?.assinante?.nomeOuRazaoSocial || initialAssinante?.nomeOuRazaoSocial || ""
  );
  const [cpfCnpj, setCpfCnpj] = useState(
    signedContract?.assinante?.cpfOuCnpj || initialAssinante?.cpfOuCnpj || ""
  );
  const [email] = useState(
    signedContract?.assinante?.email || initialAssinante?.email || ""
  );

  const [aceites, setAceites] = useState<ContractClause19Aceites>(() => {
    if (signedContract?.aceites) {
      return signedContract.aceites;
    }
    return {
      modalidadeEValor: false,
      prazoAcesso: false,
      valorTotalCiclo: false,
      descontosEBeneficios: false,
      desistencia7Dias: false,
      direitoArrependimento: false,
      regrasCancelamento: false,
      multaCompensatoria10: false,
      semPromessaResultado: false,
      politicaPrivacidade: false,
    };
  });

  const [errorMessage, setErrorMessage] = useState("");

  const allChecked = Object.values(aceites).every((val) => val === true);
  const canSign =
    !readOnly &&
    allChecked &&
    nome.trim().length >= 3 &&
    cpfCnpj.trim().length >= 11;

  const handleToggleAceite = (key: keyof ContractClause19Aceites) => {
    if (readOnly) return;
    setAceites((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleCheckAll = () => {
    if (readOnly) return;
    const nextState = !allChecked;
    setAceites({
      modalidadeEValor: nextState,
      prazoAcesso: nextState,
      valorTotalCiclo: nextState,
      descontosEBeneficios: nextState,
      desistencia7Dias: nextState,
      direitoArrependimento: nextState,
      regrasCancelamento: nextState,
      multaCompensatoria10: nextState,
      semPromessaResultado: nextState,
      politicaPrivacidade: nextState,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSign) {
      if (!allChecked) {
        setErrorMessage("Por favor, marque todos os 10 itens de confirmação consciente da Cláusula 19.");
      } else if (nome.trim().length < 3) {
        setErrorMessage("Informe seu Nome completo ou Razão Social.");
      } else if (cpfCnpj.trim().length < 11) {
        setErrorMessage("Informe um CPF ou CNPJ válido.");
      }
      return;
    }

    setErrorMessage("");
    if (onSignContract) {
      await onSignContract({
        assinante: {
          nomeOuRazaoSocial: nome.trim(),
          cpfOuCnpj: cpfCnpj.trim(),
          email: email.trim(),
        },
        modalidade,
        formaPagamento,
        aceites,
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const planLabels: Record<SubscriptionPlanModalidade, { nome: string; ciclo: string; precoMensal: string; total: string; condicao: string }> = {
    mensal: {
      nome: "Mensal",
      ciclo: "Ciclo mensal de 1 mês",
      precoMensal: "R$ 490,00/mês",
      total: "R$ 490,00 por ciclo mensal",
      condicao: "Flexibilidade para cancelar quando quiser, conforme Cláusula 8",
    },
    trimestral: {
      nome: "Trimestral",
      ciclo: "Ciclo de 3 meses",
      precoMensal: "R$ 441,00/mês",
      total: "R$ 1.323,00 a cada 3 meses",
      condicao: "Desconto informado de 10%; compromisso de 3 meses por ciclo",
    },
    semestral: {
      nome: "Semestral",
      ciclo: "Ciclo de 6 meses",
      precoMensal: "R$ 416,50/mês",
      total: "R$ 2.499,00 a cada 6 meses",
      condicao: "Desconto informado de 15%; compromisso de 6 meses por ciclo",
    },
    anual: {
      nome: "Anual",
      ciclo: "Ciclo promocional de 13 meses (12 contratados + 1 mês adicional incluído)",
      precoMensal: "R$ 308,30/mês de acesso",
      total: "R$ 4.788,00 por 13 meses",
      condicao: "Plano promocional com 12 meses contratados e 1 mês adicional incluído",
    },
  };

  const activePlanInfo = planLabels[modalidade] || planLabels.anual;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 text-slate-800">
      {/* Barra de Ações Topo (Não imprime) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 print:hidden">
        <div className="flex items-center gap-2">
          {onBack && !readOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onBack}
              className="gap-1 rounded-xl text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar aos Planos
            </Button>
          )}
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#0083C7]" />
            <span className="text-sm font-bold text-slate-900">
              Contrato Digital de Assinatura NumVapt
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {readOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              <Printer className="h-4 w-4" /> Imprimir / Salvar PDF
            </Button>
          )}
          {readOnly && signedContract?.status === "signed" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Assinado Digitalmente
            </span>
          )}
        </div>
      </div>

      {/* Carimbo de Auditoria se já assinado */}
      {readOnly && signedContract && (
        <div className="rounded-2xl border border-green-200 bg-green-50/70 p-4 text-xs text-green-900 print:border-slate-300 print:bg-white print:text-slate-800">
          <div className="flex items-center gap-2 font-bold text-green-800 print:text-slate-900">
            <Shield className="h-4 w-4 text-green-600" />
            <span>Evidência de Assinatura Eletrônica (Cláusula 16)</span>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <span className="font-semibold text-slate-600">ID do Contrato:</span>
              <p className="font-mono text-[11px] truncate">{signedContract.id}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-600">Data e Hora:</span>
              <p>{signedContract.signedAtFormatted || "Confirmado"}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-600">IP de Origem:</span>
              <p className="font-mono text-[11px]">{signedContract.ipAddress || "Registrado"}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-600">E-mail Autenticado:</span>
              <p className="truncate">{signedContract.userEmail}</p>
            </div>
          </div>
        </div>
      )}

      {/* Documento do Contrato em Formato Legal */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-10 font-sans leading-relaxed text-[13px] print:border-none print:p-0 print:shadow-none">
        <div className="border-b border-slate-200 pb-6 text-center">
          <h1 className="text-xl font-extrabold uppercase tracking-tight text-slate-900 md:text-2xl">
            MINUTA — CONTRATO DE ASSINATURA NUMVAPT
          </h1>
          <p className="mt-2 text-xs text-slate-500">
            Condições Gerais de Contratação e Prestação de Serviços de Marketing com Inteligência Artificial
          </p>
        </div>

        <div className="mt-6 space-y-6">
          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase text-[#0083C7]">1. Quem participa deste contrato</h2>
            <p>
              De um lado, <strong>FLOWUP SOLUCOES E INOVACOES INOVA SIMPLES (I.S.)</strong>, titular da marca e plataforma <strong>NumVapt</strong>, inscrita no CNPJ sob nº <strong>62.826.950/0001-27</strong>, com sede na Rua Deputado Germano Hasslocher, nº 30, CEP 96820-500, Santa Cruz do Sul/RS, e-mail <a href="mailto:flowupinova@gmail.com" className="text-blue-600 underline">flowupinova@gmail.com</a>, doravante denominada <strong>“NumVapt”</strong>.
            </p>
            <p>
              A NumVapt utiliza a assinatura de marca <em>“Simples assim.”</em> e se posiciona como uma plataforma de marketing com inteligência artificial voltada a ajudar pequenos negócios a fazer marketing de forma prática, sem exigir que o usuário domine conhecimentos técnicos de marketing, design ou redação.
            </p>
            <p>
              De outro lado, a pessoa física ou jurídica identificada no cadastro da plataforma, doravante denominada <strong>“Assinante”</strong>.
            </p>
            <p className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-700 italic">
              Ao assinar digitalmente e concluir a contratação, o Assinante confirma que leu este contrato, teve acesso às suas condições antes da contratação e concorda com elas. A NumVapt disponibilizará uma cópia deste contrato em meio que permita seu armazenamento e consulta posterior.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase text-[#0083C7]">2. O que é a NumVapt</h2>
            <p>
              A NumVapt é uma plataforma de marketing com inteligência artificial criada para ajudar pequenos empreendedores, profissionais autônomos, comércios e negócios locais e pequenas equipes responsáveis pela comunicação.
            </p>
            <p>
              A NumVapt não promete determinado número de vendas, seguidores, clientes, alcance, cliques, conversões ou faturamento, nem garante que toda foto, ideia, publicação ou campanha terá o resultado esperado. Esses resultados dependem de fatores fora do controle da plataforma.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase text-[#0083C7]">3. Modalidades de assinatura e escolha do plano</h2>
            <p>
              A NumVapt oferece quatro modalidades de assinatura. O Assinante declara ter escolhido a modalidade assinalada abaixo:
            </p>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Escolha</th>
                    <th className="p-3">Modalidade</th>
                    <th className="p-3">Valor de referência</th>
                    <th className="p-3">Cobrança total informada</th>
                    <th className="p-3">Condição principal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className={cn(modalidade === "mensal" && "bg-blue-50/70 font-semibold")}>
                    <td className="p-3">
                      <span className={cn("inline-flex items-center justify-center h-5 w-5 rounded border", modalidade === "mensal" ? "border-blue-600 bg-blue-600 text-white font-bold" : "border-slate-300")}>
                        {modalidade === "mensal" ? "✓" : ""}
                      </span>
                    </td>
                    <td className="p-3">Mensal</td>
                    <td className="p-3">R$ 490,00/mês</td>
                    <td className="p-3">R$ 490,00 por ciclo mensal</td>
                    <td className="p-3">Flexibilidade para cancelar quando quiser, conforme Cláusula 8</td>
                  </tr>
                  <tr className={cn(modalidade === "trimestral" && "bg-blue-50/70 font-semibold")}>
                    <td className="p-3">
                      <span className={cn("inline-flex items-center justify-center h-5 w-5 rounded border", modalidade === "trimestral" ? "border-blue-600 bg-blue-600 text-white font-bold" : "border-slate-300")}>
                        {modalidade === "trimestral" ? "✓" : ""}
                      </span>
                    </td>
                    <td className="p-3">Trimestral</td>
                    <td className="p-3">R$ 441,00/mês</td>
                    <td className="p-3">R$ 1.323,00 a cada 3 meses</td>
                    <td className="p-3">Desconto informado de 10%; compromisso de 3 meses por ciclo</td>
                  </tr>
                  <tr className={cn(modalidade === "semestral" && "bg-blue-50/70 font-semibold")}>
                    <td className="p-3">
                      <span className={cn("inline-flex items-center justify-center h-5 w-5 rounded border", modalidade === "semestral" ? "border-blue-600 bg-blue-600 text-white font-bold" : "border-slate-300")}>
                        {modalidade === "semestral" ? "✓" : ""}
                      </span>
                    </td>
                    <td className="p-3">Semestral</td>
                    <td className="p-3">R$ 416,50/mês</td>
                    <td className="p-3">R$ 2.499,00 a cada 6 meses</td>
                    <td className="p-3">Desconto informado de 15%; compromisso de 6 meses por ciclo</td>
                  </tr>
                  <tr className={cn(modalidade === "anual" && "bg-blue-50/70 font-semibold")}>
                    <td className="p-3">
                      <span className={cn("inline-flex items-center justify-center h-5 w-5 rounded border", modalidade === "anual" ? "border-blue-600 bg-blue-600 text-white font-bold" : "border-slate-300")}>
                        {modalidade === "anual" ? "✓" : ""}
                      </span>
                    </td>
                    <td className="p-3">
                      Anual <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">13 meses</span>
                    </td>
                    <td className="p-3">R$ 308,30/mês de acesso</td>
                    <td className="p-3">R$ 4.788,00 por 13 meses</td>
                    <td className="p-3">Plano promocional com 12 meses contratados e 1 mês adicional incluído</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-3 space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-900 text-xs">3.2. Resumo da contratação selecionada:</h3>
              <p><strong>Modalidade:</strong> {activePlanInfo.nome} ({activePlanInfo.ciclo})</p>
              <p><strong>Valor do Ciclo:</strong> {activePlanInfo.total}</p>
              <p><strong>Forma de Pagamento:</strong> {formaPagamento === "pix" ? "Pix" : "Cartão de Crédito"}</p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase text-[#0083C7]">4. Contratação sem período de teste gratuito</h2>
            <p>
              Nenhuma das modalidades possui período de teste gratuito. A contratação é realizada de forma paga. O Assinante terá o prazo de <strong>7 dias</strong> para exercer a desistência total e irrestrita prevista na Cláusula 7, sem qualquer multa, retenção, taxa ou encargo.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase text-[#0083C7]">7. Direito de arrependimento e desistência sem ônus</h2>
            <p>
              O Assinante poderá desistir da contratação no prazo de <strong>7 dias</strong> corridos, contado da assinatura ou do início do fornecimento do serviço. Essa desistência será total, irrestrita e sem qualquer ônus. O pedido poderá ser feito pelo e-mail <a href="mailto:flowupinova@gmail.com" className="text-blue-600 underline">flowupinova@gmail.com</a>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase text-[#0083C7]">8. Cancelamento depois do prazo de arrependimento</h2>
            <p>
              Depois do prazo legal de 7 dias, nas modalidades com ciclo (trimestral, semestral ou anual), o cálculo de eventual restituição do período não utilizado obedecerá à fórmula:
            </p>
            <div className="bg-slate-100 p-3 rounded-lg font-mono text-xs text-slate-800">
              Valor da restituição = valor total pago − valor dos meses efetivamente utilizados pelo preço mensal de referência vigente (R$ 490,00/mês) − multa compensatória proporcional de cancelamento (máximo de 10% sobre saldo positivo restituível).
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase text-[#0083C7]">9 a 18. Termos Operacionais, LGPD e Foro</h2>
            <p className="text-xs text-slate-700">
              O Assinante declara ter ciência das regras de confidencialidade, uso correto da plataforma, tratamento de dados sob a LGPD, atendimento via e-mail flowupinova@gmail.com e eleição de foro do domicílio do consumidor ou Santa Cruz do Sul/RS.
            </p>
          </section>

          {/* 19. Declaração de contratação consciente */}
          <section className="space-y-4 border-t border-slate-200 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold uppercase text-[#FA6305]">
                19. Declaração de contratação consciente
              </h2>
              {!readOnly && (
                <button
                  type="button"
                  onClick={handleCheckAll}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                >
                  {allChecked ? "Desmarcar todos" : "Marcar todos os 10 itens como 'Li e compreendi'"}
                </button>
              )}
            </div>

            <p className="text-xs text-slate-600">
              Antes de finalizar a contratação, o Assinante declara que teve acesso, de forma clara e destacada, às seguintes informações:
            </p>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Item Contratual</th>
                    <th className="p-3 w-44 text-center">Confirmação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {CLAUSULA_19_ITEMS.map((item, idx) => {
                    const checked = aceites[item.key] === true;
                    return (
                      <tr
                        key={item.key}
                        onClick={() => !readOnly && handleToggleAceite(item.key)}
                        className={cn(
                          "transition-colors",
                          !readOnly && "cursor-pointer hover:bg-slate-50",
                          checked ? "bg-green-50/50" : "bg-white"
                        )}
                      >
                        <td className="p-3 font-medium text-slate-800">
                          <span className="font-bold text-slate-400 mr-2">{idx + 1}.</span>
                          {item.label}
                        </td>
                        <td className="p-3 text-center">
                          <label
                            className="inline-flex items-center gap-2 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={checked}
                              disabled={readOnly}
                              onCheckedChange={() => handleToggleAceite(item.key)}
                              className="h-4 w-4 data-[state=checked]:bg-[#1da051] data-[state=checked]:border-[#1da051]"
                            />
                            <span className={cn("text-[11px] font-semibold", checked ? "text-[#1da051]" : "text-slate-500")}>
                              {checked ? "Confirmado" : "Li e compreendi"}
                            </span>
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <h3 className="font-bold text-xs uppercase text-slate-700">Identificação do Assinante</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="contrato-nome" className="text-xs font-semibold text-slate-600">
                    Nome Completo ou Razão Social <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contrato-nome"
                    disabled={readOnly}
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: João Silva ou Silva Marketing LTDA"
                    className="mt-1 h-9 bg-white text-xs"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contrato-doc" className="text-xs font-semibold text-slate-600">
                    CPF ou CNPJ <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contrato-doc"
                    disabled={readOnly}
                    value={cpfCnpj}
                    onChange={(e) => setCpfCnpj(e.target.value)}
                    placeholder="000.000.000-00 ou 00.000.000/0001-00"
                    className="mt-1 h-9 bg-white text-xs"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contrato-email" className="text-xs font-semibold text-slate-600">
                    E-mail do Assinante
                  </Label>
                  <Input
                    id="contrato-email"
                    disabled
                    value={email}
                    className="mt-1 h-9 bg-slate-100 text-xs text-slate-600"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-600">Data da Assinatura</Label>
                  <div className="mt-1 flex h-9 items-center rounded-md border border-slate-200 bg-slate-100 px-3 text-xs text-slate-600 font-mono">
                    {signedContract?.signedAtFormatted || new Date().toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </section>
        </div>
      </div>

      {!readOnly && (
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 print:hidden">
          {onBack && (
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              disabled={isSigning}
              className="w-full sm:w-auto rounded-xl text-slate-600 hover:text-slate-800"
            >
              Voltar à escolha do plano
            </Button>
          )}

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSign || isSigning}
            className={cn(
              "w-full sm:w-auto min-w-[280px] rounded-xl py-6 text-sm font-bold text-white shadow-md transition-all",
              canSign && !isSigning
                ? "bg-[#1da051] hover:bg-[#168541] border-b-4 border-[#126b34] active:border-b-0 active:translate-y-px"
                : "bg-slate-300 text-slate-500 cursor-not-allowed border-none"
            )}
          >
            {isSigning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registrando Assinatura...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Assinar Digitalmente e Avançar para Pagamento
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
