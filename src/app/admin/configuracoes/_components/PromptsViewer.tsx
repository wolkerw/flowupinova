"use client";

import React, { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Bot, Image as ImageIcon, Workflow, Sparkles, MessageSquare, Save, Loader2, Megaphone, PenTool, TrendingUp } from "lucide-react";
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
              Instrui o motor primário (<strong>gpt-image-2.6-sunburst</strong> via Image-to-Image 4:5 1024x1280 → 1080x1350 sem crop destrutivo) a preservar perfeitamente marcas e formatos originais, posicionando o item num cenário fotográfico de alto padrão com margem interna segura de 15% a 20% em todos os lados para evitar corte de títulos e cards.
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
3. MOTOR TIPOGRÁFICO DINÂMICO, PERFIS CRIATIVOS POR OBJETIVO DA ETAPA 3 & PRIORIDADE DO BRANDKIT (/typolayout + /objectivelayout + /fontlock): Elimina o viés conservador nos objetivos comerciais/corporativos (Vender Produto, Post para Redes, Anúncio/Oferta, Empresa & Serviços, Conceito Criativo, Thumb de Alta Performance, Panfleto Digital / Flyer e Post Temático / Campanha Criativa) e prioriza 100% as fontes do BrandKit enquanto destrava 12 arquiteturas espaciais de layout de títulos com máxima liberdade de design e respeito estrito ao BrandKit:
   - 12 Arquétipos Espaciais de Títulos: Pôster Monumental Big-Type, Camada de Profundidade 3D Estilo Capa de Revista (título passando sutilmente atrás dos ombros do sujeito), Terço Inferior Cinematográfico (topo livre para a fotografia), Diagramação em 'L' / Âncora em Cantos Opostos, Capa Editorial de Luxo All-Caps, Tarja/Pill Sólida Invertida, Card Glassmorphic com brilho neon, Tipografia Espacial integrada à luz, Diagramação Split em Duas Colunas com barra vertical, Eixo Lateral Vertical a 90°, Entrelaçamento Espacial 3D em Profundidade e Grid Contemporâneo Suíço (Swiss Neue Grafik);
   - Liberdade Cromática: Alternância entre headlines monocromáticas nobres de alto contraste (100% Branco Puro ou Preto Grafite), palavras em destaque pontual de cor, tarjas sólidas invertidas e iluminação cenográfica sutil;
   - Escala e Contraste Display: Variação dramática de escala entre palavras principais de impacto e subtítulos elegantes, mantendo 70-75% da arte dominada pela fotografia conceitual.
