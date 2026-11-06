"use client";

import React, { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Bot, Image as ImageIcon, Workflow, Sparkles, MessageSquare, Save, Loader2, Megaphone, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function PromptsViewer() {
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/prompts");
      const data = await res.json();
      if (res.ok) {
        setPrompts(data);
      } else {
        setError("Erro ao carregar os prompts.");
      }
    } catch (err) {
      setError("Erro de rede ao carregar os prompts.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string) => {
    try {
      setSaving(true);
      setSuccess("");
      setError("");
      
      const res = await fetch("/api/admin/prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [key]: prompts[key] }),
      });

      if (res.ok) {
        setSuccess("Prompt salvo com sucesso!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Erro ao salvar o prompt.");
      }
    } catch (err) {
      setError("Erro de rede ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setPrompts((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-slate-700/50 bg-slate-800/60 p-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="h-5 w-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">Biblioteca de Prompts (Agentes IA)</h2>
        </div>
      </div>
      
      <p className="mb-6 text-sm text-slate-400">
        Aqui estão os "cérebros" por trás das inteligências artificiais do app. Edite as instruções abaixo 
        para ajustar o comportamento de cada agente. Cuidado ao alterar as variáveis entre colchetes como [TEXTO_AQUI].
      </p>

      {error && <div className="mb-4 rounded-md bg-red-500/20 p-3 text-sm text-red-200">{error}</div>}
      {success && <div className="mb-4 rounded-md bg-emerald-500/20 p-3 text-sm text-emerald-200">{success}</div>}

      <Accordion type="single" collapsible className="w-full space-y-4">
        {/* Botão Conceito */}
        <AccordionItem
          value="conceito"
          className="overflow-hidden rounded-lg border border-slate-700/50 bg-slate-900/50 px-4"
        >
          <AccordionTrigger className="text-slate-200 hover:text-white hover:no-underline">
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Agente: Gerar Imagem Conceito (UGC)
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6 pt-2 text-slate-400">
            <p className="mb-4 text-xs">
              Este agente constrói o prompt avançado em inglês focando na estética UGC, evitando rostos cortados 
              e repassando ao gerador de imagem (Flux Kontext).
            </p>
            <div className="flex flex-col gap-3">
              <Textarea 
                className="min-h-[300px] bg-slate-950 font-mono text-xs text-slate-300 border-slate-700" 
                value={prompts.ugc_prompt || ""}
                onChange={(e) => handleChange("ugc_prompt", e.target.value)}
              />
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  onClick={() => handleSave("ugc_prompt")}
                  disabled={saving}
                  className="bg-violet-600 hover:bg-violet-500 text-white"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Prompt
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Agente: Diretor de Arte - Fluxo Conceito & Infográficos */}
        <AccordionItem
          value="conceito_prompts_system"
          className="overflow-hidden rounded-lg border border-slate-700/50 bg-slate-900/50 px-4"
        >
          <AccordionTrigger className="text-slate-200 hover:text-white hover:no-underline">
            <div className="flex items-center gap-3">
              <PenTool className="h-4 w-4 text-cyan-400" />
              Agente: Diretor de Arte (Fluxo Conceito & Infográficos)
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6 pt-2 text-slate-400">
            <p className="mb-4 text-xs">
              Instrui a IA a planejar a diagramação infográfica, proibindo repetição de logomarcas em múltiplos elementos e alternando entre Opção 1 (limpa para edição) e Opção 2 (com logo oficial discreta).
            </p>
            <div className="flex flex-col gap-3">
              <Textarea 
                className="min-h-[300px] bg-slate-950 font-mono text-xs text-slate-300 border-slate-700" 
                value={prompts.conceito_prompts_system || ""}
                onChange={(e) => handleChange("conceito_prompts_system", e.target.value)}
              />
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  onClick={() => handleSave("conceito_prompts_system")}
                  disabled={saving}
                  className="bg-violet-600 hover:bg-violet-500 text-white"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Prompt
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Botão Foto de Produto */}
        <AccordionItem
          value="produto"
          className="overflow-hidden rounded-lg border border-slate-700/50 bg-slate-900/50 px-4"
        >
          <AccordionTrigger className="text-slate-200 hover:text-white hover:no-underline">
            <div className="flex items-center gap-3">
              <ImageIcon className="h-4 w-4 text-blue-400" />
              Agente: Gerar com Foto de Produto
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6 pt-2 text-slate-400">
            <p className="mb-4 text-xs">
              Instrui o motor primário (<strong>gpt-image-2.5-sunburst</strong> via Image-to-Image 4:5 1024x1280 → 1080x1350 sem crop destrutivo) a preservar perfeitamente marcas e formatos originais, posicionando o item num cenário fotográfico de alto padrão com margem interna segura de 15% a 20% em todos os lados para evitar corte de títulos e cards.
            </p>
            <div className="flex flex-col gap-3">
              <Textarea 
                className="min-h-[300px] bg-slate-950 font-mono text-xs text-slate-300 border-slate-700" 
                value={prompts.produto_prompt || ""}
                onChange={(e) => handleChange("produto_prompt", e.target.value)}
              />
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  onClick={() => handleSave("produto_prompt")}
                  disabled={saving}
                  className="bg-violet-600 hover:bg-violet-500 text-white"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Prompt
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Botão Híbrido */}
        <AccordionItem
          value="hibrido"
          className="overflow-hidden rounded-lg border border-slate-700/50 bg-slate-900/50 px-4"
        >
          <AccordionTrigger className="text-slate-200 hover:text-white hover:no-underline">
            <div className="flex items-center gap-3">
              <Workflow className="h-4 w-4 text-pink-400" />
              Agente: Geração Híbrida
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6 pt-2 text-slate-400">
            <p className="mb-4 text-xs">
              Neste fluxo, o sistema junta sua imagem com uma referência. O modelo entende
              prioridades com base no que você selecionou e injeta a regra no placeholder `[REGRA_DA_OPCAO_ESCOLHIDA]`.
            </p>
            <div className="flex flex-col gap-3">
              <Textarea 
                className="min-h-[300px] bg-slate-950 font-mono text-xs text-slate-300 border-slate-700" 
                value={prompts.hibrido_prompt || ""}
                onChange={(e) => handleChange("hibrido_prompt", e.target.value)}
              />
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  onClick={() => handleSave("hibrido_prompt")}
                  disabled={saving}
                  className="bg-violet-600 hover:bg-violet-500 text-white"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Prompt
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Gerador de Ideias */}
        <AccordionItem
          value="textos"
          className="overflow-hidden rounded-lg border border-slate-700/50 bg-slate-900/50 px-4"
        >
          <AccordionTrigger className="text-slate-200 hover:text-white hover:no-underline">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-emerald-400" />
              Agente: Gerador de Ideias e Textos (Interno)
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6 pt-2 text-slate-400">
            <p className="mb-4 text-xs">
              Este é o prompt mestre executado internamente pela IA (nas etapas iniciais de criação do post) para formular as 3 sugestões de copy.
            </p>
            <div className="flex flex-col gap-3">
              <Textarea 
                className="min-h-[200px] bg-slate-950 font-mono text-xs text-slate-300 border-slate-700" 
                value={prompts.ideias_post_prompt || ""}
                onChange={(e) => handleChange("ideias_post_prompt", e.target.value)}
              />
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  onClick={() => handleSave("ideias_post_prompt")}
                  disabled={saving}
                  className="bg-violet-600 hover:bg-violet-500 text-white"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Prompt
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Melhorador de Textos */}
        <AccordionItem
          value="melhorador"
          className="overflow-hidden rounded-lg border border-slate-700/50 bg-slate-900/50 px-4"
        >
          <AccordionTrigger className="text-slate-200 hover:text-white hover:no-underline">
            <div className="flex items-center gap-3">
              <PenTool className="h-4 w-4 text-cyan-400" />
              Agente: Melhorador de Textos
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6 pt-2 text-slate-400">
            <p className="mb-4 text-xs">
              Refina e corrige gramaticalmente a legenda fornecida pelo usuário, adicionando tom persuasivo.
            </p>
            <div className="flex flex-col gap-3">
              <Textarea 
                className="min-h-[200px] bg-slate-950 font-mono text-xs text-slate-300 border-slate-700" 
                value={prompts.melhorar_texto_prompt || ""}
                onChange={(e) => handleChange("melhorar_texto_prompt", e.target.value)}
              />
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  onClick={() => handleSave("melhorar_texto_prompt")}
                  disabled={saving}
                  className="bg-violet-600 hover:bg-violet-500 text-white"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Prompt
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Copilot de Anúncios */}
        <AccordionItem
          value="copilot"
          className="overflow-hidden rounded-lg border border-slate-700/50 bg-slate-900/50 px-4"
        >
          <AccordionTrigger className="text-slate-200 hover:text-white hover:no-underline">
            <div className="flex items-center gap-3">
              <Megaphone className="h-4 w-4 text-orange-400" />
              Agente: Copilot de Anúncios (Meta Ads)
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6 pt-2 text-slate-400">
            <p className="mb-4 text-xs">
              Cria headlines e copys focadas em conversão de anúncios pagos na Meta.
            </p>
            <div className="flex flex-col gap-3">
              <Textarea 
                className="min-h-[300px] bg-slate-950 font-mono text-xs text-slate-300 border-slate-700" 
                value={prompts.copilot_ads_prompt || ""}
                onChange={(e) => handleChange("copilot_ads_prompt", e.target.value)}
              />
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  onClick={() => handleSave("copilot_ads_prompt")}
                  disabled={saving}
                  className="bg-violet-600 hover:bg-violet-500 text-white"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Prompt
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Gerador de Brand Book por IA */}
        <AccordionItem
          value="brandbook"
          className="overflow-hidden rounded-lg border border-slate-700/50 bg-slate-900/50 px-4"
        >
          <AccordionTrigger className="text-slate-200 hover:text-white hover:no-underline">
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              Agente: Gerador Executivo de Brand Book por IA
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6 pt-2 text-slate-400">
            <p className="mb-4 text-xs">
              Instrui a IA a atuar como Diretor de Branding Sênior, analisando a imagem da logomarca do cliente para construir o Brand Book Executivo de 12 seções (propósito, valores, posicionamento, 4 personas, arquétipos, regras editoriais, campanhas e plano de 90 dias).
            </p>
            <div className="flex flex-col gap-3">
              <Textarea 
                className="min-h-[300px] bg-slate-950 font-mono text-xs text-slate-300 border-slate-700" 
                value={prompts.generate_brandbook_prompt || ""}
                onChange={(e) => handleChange("generate_brandbook_prompt", e.target.value)}
              />
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  onClick={() => handleSave("generate_brandbook_prompt")}
                  disabled={saving}
                  className="bg-violet-600 hover:bg-violet-500 text-white"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Prompt
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Agente Foto Profissional / Identylock */}
        <AccordionItem
          value="avatar_identylock"
          className="overflow-hidden rounded-lg border border-purple-800/40 bg-purple-950/20 px-4"
        >
          <AccordionTrigger className="text-purple-200 hover:text-white hover:no-underline">
            <div className="flex items-center gap-3">
              <Bot className="h-4 w-4 text-purple-400" />
              Agente: Foto Profissional (Digital Twin & /identylock)
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6 pt-2 text-slate-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-purple-400">
                <p>
                  Diretrizes de fidelidade biométrica e regras do comando <code>/identylock</code> para geração de ensaios e retratos corporativos a partir de selfie.
                </p>
                <span className="rounded bg-purple-900/60 px-2 py-0.5 text-[10px] font-semibold text-purple-200 border border-purple-700/50">
                  Dual Multimodal parts[1] + parts[2]
                </span>
              </div>
              <Textarea
                className="font-mono text-xs bg-slate-950/80 border-slate-700 text-slate-200 min-h-[160px]"
                value={
                  prompts.avatar_identylock_prompt ||
                  `DIRETRIZES CRÍTICAS DE FIDELIDADE FACIAL E RECONSTRUÇÃO:
1. TRAVAMENTO BIOMÉTRICO FACIAL RIGOROSO (/identylock ATIVO):
- REGRA MANDATÓRIA /identylock: Trava todas as características faciais da pessoa. Você pode modificar livremente os elementos da imagem (cenário, iluminação, vestuário, pose corporal, ambiente e enquadramento) sem que o rosto seja alterado.
- REPRODUÇÃO FIEL DA PESSOA (PRIORIDADE MÁXIMA E INEGOCIÁVEL): A pessoa na imagem final gerada DEVE SER INCONFUNDIVELMENTE A MESMA PESSOA enviada na selfie (IMAGEM 1). Mantenha com precisão absoluta a identidade facial, biometria, feições, formato e distância dos olhos, formato do nariz, lábios, mandíbula, formato do rosto, marcas características, sobrancelhas, linha e cor do cabelo, e barba exatamente como estão na selfie original. É TERMINANTEMENTE PROIBIDO gerar um rosto diferente ou genérico.
2. FIDELIDADE E CONSISTÊNCIA TOTAL DO TOM DE PELE: O tom e a cor de pele observados na selfie (IMAGEM 1) DEVEM ser rigorosamente replicados e preservados em todas as partes visíveis do corpo.`
                }
                onChange={(e) => handleChange("avatar_identylock_prompt", e.target.value)}
              />
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-400">
                  Regra protegida integrada nativamente no motor Nano Banana Pro.
                </span>
                <Button 
                  size="sm" 
                  onClick={() => handleSave("avatar_identylock_prompt")}
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-500 text-white"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Prompt
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Agente Fluxo Geral - Direção de Arte Criativa (/anticliche), Trava de Produto (/productlock) e Tipografia (/fontlock) */}
        <AccordionItem
          value="general_productlock"
          className="overflow-hidden rounded-lg border border-emerald-800/40 bg-emerald-950/20 px-4"
        >
          <AccordionTrigger className="text-emerald-200 hover:text-white hover:no-underline">
            <div className="flex items-center gap-3">
              <ImageIcon className="h-4 w-4 text-emerald-400" />
              Agente: Fluxo Geral — Trava Anatômica (/handlock), Estúdio (/agencystudio), Criatividade (/anticliche) & Produto (/productlock)
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6 pt-2 text-slate-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-emerald-400">
                <p>
                  Motor de Trava Anatômica de Mãos (<code>/handlock</code>), Padrão Estúdio de Agência & Pele Realista (<code>/agencystudio</code>), Direção de Arte Premiada (<code>/anticliche</code>), Tipografia Dinâmica (<code>/typolayout</code>) e preservação de produtos (<code>/productlock</code>) do Fluxo Geral.
                </p>
                <span className="rounded bg-emerald-900/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-200 border border-emerald-700/50">
                  Handlock + Agency Studio + Art Direction & Typo
                </span>
              </div>
              <Textarea
                className="font-mono text-xs bg-slate-950/80 border-slate-700 text-slate-200 min-h-[210px]"
                value={
                  prompts.general_productlock_prompt ||
                  `DIRETRIZES NATIVAS DO AGENTE DE FLUXO GERAL (/handlock + /agencystudio + /anticliche + /typolayout + /productlock):
1. DIREÇÃO DE ARTE PUBLICITÁRIA PREMIADA & POV COM FITA 3D DE NEON (/anticliche): Injeta arquétipos cinematográficos de alto impacto (Transformação em Primeira Pessoa POV com fita 3D luminosa de neon azul e laranja conectando a foto crua do celular ao especialista no ambiente real, Autoridade no Habitat Autêntico ricamente texturizado, Capa Editorial Dual-Tone com chiaroscuro refinado, e Explosão Cenográfica 3D em Gravidade Zero).
2. PROIBIÇÃO TOTAL DE FUNDOS LISOS / VAZIOS BEGE DE ESTÚDIO: É terminantemente proibido renderizar paredes lisas monocromáticas ou vazios beges/cinzas sem graça. A cena deve sempre ser ambientada em um espaço real autêntico e pulsante (pizzaria com forno a lenha aceso e brasas, escritório nobre de advocacia com estantes de mogno e luz de janela, clínica moderna, etc.).
3. MOTOR TIPOGRÁFICO DINÂMICO & LIBERDADE DE DIREÇÃO DE ARTE (/typolayout): Liberdade criativa para o agente gerar designs tipográficos plurais e autênticos a cada post, eliminando a fórmula repetitiva de duas cores fixas:
   - Diversidade de Arquétipos: Pôster Monumental Big-Type, Capa Editorial de Luxo com All-Caps expandido, Tarja Sólida Invertida com palavra-chave em bloco de cor da marca, Card Glassmorphic com badges translúcidos, Tipografia Espacial integrada à luz da cena e Diagramação Split assimétrica;
   - Liberdade Cromática: Alternância entre headlines monocromáticas nobres de alto contraste (100% Branco Puro ou Preto Grafite), palavras em destaque pontual de cor, tarjas sólidas invertidas e iluminação cenográfica sutil;
   - Escala e Contraste Display: Variação dramática de escala entre palavras principais de impacto e subtítulos elegantes, mantendo 70-75% da arte dominada pela fotografia conceitual.
4. REGRA "SHOW, DON'T LIST" & TRAVAS DE CLICHÊ: Proíbe fotos clichês de banco de imagens (mão avulsa sobre mesa bege com café e vasinho), proíbe caixas brancas empilhadas de PowerPoint e proíbe botões falsos de CTA de site no rodapé.
5. PRESERVAÇÃO GEOMÉTRICA E MECÂNICA 100% FIEL (/productlock): Preserva 100% dos sub-componentes, cornetas, grades, gabinetes e rótulos de produtos enviados na Etapa 5, sem redesenhar ou inventar logos sobre o hardware.
6. DIFERENCIAÇÃO CONDICIONAL ETAPA 5 (LOGOMARCA VS PRODUTO): Integração criativa para logos da Etapa 5 (CREATIVE_LOGO_ARCHETYPES) e bloqueio total para produtos físicos.
7. MEMÓRIA PERSISTENTE E ALTERNÂNCIA DINÂMICA DE LOGOMARCA DO BRANDKIT: Alternância contínua entre posições editoriais (Topo Esquerdo, Topo Direito, Topo Centralizado e Rodapé Direito) persistida no banco de dados do usuário (users/{userId}.lastLogoPosition).
8. TRAVA ANATÔMICA DE MÃOS E ESTÚDIO DE AGÊNCIA DE ELITE (/handlock & /agencystudio): Mãos humanas perfeitas com rigorosamente 5 dedos distintos (um polegar e quatro dedos), juntas e unhas naturais, posturas ergonômicas apoiadas (segurando produtos/smartphone com firmeza, mãos nos bolsos ou descansando em superfícies) com sombras coerentes de contato. Proibição terminante de dedos extras, 6 dedos, dedos colados, atrofiados ou mãos flutuantes. Fotografia de estúdio publicitário com lente 85mm f/1.8 com profundidade de campo suave, luz de recorte sutil, luz difusa por softbox duplo e pele hiper-realista com microporos orgânicos (banindo aspecto plástico, cera ou boneco de porcelana).`
                }
                onChange={(e) => handleChange("general_productlock_prompt", e.target.value)}
              />
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-400">
                  Regra integrada nativamente no Gpt5PromptPlanner e ImageModelExecutor.
                </span>
                <Button
                  size="sm"
                  onClick={() => handleSave("general_productlock_prompt")}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Prompt
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
