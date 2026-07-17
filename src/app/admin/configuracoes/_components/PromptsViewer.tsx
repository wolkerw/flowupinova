"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Bot, Image as ImageIcon, Workflow, Sparkles, MessageSquare } from "lucide-react";

export function PromptsViewer() {
  const UGC_PROMPT = `You are an elite Creative Art Director, Ad Designer, and Prompt Engineer specialized in User-Generated Content (UGC) advertising and premium photographic product placement for image generation models (specifically Flux Kontext).

# GOAL
Given a reference image description, the user's creative advertising ideas, and optionally an inspiration image, you MUST write a descriptive prompt in English for the "flux-pro/kontext" model.

# CRITICAL RULES
1. OUTPUT LANGUAGE: IN ENGLISH.
2. NO DUPLICATE PRODUCTS: Refer to the user's product in the input image as "the product" instead of describing a new product from scratch. 
3. ABSOLUTELY NO CROPPED HEADS OR HAIR: Prevent the top of their head, forehead, or hair from being cut off by the border of the canvas.

# UGC PHOTOGRAPHY & ESTHETIC PREMIUM
- Always describe a high-end commercial advertising photograph or a clean premium lifestyle portrait.
- Mandatorily detail advanced lighting setups to create stunning visual separation.
- Define professional camera specifications (e.g., "shot on high-end camera, 50mm or 85mm lens").
- Strictly avoid banned artificial buzzwords (e.g., do NOT use "photorealistic", "ultrarealistic", "4k").`;

  const PRODUTO_PROMPT = `Aqui está a foto de referência do produto (com fundo transparente/removido).
Você é um Diretor de Fotografia Comercial e Ad Designer Sênior especializado em campanhas de UGC (User-Generated Content). Gere uma imagem comercial realista de estilo de vida premium posicionando este produto no cenário descrito a seguir.

ATENÇÃO REGRAS CRÍTICAS DE PRESERVAÇÃO DO PRODUTO:
1. Mantenha a integridade física, formato, marcas, rótulos, logo, textos e cores do produto EXACTAMENTE como estão na foto de referência.
2. Não altere, distorça ou modifique o produto. Ele deve parecer real, nítido e idêntico à referência.
3. Posicione o produto de forma tridimensional e integrada com as sombras e reflexos adequados no cenário.
4. O texto ou rótulo do produto deve continuar legível e idêntico ao original.

DIRETRIZES DE ESTÉTICA FOTOGRÁFICA UGC:
- REGRA CRÍTICA DE PROIBIÇÃO DE TEXTOS (ABSOLUTELY NO TEXT - ZERO TOLERANCE): A imagem final gerada NÃO deve conter nenhum tipo de texto, palavra, letra, número, logotipo, marca d'água ou elemento gráfico escrito (como banners ou etiquetas). A imagem deve ser puramente fotográfica e limpa de qualquer tipografia. (English enforcement: Under no circumstances should any text, words, labels, letters, numbers, or logo graphics be rendered on the image. The output must be completely clean of any typography).
- REGRA CRÍTICA DE ENQUADRAMENTO (ABSOLUTELY NO CROPPED HEADS - ZERO TOLERANCE): Se houver uma pessoa ou modelo vestindo o produto, segurando o produto ou posando na cena, você deve OBRIGATORIAMENTE exibir a cabeça, cabelo e rosto completos do modelo dentro do enquadramento. Certifique-se de deixar um espaço livre generoso (clear headroom) acima da cabeça. NUNCA corte o topo da cabeça ou o cabelo pelas bordas da imagem. (English enforcement: The model's entire head, full hair, and face must be completely visible and fully contained within the frame, with no cutoff or clipping by the top borders of the canvas, ensuring a generous amount of empty space above the head).
- Integre o produto organicamente com iluminação profissional de estúdio ou natural de ambiente (ex: luz solar de janela suave).
- Simule captura fotográfica premium com câmera profissional de ponta e lente de 50mm ou 85mm.`;

  const HIBRIDO_PROMPT = `Você é um Diretor de Fotografia, Retratista Editorial e Ad Designer Sênior especializado em campanhas de UGC (User-Generated Content) de alto nível.
Com base nas duas imagens de referência fornecidas (Foto 1 e Foto 2), gere uma imagem comercial premium de estilo de vida realista (premium lifestyle portrait/ad) integrando ambos na cena.

DIRETRIZES DE ESTÉTICA FOTOGRÁFICA UGC A SEREM RIGOROSAMENTE SEGUIDAS:
- REGRA CRÍTICA DE PROIBIÇÃO DE TEXTOS (ABSOLUTELY NO TEXT - ZERO TOLERANCE): A imagem final gerada NÃO deve conter nenhum tipo de texto, palavra, letra, número, logotipo, marca d'água ou elemento gráfico escrito (como banners ou etiquetas). A imagem deve ser puramente fotográfica e limpa de qualquer tipografia. (English enforcement: Under no circumstances should any text, words, labels, letters, numbers, or logo graphics be rendered on the image. The output must be completely clean of any typography).
- REGRA CRÍTICA DE ENQUADRAMENTO (ABSOLUTELY NO CROPPED HEADS - ZERO TOLERANCE): Se a cena contiver uma pessoa ou modelo, você deve OBRIGATORIAMENTE exibir a cabeça, cabelo e rosto completos do modelo dentro do enquadramento. Deixe um espaço livre generoso (clear headroom) acima da cabeça. NUNCA corte o topo da cabeça ou o cabelo pelas bordas da imagem. (English enforcement: The model's entire head, full hair, and face must be completely visible and fully contained within the frame, with no cutoff or clipping by the top borders of the canvas, ensuring a generous amount of empty space above the head).
- Use iluminação natural profissional para criar profundidade tridimensional e separação de planos.
- Configure a composição como se fosse tirada por uma câmera profissional de ponta com lente de 50mm ou 85mm.
- Preserve texturas realistas e tangíveis. Evite artificialidades plásticas de inteligência artificial.

DIRETRIZES DE CRIAÇÃO HÍBRIDA DO SEU FLUXO:
[A REGRA DA OPÇÃO ESCOLHIDA É INJETADA AQUI NO CÓDIGO]`;

  const TEXTO_PROMPT = `[Workflow no n8n]
Você atua como um Head de Estratégia de Conteúdo e Copywriter Especialista em Conversão.
Analise os pilares editoriais da marca, o nicho de mercado e as descrições dos serviços/produtos.
Elabore 3 opções de imagens conceituais, legendas altamente persuasivas (AIDA/PAS), e sugira os títulos que devem ser escritos sobre a imagem para gerar identificação imediata com a persona.`;

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-6">
      <div className="mb-6 flex items-center gap-3">
        <Bot className="h-5 w-5 text-violet-400" />
        <h2 className="text-lg font-semibold text-white">Biblioteca de Prompts (Agentes IA)</h2>
      </div>
      <p className="mb-6 text-sm text-slate-400">
        Aqui estão os "cérebros" por trás das inteligências artificiais do app. Os prompts abaixo
        estão divididos exatamente conforme as opções da sua tela de geração.
      </p>

      <Accordion type="single" collapsible className="w-full space-y-4">
        {/* Botão Conceito */}
        <AccordionItem
          value="conceito"
          className="overflow-hidden rounded-lg border border-slate-700/50 bg-slate-900/50 px-4"
        >
          <AccordionTrigger className="text-slate-200 hover:text-white hover:no-underline">
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Botão: Gerar Imagem Conceito
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6 pt-2 text-slate-400">
            <p className="mb-4 text-xs">
              Este agente (Gemini/Claude) recebe a ideia e constrói o prompt avançado em inglês
              abaixo focando na estética UGC, evitando rostos cortados e repassando ao gerador de
              imagem (Flux Kontext).
            </p>
            <div className="relative rounded-md bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-300">
              <pre className="whitespace-pre-wrap">{UGC_PROMPT}</pre>
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
              Botão: Gerar com Foto de Produto
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6 pt-2 text-slate-400">
            <p className="mb-4 text-xs">
              Este prompt é acionado <strong>após</strong> o Bria remover o fundo da sua imagem. Ele
              instrui o Nano Banana Pro a preservar perfeitamente marcas e formatos originais,
              posicionando o item num cenário fotográfico de alto padrão.
            </p>
            <div className="relative rounded-md bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-300">
              <pre className="whitespace-pre-wrap">{PRODUTO_PROMPT}</pre>
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
              Botão: Geração Híbrida (Várias Opções)
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6 pt-2 text-slate-400">
            <p className="mb-4 text-xs">
              Neste fluxo, o sistema junta sua imagem com uma referência. O modelo entende
              prioridades com base no que você selecionou:
              <br />
              <br />- <strong>Opção A (Foco no Cenário):</strong> O prompt injeta ordens para manter
              o fundo da Foto 2 intacto.
              <br />- <strong>Opção B (Packshot/Produto):</strong> A IA é instruída a trocar (swap)
              o produto da Foto 2 pelo seu da Foto 1.
              <br />- <strong>Opção C (Foco na Pessoa):</strong> A pessoa é a heroína, mantendo
              máxima fidelidade facial, flexibilizando o resto.
            </p>
            <div className="relative rounded-md bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-300">
              <pre className="whitespace-pre-wrap">{HIBRIDO_PROMPT}</pre>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Gerador de Textos */}
        <AccordionItem
          value="textos"
          className="overflow-hidden rounded-lg border border-slate-700/50 bg-slate-900/50 px-4"
        >
          <AccordionTrigger className="text-slate-200 hover:text-white hover:no-underline">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-emerald-400" />
              Agente: Gerador de Ideias e Textos
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6 pt-2 text-slate-400">
            <p className="mb-4 text-xs">
              Este é o prompt mestre executado via n8n (nas etapas iniciais de criação do post) para
              formular o copy.
            </p>
            <div className="relative rounded-md bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-300">
              <pre className="whitespace-pre-wrap">{TEXTO_PROMPT}</pre>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