4. REGRA "SHOW, DON'T LIST" & TRAVAS DE CLICHÊ (COM EXCEÇÃO PARA PANFLETO DIGITAL E POST TEMÁTICO): Proíbe fotos clichês de banco de imagens (mão avulsa sobre mesa bege com café e vasinho), proíbe caixas brancas empilhadas de PowerPoint e proíbe botões falsos de CTA nos objetivos normais. EXCEÇÃO DO PANFLETO DIGITAL: No objetivo "flyer", as travas anti-lista e anti-botão são destravadas para renderizar 3 a 5 benefícios com ícones circulares, mockup de app no smartphone e rodapé de CTA, sempre submisso às fontes e cores do BrandKit. EXCEÇÃO TEMÁTICA NA HEADLINE (/thematictypo): No objetivo "thematic" (Post Temático / Campanha) ou quando o briefing solicitar estilos artísticos e épocas (anos 80, anos 2000, Senhor dos Anéis, fantasia, cinema, gibi), a headline principal ganha liberdade tipográfica total para adotar fontes 3D, neon cromado, ouro élfico ou estilo do tema, enquanto todas as demais informações (cards, benefícios, subtítulos, rodapés e logotipo oficial) continuam rigorosamente submissas à tipografia limpa e cores do BrandKit.
5. PRESERVAÇÃO GEOMÉTRICA E MECÂNICA 100% FIEL (/productlock): Preserva 100% dos sub-componentes, cornetas, grades, gabinetes e rótulos de produtos enviados na Etapa 5, sem redesenhar ou inventar logos sobre o hardware.
6. DIFERENCIAÇÃO CONDICIONAL ETAPA 5 (LOGOMARCA VS PRODUTO): Integração criativa para logos da Etapa 5 (CREATIVE_LOGO_ARCHETYPES) e bloqueio total para produtos físicos.
7. MEMÓRIA PERSISTENTE E ALTERNÂNCIA DINÂMICA DE LOGOMARCA DO BRANDKIT: Alternância contínua entre posições editoriais (Topo Esquerdo, Topo Direito, Topo Centralizado e Rodapé Direito) persistida no banco de dados do usuário (users/{userId}.lastLogoPosition).
8. TRAVA ANATÔMICA DE MÃOS E ESTÚDIO DE AGÊNCIA DE ELITE (/handlock & /agencystudio): Mãos humanas perfeitas com rigorosamente 5 dedos distintos (um polegar e quatro dedos), juntas e unhas naturais, posturas ergonômicas apoiadas (segurando produtos/smartphone com firmeza, mãos nos bolsos ou descansando em superfícies) com sombras coerentes de contato. Proibição terminante de dedos extras, 6 dedos, dedos colados, atrofiados ou mãos flutuantes. Fotografia de estúdio publicitário com lente 85mm f/1.8 com profundidade de campo suave, luz de recorte sutil, luz difusa por softbox duplo e pele hiper-realista com microporos orgânicos (banindo aspecto plástico, cera ou boneco de porcelana).
9. PROIBIÇÃO DE PONTO FINAL EM HEADLINES (/noendingperiod): Títulos principais, mastheads e chamadas comerciais de topo JAMAIS recebem ponto final (.) desenhado na imagem (ex: desenhe "NOVOS TEMPOS", e NUNCA "NOVOS TEMPOS."). Headlines publicitárias são chamadas abertas de alto impacto visual, sendo terminantemente proibido pintar ponto final no encerramento da frase principal.`
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

        {/* Agente Carrossel com IA (5 ou 7 slides) - Custo Mínimo & Regra de Ouro */}
        <AccordionItem
          value="carousel_storyboard_agent"
          className="overflow-hidden rounded-lg border border-sky-800/40 bg-sky-950/20 px-4"
        >
          <AccordionTrigger className="text-sky-200 hover:text-white hover:no-underline">
            <div className="flex items-center gap-3">
              <Workflow className="h-4 w-4 text-sky-400" />
              Agente: Carrossel com IA (5 ou 7 Slides) — Roteiro Unificado, Capa Sunburst & Design Tokens
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6 pt-2 text-slate-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-sky-400">
                <p>
                  Roteiro completo em 1 chamada (<code>gemini-2.5-flash</code> + Zod), geração exclusiva da Capa no Slide 1 (<code>gpt-image-2.6-sunburst</code> em 1080×1350) e renderização dos Slides 2..N via templates Fabric.js com Design Tokens extraídos da capa.
                </p>
                <span className="rounded bg-sky-900/60 px-2 py-0.5 text-[10px] font-semibold text-sky-200 border border-sky-700/50">
                  1 Imagem IA (Capa) + Slides 2..N Fabric.js (0 Custo)
                </span>
              </div>
              <Textarea
                className="font-mono text-xs bg-slate-950/80 border-slate-700 text-slate-200 min-h-[200px]"
                value={
                  prompts.carousel_storyboard_prompt ||
                  `DIRETRIZES DO AGENTE DE CARROSSEL COM IA (5 OU 7 SLIDES — CUSTO MÍNIMO):
1. REGRA DE OURO INVIOLÁVEL (GUARD EXPLÍCITO): Somente o Slide 1 (Capa) aciona o modelo de imagem IA (gpt-image-2.6-sunburst em 1080x1350, proporção 4:5). Os Slides 2 a N NUNCA chamam modelo de imagem; são renderizados por template Fabric.js com custo zero de imagem.
2. ROTEIRO COMPLETO EM 1 ÚNICA CHAMADA DE TEXTO (gemini-2.5-flash + validação Zod):
   - Define primeiro a "chamadaCapa" (headline gancho de até 65 caracteres) e o "promptImagemCapa" (área limpa de luminosidade 100% uniforme atrás do texto, sem vinhetas escuras/degradês invadindo as letras, trava de alto contraste texto branco em fundo escuro ou texto escuro em fundo claro).
   - Em seguida escreve os slides internos desenvolvendo e cumprindo EXATAMENTE a promessa da chamadaCapa:
     * 5 slides: 1 capa -> 2 contexto -> 3 ponto_principal -> 4 complemento -> 5 cta.
     * 7 slides: 1 capa -> 2 contexto -> 3, 4 e 5 desenvolvimento -> 6 prova_resumo -> 7 cta.
   - Limites rigorosos: título <= 45 caracteres, texto <= 160 caracteres, português do Brasil revisado e CTA no último slide com o canal real do negócio (WhatsApp, link da bio, etc.).
