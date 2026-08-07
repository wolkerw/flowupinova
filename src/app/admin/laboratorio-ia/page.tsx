"use client";

import React, { useState, useEffect } from "react";
import { FlaskConical, Image as ImageIcon, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LayoutStyleSelector, LayoutStyleId, LAYOUT_STYLES } from "../dashboard/conteudo/gerar/_components/LayoutStyleSelector";

const PROMPT_PRESETS = [
  {
    label: "Nenhum (Livre)",
    value: "Você é um especialista em Copywriting Sênior, Marketing e Diretor de Arte de redes sociais...\n(Preencha com o prompt de teste)"
  },
  {
    label: "Gerador de Imagem: Conceito (UGC / Contexto)",
    value: `You are an elite Creative Art Director, Ad Designer, and Prompt Engineer specialized in User-Generated Content (UGC) advertising and premium photographic product placement for image generation models (specifically Flux Kontext).

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
- Strictly avoid banned artificial buzzwords (e.g., do NOT use "photorealistic", "ultrarealistic", "4k").`
  },
  {
    label: "Gerador de Imagem: Foto de Produto",
    value: `Aqui está a foto de referência do produto (com fundo transparente/removido).
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
- Simule captura fotográfica premium com câmera profissional de ponta e lente de 50mm ou 85mm.`
  },
  {
    label: "Gerador de Imagem: Híbrida (Produto + Cenário)",
    value: `Você é um Diretor de Fotografia, Retratista Editorial e Ad Designer Sênior especializado em campanhas de UGC (User-Generated Content) de alto nível.
Com base nas duas imagens de referência fornecidas (Foto 1 e Foto 2), gere uma imagem comercial premium de estilo de vida realista (premium lifestyle portrait/ad) integrando ambos na cena.

DIRETRIZES DE ESTÉTICA FOTOGRÁFICA UGC A SEREM RIGOROSAMENTE SEGUIDAS:
- REGRA CRÍTICA DE PROIBIÇÃO DE TEXTOS (ABSOLUTELY NO TEXT - ZERO TOLERANCE): A imagem final gerada NÃO deve conter nenhum tipo de texto, palavra, letra, número, logotipo, marca d'água ou elemento gráfico escrito (como banners ou etiquetas). A imagem deve ser puramente fotográfica e limpa de qualquer tipografia. (English enforcement: Under no circumstances should any text, words, labels, letters, numbers, or logo graphics be rendered on the image. The output must be completely clean of any typography).
- REGRA CRÍTICA DE ENQUADRAMENTO (ABSOLUTELY NO CROPPED HEADS - ZERO TOLERANCE): Se a cena contiver uma pessoa ou modelo, você deve OBRIGATORIAMENTE exibir a cabeça, cabelo e rosto completos do modelo dentro do enquadramento. Deixe um espaço livre generoso (clear headroom) acima da cabeça. NUNCA corte o topo da cabeça ou o cabelo pelas bordas da imagem. (English enforcement: The model's entire head, full hair, and face must be completely visible and fully contained within the frame, with no cutoff or clipping by the top borders of the canvas, ensuring a generous amount of empty space above the head).
- Use iluminação natural profissional para criar profundidade tridimensional e separação de planos.
- Configure a composição como se fosse tirada por uma câmera profissional de ponta com lente de 50mm ou 85mm.
- Preserve texturas realistas e tangíveis. Evite artificialidades plásticas de inteligência artificial.

DIRETRIZES DE CRIAÇÃO HÍBRIDA DO SEU FLUXO:
[A REGRA DA OPÇÃO ESCOLHIDA É INJETADA AQUI NO CÓDIGO]`
  },
  {
    label: "Gerador de Ideias de Posts (Referência)",
    value: `Você é um especialista em Copywriting Sênior, Marketing e Diretor de Arte de redes sociais.
CONTEXTO TEMPORAL: Estamos no ano de [ANO], no mês de [MES]. Sempre utilize esse ano/contexto atual caso precise citar datas, anos ou campanhas promocionais sazonais. Nunca cite o ano de 2024.

Análise detalhadamente a imagem de inspiração visual (print de post) fornecida e a descrição enviada pelo usuário: "[DESCRICAO]".
Com base nessas informações e no perfil comercial do usuário informado abaixo, crie 3 propostas de publicações virais e estratégicas para o Instagram que herdem e adaptem o conceito visual, estilo estético, layout e tom de voz do print de referência para a realidade deste negócio.

[CONTEXTO_DO_NEGOCIO]

Instruções para cada uma das 3 propostas de posts:
1. "titulo": Crie um título extremamente curto (máx 45 caracteres), instigante e magnético (gancho comercial forte).
2. "subtitulo": Crie um parágrafo curto e dinâmico (1 a 2 frases) aprofundando a dica ou tema e fechando com uma chamada para ação (CTA) curta e atrativa.
3. "hashtags": Uma lista contendo de 3 a 5 hashtags muito relevantes para o nicho comercial da publicação.

Você DEVE responder exclusivamente no formato JSON abaixo, de forma estrita, sem qualquer explicação, introdução, conclusão ou blocos de marcação de código adicionais. Responda APENAS o JSON bruto:`
  },
  {
    label: "Melhorador de Textos",
    value: `Você é um especialista em Copywriting para Redes Sociais.
Sua tarefa é melhorar a legenda fornecida pelo usuário.
Diretrizes:
- Corrija erros gramaticais e deixe a leitura mais fluida, persuasiva e engajadora.
- Você tem total liberdade de inserir emojis e dar uma "animada" no tom de voz.
- Mantenha estritamente o CONTEXTO e a MENSAGEM PRINCIPAL solicitados.
- Traga sempre uma nova variação criativa e diferente, assumindo que se você foi chamado novamente para o mesmo tema, o usuário não gostou da versão anterior.
- DEVOLVA APENAS A LEGENDA FINAL. Não adicione comentários, aspas no início/fim, ou explicações. O seu texto será colado diretamente na caixa de edição do usuário.`
  },
  {
    label: "Copilot de Anúncios (Meta Ads)",
    value: `Você é um especialista em marketing digital da Meta (Facebook e Instagram) focado em pequenos e médios negócios locais brasileiros.
CONTEXTO TEMPORAL: Estamos no ano de [ANO]. Sempre utilize esse ano atual caso precise citar datas, anos ou campanhas promocionais sazonais. Nunca cite o ano de 2024.
Sua tarefa é criar títulos (headlines) magnéticos e copies altamente persuasivas para impulsionar um anúncio na região local.

INFORMAÇÕES DO NEGÓCIO:
- Nome do segmento: [SEGMENTO]
- Descrição da Empresa: [DESCRICAO_DA_EMPRESA]

CONTEXTO DO POST (SE HOUVER):
- Texto original da publicação a ser impulsionada: "[TEXTO_POST]"

OBJETIVO DA CAMPANHA:
- [OBJETIVO_DA_CAMPANHA]

INSTRUÇÕES DE ESCRITA:
- Use uma linguagem amigável, direta, cativante e focada nos benefícios (copywriting moderno).
- Não use jargões difíceis. Fale diretamente com as dores e desejos dos moradores da região.
- Os títulos (Headlines) devem ser curtos, marcantes e diretos (máximo 40 caracteres).
- Os textos (Ad Copies) devem conter no máximo 3 pequenos parágrafos, usar emojis de forma natural e incluir um forte Call to Action (CTA).
- Retorne exatamente 3 sugestões diferentes e criativas.

Você deve responder estritamente com um objeto JSON válido, sem markdown ou formatações extras, seguindo exatamente o seguinte esquema JSON:`
  },
  {
    label: "Extrator de Brand Kit (Leitor de PDF)",
    value: `Você é um especialista em Branding, Direção de Arte e Marketing Estratégico.
Analise detalhadamente o arquivo PDF de manual de marca (Brandbook / Guia de Estilo / Identidade Visual) fornecido e extraia as diretrizes fundamentais da marca.
Seu objetivo é sintetizar as diretrizes visuais e conceituais para que nosso app de Inteligência Artificial possa utilizá-las para gerar posts de texto e imagens publicitárias consistentes com a marca do cliente.

Caso alguma informação específica (como slogan ou público-alvo) não esteja escrita textualmente no PDF, faça uma inferência lógica e de alta qualidade profissional com base no posicionamento da marca exposto no documento.

Você DEVE responder obrigatoriamente no formato JSON abaixo, contendo exatamente os seguintes campos (valores em português do Brasil):`
  },
  {
    label: "Criador de Post Premium (Teste Manus)",
    value: `Você é o motor de IA da plataforma NumVapt, especialista em marketing digital de alta conversão. Sua missão é gerar posts publicitários de nível agência premium.
Como agente NumVapt, avalie o objetivo do usuário e selecione sempre o melhor motor de imagem e as melhores técnicas de fotografia comercial para garantir um resultado de nível profissional.

MAPA DE ESTILOS DISPONÍVEIS:
- Cinematográfico: fotografia cinematográfica, iluminação dramática, profundidade de campo
- Estúdio Clean: fotografia de estúdio, fundo neutro, iluminação suave e uniforme
- Urbano/Lifestyle: estilo lifestyle, ambiente urbano natural, luz do dia
- Minimalista: design minimalista, composição limpa, estética moderna e sofisticada
- Tecnologia 3D: estilo de ilustração 3D premium, renderização estilo Octane, cores vibrantes

REGRAS DE QUALIDADE VISUAL:
- Use o estilo: [ESTILO_SELECIONADO], 8k, iluminação profissional.
- As imagens devem ser realistas, evitando aspectos de ilustração ou desenho.

REGRAS DE TEXTO NA IMAGEM:
- O texto deve ser nítido, legível e com tipografia moderna.
- É OBRIGATÓRIO usar português correto, com todos os acentos e gramática perfeita.

TEXTO OBRIGATÓRIO PARA INSERIR NA ARTE: '[TEXTO_NA_ARTE]'
PROPORÇÃO DA IMAGEM: [ASPECT_RATIO]
OBJETIVO DO POST:`
  }
];