3. EXTRAÇÃO DE DESIGN TOKENS DA CAPA (JIMP + VISÃO):
   - Paleta dominante extraída por quantização com Jimp (custo zero) + análise de estilo via gemini-2.5-flash (cor de fundo, destaque, texto, alinhamento, peso tipográfico, motivo gráfico e cantos).
   - Regra de precedência: os tokens da capa prevalecem nas CORES; o BrandKit do usuário prevalece em LOGO e TIPOGRAFIA (fontes).`
                }
                onChange={(e) => handleChange("carousel_storyboard_prompt", e.target.value)}
              />
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-400">
                  Sincronizado com /api/carousel/storyboard, /api/carousel/generate-cover e fabric-slide-renderer.ts.
                </span>
                <Button
                  size="sm"
                  onClick={() => handleSave("carousel_storyboard_prompt")}
                  disabled={saving}
                  className="bg-sky-600 hover:bg-sky-500 text-white"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Prompt
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Agente de Tendências & Notícias com IA (Micro-briefing Publicitário) */}
        <AccordionItem
          value="trends_structurer_prompt"
          className="overflow-hidden rounded-lg border border-teal-800/40 bg-teal-950/20 px-4"
        >
          <AccordionTrigger className="text-teal-200 hover:text-white hover:no-underline">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-4 w-4 text-teal-400" />
              Agente: Tendências do Google & Notícias com IA (Micro-briefing Publicitário para o Fluxo Geral)
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6 pt-2 text-slate-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-teal-400">
                <p>
                  Refina notícias em alta em propostas publicitárias de alto padrão (<code>gemini-2.5-flash</code>) com gancho comercial e descrição visual cinematográfica direcionada ao Fluxo Geral.
                </p>
                <span className="rounded bg-teal-900/60 px-2 py-0.5 text-[10px] font-semibold text-teal-200 border border-teal-700/50">
                  IA de Notícias para Imagens Profissionais
                </span>
              </div>
              <Textarea
                className="font-mono text-xs bg-slate-950/80 border-slate-700 text-slate-200 min-h-[180px]"
                value={
                  prompts.trends_structurer_prompt ||
                  `DIRETRIZES DO ESTRUTURADOR DE NOTÍCIAS & TENDÊNCIAS COM IA (HEAD RELEVANTE COM O TÓPICO):
1. HEADLINE RELEVANTE E ENTENDÍVEL (COM O TÓPICO OBRIGATÓRIO):
   - O tópico em alta DEVE estar explicitamente presente na Head (ex: "sistemas da Microsoft, como Outlook e Hotmail").
   - Conecta o fato a uma reflexão ou ação de valor (ex: "mostram a importância de canais alternativos de contato").
   - Frase com sentido completo, sem cortes com reticências ("...") e entre 60 a 110 caracteres.
   - PROIBIÇÃO TOTAL DE CRÉDITOS NA ARTE: Não incluir "Fonte: G1", "Segundo a Folha", etc.
2. DIREÇÃO DE ARTE VISUAL E CONTEXTO RESUMIDO:
   - "newsSummary": Resumo factual de 1 a 2 frases para contextualizar as boas práticas no negócio.
   - "visualPrompt": Fotografia editorial cinematográfica e profissional representando a situação no nicho.
   - "fullBrief": Conecta [Cena Visual] + [Head Relevante da Arte] + [Contexto e Boas Práticas] + [Ação Estratégica].
3. FLUXO DIRETO ECONÔMICO (quality=low):
   - Redireciona o usuário para o Fluxo Geral (/dashboard/imagens/gerar?mode=general), preenchendo automaticamente a descrição visual, headline e ativando a geração econômica (0,5k) sem exibir termos técnicos no prompt.`
                }
                onChange={(e) => handleChange("trends_structurer_prompt", e.target.value)}
              />
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-400">
                  Sincronizado com /api/trends (POST), buildStructuredTrendAIPrompt e page.client.tsx de Tendências.
                </span>
                <Button
                  size="sm"
                  onClick={() => handleSave("trends_structurer_prompt")}
                  disabled={saving}
                  className="bg-teal-600 hover:bg-teal-500 text-white"
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