export default function LaboratorioIAPage() {
  const [model, setModel] = useState("gemini-3.5-flash");
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState(PROMPT_PRESETS[0].value);
  const [userPrompt, setUserPrompt] = useState(
    `Objetivo: Crie um post sobre jaquetas corta-vento para corrida\n` +
    `Texto obrigatório para estampar na arte: "NumVapt: Estratégia e tráfego para sua comunicação"\n` +
    `Formato: 4:5\n` +
    `Estilo visual: Cinematográfico`
  );
  
  const [prompts, setPrompts] = useState<{label: string; value: string}[]>(PROMPT_PRESETS);
  const [testLayoutStyle, setTestLayoutStyle] = useState<string>("");

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const res = await fetch("/api/admin/prompts");
        if (!res.ok) return;
        const data = await res.json();
        
        const dynamicPresets = [
          { label: "Gerador de Imagem: Conceito (UGC / Contexto)", value: data.ugc_prompt },
          { label: "Gerador de Imagem: Foto de Produto", value: data.produto_prompt },
          { label: "Gerador de Imagem: Híbrida (Produto + Cenário)", value: data.hibrido_prompt },
          { label: "Gerador de Ideias de Posts (Referência)", value: data.ideias_post_prompt },
          { label: "Melhorador de Textos", value: data.melhorar_texto_prompt },
          { label: "Copilot de Anúncios (Meta Ads)", value: data.copilot_ads_prompt },
        ];
        
        const merged = PROMPT_PRESETS.map(preset => {
          const matched = dynamicPresets.find(dp => dp.label === preset.label);
          if (matched && matched.value) {
            return { ...preset, value: matched.value };
          }
          return preset;
        });

        setPrompts(merged);
        
        // Se o sistema estiver com o default original e ele veio atualizado do banco, atualiza:
        if (systemPrompt === PROMPT_PRESETS[0].value && merged[0].value !== PROMPT_PRESETS[0].value) {
          setSystemPrompt(merged[0].value);
        }
      } catch (err) {
        console.error("Erro ao buscar prompts dinâmicos no laboratório", err);
      }
    };
    
    fetchPrompts();
  }, []);
  
  const [image1Url, setImage1Url] = useState<string | null>(null);
  const [image1Mime, setImage1Mime] = useState<string>("");
  const [image1Base64, setImage1Base64] = useState<string>("");

  const [image2Url, setImage2Url] = useState<string | null>(null);
  const [image2Mime, setImage2Mime] = useState<string>("");
  const [image2Base64, setImage2Base64] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setImageUrl: (url: string) => void,
    setMime: (mime: string) => void,
    setBase64: (base64: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setMime(file.type);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(",")[1];
        setBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunTest = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log("🚀 [Frontend] Iniciando requisição para nossa API local: POST /api/admin/laboratorio-ia");
      console.log("📦 Payload enviado:", { model, temperature });

      const response = await fetch("/api/admin/laboratorio-ia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature,
          systemPrompt,
          userPrompt,
          image1: image1Base64 ? { base64: image1Base64, mimeType: image1Mime } : null,
          image2: image2Base64 ? { base64: image2Base64, mimeType: image2Mime } : null,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.details 
          ? `${data.error}: ${typeof data.details === 'object' ? JSON.stringify(data.details) : data.details}`
          : (data.error || "Erro desconhecido");
        throw new Error(errorMsg);
      }

      if (data.pending && data.taskId) {
        // Entra em modo de Polling
        setResult({ message: data.message, taskId: data.taskId, status: "pending" });
        pollTaskStatus(data.taskId);
      } else {
        setResult(data.result);
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const pollTaskStatus = async (taskId: string) => {
    try {
      const res = await fetch(`/api/admin/laboratorio-ia/status?taskId=${taskId}`);
      const data = await res.json();
      
      if (data.status === "completed") {
        setResult(data.result);
        setIsLoading(false);
      } else if (data.status === "error") {
        setError(data.error || "Erro no processamento da Manus.");
        setIsLoading(false);
      } else {
        // Continua rodando
        setTimeout(() => pollTaskStatus(taskId), 5000);
      }
    } catch (err) {
      setTimeout(() => pollTaskStatus(taskId), 5000);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
          <FlaskConical className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laboratório IA</h1>
          <p className="text-gray-500">Ambiente seguro para testes de prompts e modelos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lado Esquerdo: Configurações */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-gray-800">1. Configurações do Modelo</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Modelo</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <optgroup label="Texto (Gemini)">
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                    <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                  </optgroup>
                  <optgroup label="Agentes (Manus)">
                    <option value="manus-1.6">Manus 1.6 (Agent)</option>
                    <option value="manus-1.6-lite">Manus 1.6 Lite</option>
                  </optgroup>
                  <optgroup label="Imagem (Nano Banana)">
                    <option value="gemini-3-pro-image">Gemini 3 Pro Image (Nano Banana Pro)</option>
                    <option value="gemini-3.1-flash-image">Gemini 3.1 Flash Image (Fallback 1)</option>
                    <option value="gemini-3.5-flash-image">Gemini 3.5 Flash Image (Fallback 2)</option>
                  </optgroup>
                  <optgroup label="Imagem (Imagen 4)">
                    <option value="imagen-4.0-ultra-generate-001">Imagen 4.0 Ultra</option>
                    <option value="imagen-4.0-fast-generate-001">Imagen 4.0 Fast (Fallback)</option>
                  </optgroup>
                  <optgroup label="Imagem (OpenAI)">
                    <option value="gpt-image-2">GPT Image 2</option>
                    <option value="chatgpt-image-latest">ChatGPT Image Latest</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Temperature: {temperature}</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full mt-2"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">2. Prompt de Sistema (Instruções)</h2>
              <select
                className="rounded-md border border-gray-300 p-1.5 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 max-w-[200px]"
                defaultValue=""
                onChange={(e) => {
                  const preset = prompts.find(p => p.label === e.target.value);
                  if (preset) setSystemPrompt(preset.value);
                }}
              >
                <option value="" disabled>Carregar prompt original...</option>
                {prompts.map((preset, index) => (
                  <option key={index} value={preset.label}>{preset.label}</option>
                ))}
              </select>
            </div>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="h-48 font-mono text-xs"
              placeholder="Digite o system prompt aqui..."
            />
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-gray-800">3. Prompt do Usuário (Objetivo)</h2>
            <Textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              className="h-24 font-mono text-xs"
              placeholder="Digite o objetivo ou texto de entrada..."
            />
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-gray-800">4. Imagens de Contexto (Opcional)</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center gap-2">
                <label className="text-sm font-medium">Foto 1</label>
                <div className="relative flex h-32 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setImage1Url, setImage1Mime, setImage1Base64)}
                    className="absolute inset-0 z-10 cursor-pointer opacity-0"
                  />
                  {image1Url ? (
                    <img src={image1Url} alt="Img 1" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <label className="text-sm font-medium">Foto 2</label>
                <div className="relative flex h-32 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setImage2Url, setImage2Mime, setImage2Base64)}
                    className="absolute inset-0 z-10 cursor-pointer opacity-0"
                  />
                  {image2Url ? (
                    <img src={image2Url} alt="Img 2" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-gray-800">5. Seletor de Estilo de Layout (Teste)</h2>
            <LayoutStyleSelector
              value={testLayoutStyle}
              onChange={(style) => setTestLayoutStyle(style)}
            />
            {testLayoutStyle && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3 w-full"
                onClick={() => {
                  const styleDesc = LAYOUT_STYLES.find((s) => s.id === testLayoutStyle)?.description;
                  if (styleDesc) {
                    setSystemPrompt(prev => prev + "\n\n" + styleDesc);
                  }
                }}
              >
                Adicionar regra de estilo ao System Prompt
              </Button>
            )}
          </div>

          <Button 
            onClick={handleRunTest} 
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />}
            Rodar Teste de IA
          </Button>
        </div>

        {/* Lado Direito: Resultados */}
        <div className="rounded-xl border bg-gray-900 p-5 shadow-sm text-gray-100 flex flex-col h-full">
          <h2 className="mb-4 font-semibold text-gray-100 flex items-center gap-2">
            <FlaskConical className="h-4 w-4" /> 
            Resultado da Execução
          </h2>
          
          {isLoading && (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-md bg-red-900/50 border border-red-500 p-4 text-red-200">
              <p className="font-bold">Erro na Execução:</p>
              <p className="mt-1 font-mono text-sm">{error}</p>
            </div>
          )}

          {!isLoading && result && (
            <div className="flex-1 flex flex-col gap-4 overflow-auto rounded-md bg-black p-4 font-mono text-sm text-green-400">
              {result.imageUrl && (
                <div className="w-full flex justify-center bg-gray-800 p-2 rounded-md">
                  <img src={result.imageUrl} alt="Imagem gerada" className="max-h-[400px] object-contain rounded-md shadow-md" />
                </div>
              )}
              {!result.imageUrl && (
                <pre className="whitespace-pre-wrap">{typeof result === 'object' ? JSON.stringify(result, null, 2) : result}</pre>
              )}
            </div>
          )}

          {!isLoading && !error && !result && (
            <div className="flex flex-1 items-center justify-center text-gray-500 text-sm">
              Configure o teste ao lado e clique em Rodar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
