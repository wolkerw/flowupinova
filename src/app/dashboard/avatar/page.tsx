"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  Upload,
  User,
  Sparkles,
  ArrowRight,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Info,
  HelpCircle,
} from "lucide-react";
import Image from "next/image";

const SUGGESTIONS = [
  // Categoria: corporate
  {
    label: "Terno no Escritório",
    category: "corporate",
    gender: "male",
    text: "vestindo terno cinza moderno com camisa branca, em um escritório corporativo iluminado com fundo suavemente desfocado",
  },
  {
    label: "Blazer Azul",
    category: "corporate",
    gender: "female",
    text: "vestindo blazer azul marinho elegante sobre blusa social, em uma biblioteca de madeira clássica com iluminação quente de estúdio",
  },
  {
    label: "Blazer na Rua",
    category: "corporate",
    gender: "male",
    text: "vestindo blazer bege esporte fino com camisa polo, em um ambiente externo urbano de negócios desfocado com luz natural do sol",
  },
  {
    label: "Terno Preto",
    category: "corporate",
    gender: "male",
    text: "vestindo terno preto completo com gravata, em estúdio profissional com fundo cinza neutro e luz de estúdio tridimensional",
  },
  {
    label: "Estilo Líder",
    category: "corporate",
    gender: "male",
    text: "Crie um retrato sóbrio e autoritário de um homem. MANTENHA AS CARACTERÍSTICAS FACIAIS IGUAIS À FOTO ORIGINAL. A pessoa está sentada ou em pé, imóvel, com o corpo perfeitamente equilibrado, ombros relaxados e coluna reta. As mãos devem estar visíveis e compostas, descansando juntas ou relaxadas no colo. A cabeça está levemente inclinada para frente, os olhos firmes e a expressão é séria, mas humana. Roupa: terno azul-marinho, camisa azul-clara, estilo minimalista. Fundo: espaço amplo e minimalista ou um degradê suave que transmita escala e responsabilidade. Iluminação: suave, naturalista, como luz de dia nublado, sem drama e sem brilho excessivo. Câmera: Nikon Z8, lente 85mm, Deep Tone Control. Clima: confiança, liderança, credibilidade e poder silencioso. Prompt negativo: sem exagero de moda, sem iluminação teatral, sem sorriso forçado, sem alteração facial, sem ruído, sem texto.",
  },
  {
    label: "Profissional Leve",
    category: "corporate",
    gender: "female",
    text: "Crie um retrato profissional, acolhedor e iluminado de uma mulher. MANTENHA AS CARACTERÍSTICAS FACIAIS IGUAIS À FOTO ORIGINAL. A pessoa está em pé, com os braços relaxados ao lado do corpo e os ombros soltos. Uma leve inclinação em direção à câmera deve transmitir proximidade e simpatia. Um sorriso amigável e olhos abertos e receptivos são essenciais. Roupa: blazer claro com camisa em tom pastel. Fundo: interior neutro e suave. Iluminação: luz natural de janela. Câmera: Canon EOS R5, lente 85mm. Prompt negativo: sem alteração facial, sem mudança de idade, sem mudança de peso, sem distorção corporal, sem caricatura, sem filtro de beleza, sem excesso de suavização na pele, sem desfoque, sem ruído, sem texto, sem logos, sem marca d’água, sem artefatos.",
  },
  {
    label: "No Computador",
    category: "corporate",
    gender: "neutral",
    text: "Transforme esta imagem em uma foto com props da marca pessoal. Objetos: adicione caneca personalizada, livro, notebook ou material de marca com logotipo visível de forma discreta. Fundo: clean em tons claros, ou cenário de escritório minimalista. Roupa: look casual-profissional. Iluminação: clara e suave. Preserve identidade facial e expressão natural. Estilo final: foto profissional de branding pessoal para materiais digitais.",
  },
  {
    label: "Roupa Preta Elegante",
    category: "corporate",
    gender: "female",
    text: "Usando a foto como referência Crie um retrato hiper-realista em alta resolução, com qualidade de estúdio profissional e iluminação suave, limpa e bem direcionada. A cena mostra uma mulher sentada, em pose elegante e sofisticada, com a mão apoiando levemente o rosto enquanto a outra descansa sobre a perna. A mulher tem cabelos castanhos escuros longos, levemente ondulados, com mechas nas pontas, iluminados com brilho natural. Ela usa maquiagem elegante com sobrancelhas definidas, olhos suaves e lábios nude. O look é totalmente preto, composto por uma blusa preta transparente com textura delicada, mangas longas e gola alta, combinada com uma calça preta fluida. Os acessórios dourados chamativos: brincos, pulseiras e anéis medianos e modernos. O fundo é escuro e minimalista, destacando a figura e reforçando o estilo editorial. A foto deve transmitir um clima sofisticado, moderno e de moda, com estética elegante e olhar confiante. Formato: Retrato hiper-realista, nítido, textura detalhada, iluminação premium de estúdio, estilo editorial de alta moda.",
  },
  {
    label: "Blazer Branco",
    category: "corporate",
    gender: "female",
    text: "Usando a foto como referência crie um Retrato profissional feminino em estúdio minimalista, qualidade ultra realista 8K, iluminação suave e difusa. A mulher tem cabelos castanhos-escuros longos e ondulados, com mechas mais claras nas pontas (mesmo com o cabelo preso, manter essas características na criação). Pele impecável e iluminada, maquiagem elegante com sobrancelhas definidas, olhos suaves e lábios nude. Ela usa um blazer branco estruturado, transmitindo elegância e profissionalismo. Acessórios dourados chamativos: brincos, pulseiras e anéis grandes. Suas mãos estão posicionadas próximas ao rosto, em pose sofisticada e confiante, com unhas esmaltadas em tom nude acinzentado. Fundo neutro em tom claro, estética clean, foco nítido no rosto e nas mãos, textura da pele detalhada, estilo editorial de moda e fotografia de luxo em alta resolução 8K",
  },
  {
    label: "Com Laptop na Poltrona",
    category: "corporate",
    gender: "female",
    text: "Usando a mesma foto é mulher que me enviou como referência Crie um retrato hiper-realista em alta resolução, com qualidade de estúdio profissional e iluminação suave, limpa e bem distribuída. A cena mostra uma mulher sentada em uma poltrona de couro marrom, usando um MacBook prateado apoiado no colo enquanto segura uma caneta digital branca na mão. A mulher tem cabelos castanhos escuros longos e ondulados, com mechas nas pontas, com brilho natural e ondas bem definidas. Ela usa maquiagem elegante com sobrancelhas definidas, olhos suaves e lábios nude. O look é totalmente preto, composto por uma blusa preta transparente com textura delicada, mangas longas e gola alta, combinada com uma calça preta fluida. Os acessórios dourados chamativos: brincos, pulseiras e anéis medianos e modernos. O fundo é neutro e escuro, com visual minimalista, reforçando a atmosfera de ensaio fotográfico editorial. A imagem deve transmitir profissionalismo, sofisticação e estética moderna, com foco na postura segura e no estilo empresarial elegante. Formato: Foto hiper-realista, nítida, textura detalhada, iluminação premium de estúdio, estilo editorial moderno, look profissional.",
  },
  {
    label: "Alfaiataria Branca",
    category: "corporate",
    gender: "female",
    text: "Usando a mesma foto como referência, crie um retrato feminino hiper-realista em qualidade ultra profissional 8K. A mulher tem cabelos castanho-escuros longos e ondulados, com mechas mais claras nas pontas (mesmo estando presos no penteado). Pele iluminada, textura natural e maquiagem elegante, com sobrancelhas definidas e lábios em tom nude. Ela usa um conjunto de alfaiataria branco sofisticado — blazer estruturado e calça de corte clássico. Acessórios dourados chamativos: brincos, braceletes, anéis e detalhes metálicos. A pose transmite autoridade e elegância: sentada em uma poltrona, tronco levemente inclinado, uma mão apoiada no rosto e a outra sobre o braço da cadeira. Plano de fundo em tom marrom escuro, iluminação suave e difusa em estilo editorial de revista de luxo. Atmosfera profissional e refinada, profundidade de campo curta, contraste equilibrado e estilo fotográfico premium.",
  },
  {
    label: "Preto na Poltrona",
    category: "corporate",
    gender: "female",
    text: "Usando a mesma foto e mulher que me enviou como referência Crie um retrato hiper-realista e profissional em alta resolução, com qualidade fotográfica de estúdio (iluminação suave, nítida e equilibrada). A cena mostra uma mulher sentada em uma poltrona de couro marrom, com pose elegante e confiante. Uma mão apoiada sobre a perna e a outra mão no braço da poltrona. A mulher tem cabelos castanhos escuros longos, ondulados, com mechas nas pontas, caindo naturalmente sobre os ombros. A mulher tem cabelos castanhos escuros longos, levemente ondulados, com mechas nas pontas, iluminados com brilho natural. Ela usa maquiagem elegante com sobrancelhas definidas, olhos suaves e lábios nude. O look é totalmente preto, composto por uma blusa preta transparente com textura delicada, mangas longas e gola alta, combinada com uma calça preta fluida. Os acessórios dourados chamativos: brincos, pulseiras e anéis medianos e modernos. A pose mostra uma mão encostada suavemente no rosto e a outra apoiada na poltrona, transmitindo segurança, elegância e presença de moda. O fundo é neutro, escuro e limpo, reforçando o estilo editorial e o clima de ensaio fotográfico de alto padrão. Formato desejado: foto hiper-realista, nítida, iluminada profissionalmente, estética editorial de moda, alta qualidade.",
  },
  {
    label: "Blazer Branco de Perfil",
    category: "corporate",
    gender: "female",
    text: "Usando a mesma Foto como referência crie um retrato realista em altíssima qualidade (8K), iluminação suave e profissional em estúdio com fundo escuro. Mulher de perfil, com postura elegante e confiante. Ela tem cabelos castanhos escuros, longos e levemente ondulados, com mechas mais claras nas pontas (mesmo estando presos no penteado) O cabelo está penteado para trás, bem alinhado. A mulher veste um blazer branco estruturado, bem ajustado ao corpo, transmitindo elegância corporativa. Ela está com um braço cruzado e o outro levemente levantado, segurando delicadamente os dedos, criando uma pose sofisticada. Usa brincos dourados volumosos e anéis dourados. Sua expressão é séria e contemplativa, olhando para frente. Fotografia com foco nítido, textura suave de pele, sombras dramáticas e contraste equilibrado, estilo editorial fashion.",
  },
  {
    label: "Blazer Branco na Mesa",
    category: "corporate",
    gender: "female",
    text: "Usando a mesma foto como referência, crie um retrato feminino hiper-realista de qualidade profissional 8K. A mulher tem cabelos castanho-escuros longos e ondulados, com mechas mais claras nas pontas (mesmo estando presos no penteado). A pele é iluminada, com textura natural e maquiagem elegante em tons neutros. Ela usa um blazer branco estruturado e acessórios dourados volumosos, como braceletes, anéis e brincos sofisticados. Está posicionada sentada à mesa, com as mãos cruzadas à frente e olhar levemente direcionado para a lateral, transmitindo confiança e autoridade. O fundo é marrom escuro com textura suave, iluminação difusa em estilo editorial de revista de luxo, contraste equilibrado e profundidade de campo curta. Estética minimalista e refinada, mantendo realismo extremo e atmosfera profissional.",
  },

  // Categoria: creative
  {
    label: "Camisa Branca",
    category: "creative",
    gender: "female",
    text: "Black and white fine art portrait of a young woman, long slightly messy hair framing her delicate face, smooth fair skin, wearing an oversized white shirt. Pose: sitting with one hand resting gently under her chin, looking at the camera with a calm and thoughtful expression. Studio setting with plain grey backdrop, soft cinematic lighting, minimalistic composition. Ultra realistic, sharp facial details, natural textures, elegant and sophisticated style. Professional photography, 8K quality, high contrast monochrome aesthetic.",
  },
  {
    label: "Gola Alta",
    category: "creative",
    gender: "female",
    text: "High-end, ultra-realistic black-and-white portrait of a young woman, medium-close shot (head and upper torso), facing slightly toward camera with a calm, confident expression. Her long hair falls naturally over the shoulders with subtle loose waves and delicate rim light defining the strands. Lighting: dramatic studio setup with a single soft key light from camera left creating smooth shadows on the right side of the face, plus a subtle hair light from behind to outline the silhouette. Wardrobe: black turtleneck sweater, matte texture absorbing light for strong separation from the dark, seamless background. Skin rendered with natural texture and balanced highlights, no airbrushing. Background: pure black, no details, giving full isolation and high contrast. Lens: 85 mm prime at f/1.8 for shallow depth of field and creamy falloff. Overall style: elegant monochrome, wide dynamic range, crisp detail and soft gradients for a classic fine-art studio portrait.",
  },
  {
    label: "Preto e Branco",
    category: "creative",
    gender: "male",
    text: "Crie um retrato cinematográfico hiper-realista em preto e branco, estilo chiaroscuro, de um homem. A pessoa está sentada em ângulo de três quartos, levemente inclinada para frente, com postura relaxada, mas dominante. O rosto está levemente virado para fora da câmera, sem olhar diretamente para a lente. Um lado do rosto deve estar fortemente iluminado, enquanto o outro desaparece em uma sombra preta profunda e aveludada. A expressão é contemplativa. As mãos estão próximas ao peito, em uma pose natural e precisa, com os dedos suavemente entrelaçados. Um dos pulsos mostra um relógio cronógrafo preto de luxo com pulseira metálica detalhada. Uma das mãos usa um anel prateado discreto. A pessoa veste um blazer preto elegante sobre uma camisa branca social com os primeiros botões abertos. Fundo: preto sólido, sem emendas. Iluminação: luz de estúdio forte e direcional, com contraste rico e sombras limpas. Destaque detalhes como fios de cabelo, textura da pele, barba se houver, brilho dos olhos, rosto do relógio, reflexos da pulseira metálica e anel prateado. Lente: retrato 85mm, profundidade de campo rasa, fotografia comercial premium, foco ultra nítido. Prompt negativo: sem pele artificial, sem dedos extras, sem mãos distorcidas, sem anatomia errada.",
  },
  {
    label: "Estilo Cinema",
    category: "creative",
    gender: "male",
    text: "Crie um retrato altamente cinematográfico de um homem, preservando 100% das características faciais e proporções naturais. A pessoa usa uma camiseta branca por baixo de uma jaqueta de couro azul, com textura realista de tecido e reflexos suaves de luz. O fundo tem um degradê de estúdio suave, indo do escuro na parte superior para um tom mais claro na parte inferior, criando profundidade and contraste ao redor da pessoa. A iluminação é suave, difusa e cinematográfica, com pontos de luz equilibrados que definem o rosto e sombras sutis que adicionam realismo e drama. A composição é perfeitamente centralizada, transmitindo intimidade, profundidade emocional e um tom editorial elegante.",
  },
  {
    label: "Jaqueta Moderna",
    category: "creative",
    gender: "neutral",
    text: "Ultra-realistic, highly detailed 8K cinematic wide shot of a contemporary figure modeling a stylized deep-purple puffer jacket. Half-body framing, subject slightly off-center to the left, looking directly at the viewer with a neutral, intense expression. The hood is down, not covering the head. The jacket features a large white Nike swoosh on the right side of the hood, a bright green smiley patch near it, and The North Face logo on the left chest, with additional subtle graphic symbols on the arms and torso. The subject is wearing sleek, modern sport sunglasses. Background is a vibrant urban gradient from deep purple to warm orange, with distressed white graffiti adding texture. Add the word 'PROMPT' in the background using the exact same font style, texture, size impression, and visual treatment as the existing graffiti text. Lighting combines cool purple light from the left and warm orange light from the right, creating dramatic rim lighting and high contrast. Electric purples, orange accents, vivid green, and clean white logos dominate the palette. Studio-quality photography with crisp sharpness, shallow depth of field, and a confident, high-fashion streetwear mood. Remove any tiny letters or micro-text from the sports sunglasses; change nothing else.",
  },
  {
    label: "Luzes Coloridas",
    category: "creative",
    gender: "neutral",
    text: "Hyper-realistic portrait of a person with short textured dark hair, wearing futuristic cyberpunk sunglasses - mirrored neon lenses, continuous visor-like surface, translucent glow and holographic reflections. Night urban neon environment, low-angle cinematic shot, looking upward with confident expression. Strong orange and cyan neon reflections on the face and futuristic glasses high contrast warm-cold color palette. Ultra-detailed skin texture, intense light reflections and glass clarity. Defocused neon background with cinematic bokeh, immersive cyberpunk city vibe. HDR lighting, micro-detail realism, glowing highlights, futuristic editorial style. 8K resolution, 50mm f/1.2, shallow DOF, extreme sharpness, neon color grading, bold reflective lens flare. Parameters: futuristic neon visor glasses, ultra-realistic, HDR, neon glow reflections, extreme sharpness, cyberpunk cinematic, 8K, low-angle powerful shot, bokeh lights.",
  },
  {
    label: "Sol e Palmeiras",
    category: "creative",
    gender: "neutral",
    text: "An ultra-realistic, highly detailed, 8K, cinematic medium-shot portrait captures a confident individual, facing slightly to the right with a contemplative gaze. The subject is wearing stylish dark circular sunglasses with a subtle brown tortoise shell pattern, a simple black short-sleeved t-shirt with 'Brooklyn 1999' inscribed in white font on the chest, and beige or light khaki trousers. One hand is casually placed in a trouser pocket, revealing a detailed silver-toned wristwatch with a rectangular face and a patterned metal strap on the wrist, and a visible bicep tattoo on the forearm. The composition features a shallow depth of field, with the subject in sharp focus against a beautifully diffused, sun-drenched tropical background. Golden hour lighting creates a radiant rim light around the subject's head, shoulders, and along the contour of the arm and watch, emphasizing their silhouette. The sun, partially obscured by the subject's head and the background foliage, produces a striking lens flare and warm, luminous bokeh effects throughout the background. The dominant colors are the rich, golden-orange hues of sunset contrasting with the dark green and brown tones of the tropical palm trees and lush foliage. The overall mood is warm, serene, and sophisticated, with a touch of urban cool. The textures of the t-shirt appear soft and slightly creased, while the metallic sheen of the wristwatch is subtly rendered. This shot embodies a professional photographic style, reminiscent of high-end editorial or lifestyle imagery.",
  },
  {
    label: "Cidade à Noite",
    category: "creative",
    gender: "neutral",
    text: "Transforme esta foto em uma imagem corporativa futurista estilo Ásia moderna. Cenário: skyline iluminado de Tóquio ou Hong Kong à noite, com letreiros neon e arranha-céus tecnológicos. Pose: postura firme, expressão de liderança. Roupa: terno executivo ou blazer sofisticado, textura realista. Iluminação: neon refletindo no cenário, mantendo consistência no rosto. Preserve identidade facial com precisão molecular e mantenha a fisionomia facial da foto original. Estilo final: foto corporativa futurista, ideal para branding global e inovação.",
  },
  {
    label: "Fundo Colorido",
    category: "creative",
    gender: "neutral",
    text: "Transforme esta imagem em uma foto de estúdio criativo. Fundo: paredes coloridas (rosa, azul, amarelo, conforme estética desejada). Roupa: look moderno e estilizado (blazer colorido, roupa minimalista, vestido geométrico). Iluminação: forte e clara, realçando cores. Pose: descontraída, leve sorriso ou olhar confiante. Preserve identidade facial e microdetalhes. Estilo final: ensaio artístico em estúdio criativo, ideal para branding moderno. Mantenha a fisionomia facial da foto original para ficar mais realista.",
  },

  // Categoria: pose
  {
    label: "Caminhando na Rua",
    category: "pose",
    gender: "neutral",
    text: "Transforme esta imagem em uma foto caminhando em rua urbana moderna. Cenário: cidade contemporânea, prédios de vidro, ruas limpas. Roupa: look casual elegante (blazer leve, jeans estiloso, vestido urbano). Iluminação: natural clara, estilo fotografia editorial de rua. Preserve identidade, proporções e movimento original. Estilo final: ensaio urbano de estilo casual chic.",
  },
  {
    label: "Apontando para o Lado",
    category: "pose",
    gender: "neutral",
    text: "Transforme esta imagem em uma foto com cenário minimalista para posts carrossel. Fundo: sólido em cor única (branco, cinza claro, azul pastel). Pose: neutra ou com gesto de apontar, deixando espaço lateral livre para texto. Roupa: look casual-profissional em contraste com o fundo. Iluminação: uniforme e clara. Preserve identidade facial, microdetalhes e mantenha a fisionomia facial da foto original para ficar mais realista. Estilo final: foto clean e versátil para design de posts e anúncios.",
  },
  {
    label: "Apontando para Cima",
    category: "pose",
    gender: "neutral",
    text: "Transforme esta foto em uma imagem com gesto de call-to-action. Pose: ajuste uma das mãos apontando para cima ou para o lado, deixando espaço livre no fundo para adicionar textos. Roupa: look casual-profissional. Fundo: sólido (branco, cinza claro ou azul), minimalista para facilitar design gráfico. Iluminação: clara e uniforme. Preserve identidade e naturalidade da expressão, mantendo a fisionomia facial da foto original para ficar mais realista. Estilo final: foto para uso em anúncios, banners e páginas de vendas.",
  },
  {
    label: "Fundo Moderno",
    category: "pose",
    gender: "neutral",
    text: "Transforme esta imagem em uma foto futurista estilo cyberpunk. Fundo: cidade noturna iluminada com neon (azul, roxo, rosa). Roupa: look futurista ou adaptado (jaqueta moderna, blazer estilizado). Iluminação: intensa, com reflexos neon consistentes. Preserve identidade facial e proporções originais. Estilo final: ensaio criativo de estética futurista e tecnológica. Mantenha a fisionomia facial da foto original para ficar mais realista.",
  },
];

const LOADING_STEPS = [
  "Fazendo upload da sua foto de referência...",
  "Analisando feições e contornos anatômicos do rosto...",
  "Projetando a nova vestimenta corporativa profissional...",
  "Montando o cenário de fundo com desfoque de lente...",
  "Ajustando iluminação de estúdio tridimensional...",
  "Finalizando seu retrato profissional de alta resolução...",
];

export default function AvatarPage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [styleFile, setStyleFile] = useState<File | null>(null);
  const [stylePreviewUrl, setStylePreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"corporate" | "creative" | "pose">("corporate");
  const [selectedGender, setSelectedGender] = useState<"male" | "female">("female");
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const styleFileInputRef = useRef<HTMLInputElement>(null);

  // Intervalo para alternar mensagens no loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Limpa o prompt se a foto de estilo for selecionada (não permitindo usar a etapa 2 simultaneamente)
  useEffect(() => {
    if (styleFile) {
      setPrompt("");
    }
  }, [styleFile]);

  // Efeito de controle de progresso circular no loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 98) return 98;
          let increment = 0;
          if (prev < 15) increment = 1.5;
          else if (prev < 35) increment = 1.0;
          else if (prev < 60) increment = 0.6;
          else if (prev < 80) increment = 0.3;
          else if (prev < 90) increment = 0.15;
          else increment = 0.05;

          const nextVal = prev + increment;
          return nextVal > 98 ? 98 : nextVal;
        });
      }, 100);
    } else {
      if (resultUrl) {
        setProgress(100);
      } else {
        setProgress(0);
      }
    }
    return () => clearInterval(interval);
  }, [loading, resultUrl]);

  // Mapeamento dinâmico de frases de carregamento de avatar baseado no progresso
  const getLoaderMessage = () => {
    if (progress >= 100) return "Seu retrato profissional está pronto! 🎉";
    if (progress >= 90) return LOADING_STEPS[5]; // "Finalizando seu retrato profissional de alta resolução..."
    if (progress >= 75) return LOADING_STEPS[4]; // "Ajustando iluminação de estúdio tridimensional..."
    if (progress >= 60) return LOADING_STEPS[3]; // "Montando o cenário de fundo com desfoque de lente..."
    if (progress >= 40) return LOADING_STEPS[2]; // "Projetando a nova vestimenta corporativa profissional..."
    if (progress >= 20) return LOADING_STEPS[1]; // "Analisando feições e contornos anatômicos do rosto..."
    return LOADING_STEPS[0]; // "Fazendo upload da sua foto de referência..."
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        setError("Por favor, selecione um arquivo de imagem válido (PNG ou JPG).");
        return;
      }
      if (selectedFile.size > 8 * 1024 * 1024) {
        setError("A imagem é muito grande. O limite máximo é de 8MB.");
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError(null);
      setResultUrl(null);
      setSuccess(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const selectedFile = e.dataTransfer.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        setError("Por favor, solte um arquivo de imagem válido (PNG ou JPG).");
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError(null);
      setResultUrl(null);
      setSuccess(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleStyleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        setError("Por favor, selecione uma foto de estilo válida (PNG ou JPG).");
        return;
      }
      if (selectedFile.size > 8 * 1024 * 1024) {
        setError("A foto de estilo é muito grande. O limite máximo é de 8MB.");
        return;
      }
      setStyleFile(selectedFile);
      setStylePreviewUrl(URL.createObjectURL(selectedFile));
      setError(null);
      setResultUrl(null);
      setSuccess(false);
    }
  };

  const handleStyleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const selectedFile = e.dataTransfer.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        setError("Por favor, solte uma foto de estilo válida (PNG ou JPG).");
        return;
      }
      setStyleFile(selectedFile);
      setStylePreviewUrl(URL.createObjectURL(selectedFile));
      setError(null);
      setResultUrl(null);
      setSuccess(false);
    }
  };

  const triggerStyleFileInput = () => {
    styleFileInputRef.current?.click();
  };

  const handleGenerate = async () => {
    if (!file || (!prompt.trim() && !styleFile) || !user) {
      setError("Por favor, selecione a sua selfie e descreva o estilo ou envie uma foto profissional de estilo.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("prompt", prompt.trim());
      formData.append("userId", user.uid);
      if (styleFile) {
        formData.append("styleFile", styleFile);
      }

      const res = await fetch("/api/avatar/generate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro na geração do avatar.");
      }

      setResultUrl(data.url);
      setSuccess(true);
    } catch (err: any) {
      console.error("[AVATAR_CLIENT_ERROR]", err);
      setError(err.message || "Falha ao processar o avatar. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setPreviewUrl(null);
    setPrompt("");
    setStyleFile(null);
    setStylePreviewUrl(null);
    setResultUrl(null);
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6">
      {/* Estilos locais para animações específicas do scanner */}
      <style>{`
        @keyframes scanline {
          0% { top: 0%; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scanline {
          animation: scanline 3s linear infinite;
        }
      `}</style>

      {/* Cabeçalho Premium com Efeito Glow */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/15 bg-slate-900/40 p-6 md:p-8 backdrop-blur-md shadow-2xl">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative z-10 space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
            Retrato <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-accent bg-clip-text text-transparent">Profissional IA</span>
          </h1>
          <p className="max-w-2xl text-sm md:text-base text-slate-300">
            Transforme uma selfie comum em um retrato corporativo e profissional realista de estúdio usando IA de ponta.
          </p>
        </div>
      </div>

      {/* Grid de Configurações Lado a Lado (Etapa 1 e 2) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bloco 1: Fotos de Referência */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 backdrop-blur-md shadow-2xl space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-sky-400 ring-1 ring-primary/30">
                1
              </span>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Envie as Fotos de Referência
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Coluna 1: Foto do Rosto */}
              <div className="space-y-3">
                <label className="h-8 flex items-end text-xs font-bold text-slate-300 uppercase tracking-wider leading-tight">
                  Foto do Rosto (Selfie - Obrigatório)
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                  className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-300 min-h-[200px] ${
                    previewUrl
                      ? "border-primary bg-sky-950/10 shadow-[0_0_15px_rgba(0,131,199,0.15)]"
                      : "border-slate-800 bg-slate-950/40 hover:border-primary/60 hover:bg-sky-950/5 hover:shadow-[0_0_20px_rgba(0,131,199,0.05)]"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  {previewUrl ? (
                    <div className="space-y-3">
                      <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full border-4 border-primary shadow-md">
                        <img
                          src={previewUrl}
                          alt="Referência"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-300 truncate max-w-[150px] mx-auto font-medium">
                          Carregada: <span className="font-semibold text-white">{file?.name}</span>
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerFileInput();
                          }}
                          className="mt-2 rounded-lg bg-primary/20 px-3 py-1 text-[11px] font-semibold text-sky-300 transition-colors hover:bg-primary/30 hover:text-white"
                        >
                          Alterar Foto
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-400 transition-colors group-hover:bg-primary/20 group-hover:text-sky-400 group-hover:border-primary/30">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">
                          Selfie do seu Rosto
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          Clique ou solte a foto aqui
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Coluna 2: Foto de Estilo (Opcional) */}
              <div className="space-y-3">
                <label className="h-8 flex items-end text-xs font-bold text-slate-300 uppercase tracking-wider leading-tight">
                  Foto de Estilo (Opcional)
                </label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleStyleDrop}
                  onClick={triggerStyleFileInput}
                  className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-300 min-h-[200px] ${
                    stylePreviewUrl
                      ? "border-primary bg-sky-950/10 shadow-[0_0_15px_rgba(0,131,199,0.15)]"
                      : "border-slate-800 bg-slate-950/40 hover:border-primary/60 hover:bg-sky-950/5 hover:shadow-[0_0_20px_rgba(0,131,199,0.05)]"
                  }`}
                >
                  <input
                    type="file"
                    ref={styleFileInputRef}
                    onChange={handleStyleFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  {stylePreviewUrl ? (
                    <div className="space-y-3">
                      <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-xl border-4 border-primary shadow-md">
                        <img
                          src={stylePreviewUrl}
                          alt="Estilo de Referência"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-300 truncate max-w-[150px] mx-auto font-medium">
                          Carregado: <span className="font-semibold text-white">{styleFile?.name}</span>
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerStyleFileInput();
                          }}
                          className="mt-2 rounded-lg bg-primary/20 px-3 py-1 text-[11px] font-semibold text-sky-300 transition-colors hover:bg-primary/30 hover:text-white"
                        >
                          Alterar Estilo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-400 transition-colors group-hover:bg-primary/20 group-hover:text-sky-400 group-hover:border-primary/30">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">
                          Retrato de Estilo
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          Copie roupas e cenário
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recomendações */}
          <div className="flex gap-3.5 rounded-2xl bg-gradient-to-r from-sky-950/20 to-slate-900/10 border border-primary/10 p-4 text-xs text-slate-300 mt-4">
            <Info className="h-4.5 w-4.5 flex-shrink-0 text-sky-400 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-white">Dicas para melhor resultado:</span>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-300">
                <li><span className="text-sky-300 font-medium">Selfie:</span> Rosto de frente, boa iluminação e foco nítido.</li>
                <li><span className="text-sky-300 font-medium">Foto de Estilo:</span> A IA extrairá a pose, cenário e vestimenta desta foto.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bloco 2: Configuração de Prompt */}
        <div className="relative rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 backdrop-blur-md shadow-2xl flex flex-col justify-between min-h-[460px]">
          {styleFile && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-3xl bg-slate-950/85 p-6 text-center backdrop-blur-sm transition-all duration-300">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-sky-400 border border-primary/30 shadow-md">
                <Info className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-bold text-white tracking-wide">Etapa 2 Desativada</p>
              <p className="mt-2 max-w-[280px] text-xs text-slate-300 leading-relaxed">
                Como você enviou uma <strong>Foto de Estilo Profissional</strong> na Etapa 1, a IA irá copiar o estilo, cenário e pose diretamente daquela imagem.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStyleFile(null);
                  setStylePreviewUrl(null);
                }}
                className="mt-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-2 text-xs font-bold text-white hover:from-orange-500 hover:to-amber-500 hover:shadow-[0_0_15px_rgba(250,99,5,0.25)] transition-all duration-300"
              >
                Remover Foto de Estilo
              </button>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-sky-400 ring-1 ring-primary/30">
                2
              </span>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Descreva seu Estilo e Cenário
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Instruções de Roupas, Pose e Fundo
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex: vestindo blazer escuro fino, sorriso amigável, no topo de um terraço corporativo moderno desfocado ao fundo com luz solar..."
                  className="h-24 w-full rounded-2xl border border-slate-850 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-primary/60 focus:shadow-[0_0_15px_rgba(0,131,199,0.15)]"
                  disabled={loading}
                />
              </div>

              {/* Sugestões de Estilos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Sugestões de Estilos e Poses
                  </label>

                  {/* Seletor de Gênero (Masculino / Feminino) */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gênero:</span>
                    <div className="flex gap-0.5 rounded-lg bg-slate-950/40 p-0.5 border border-slate-800/40">
                      <button
                        type="button"
                        onClick={() => setSelectedGender("female")}
                        className={`flex items-center gap-1.5 py-1 px-3.5 text-[10px] font-bold rounded-md transition-all duration-300 ${
                          selectedGender === "female"
                            ? "bg-gradient-to-r from-pink-600/90 to-purple-600/90 text-white shadow-[0_0_8px_rgba(219,39,119,0.2)] border border-pink-500/20"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <span>🙋‍♀️</span>
                        <span>Feminino</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedGender("male")}
                        className={`flex items-center gap-1.5 py-1 px-3.5 text-[10px] font-bold rounded-md transition-all duration-300 ${
                          selectedGender === "male"
                            ? "bg-gradient-to-r from-sky-600/90 to-blue-600/90 text-white shadow-[0_0_8px_rgba(2,132,199,0.2)] border border-sky-500/20"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <span>🙋‍♂️</span>
                        <span>Masculino</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Seletores de Aba (Tabs) */}
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-950/50 p-1 border border-slate-800/50">
                  <button
                    type="button"
                    onClick={() => setActiveTab("corporate")}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg transition-all duration-300 ${
                      activeTab === "corporate"
                        ? "bg-primary text-white shadow-[0_0_10px_rgba(0,131,199,0.2)]"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                    }`}
                  >
                    <span>💼</span>
                    <span>Corporativo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("creative")}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg transition-all duration-300 ${
                      activeTab === "creative"
                        ? "bg-primary text-white shadow-[0_0_10px_rgba(0,131,199,0.2)]"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                    }`}
                  >
                    <span>🎨</span>
                    <span>Criativo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("pose")}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg transition-all duration-300 ${
                      activeTab === "pose"
                        ? "bg-primary text-white shadow-[0_0_10px_rgba(0,131,199,0.2)]"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                    }`}
                  >
                    <span>📸</span>
                    <span>Poses & CTA</span>
                  </button>
                </div>

                {/* Subtexto Descritivo da Categoria */}
                <p className="text-[10px] text-slate-400 italic">
                  {activeTab === "corporate" && "Sugestões de vestimenta corporativa formal e cenários de negócios clássicos."}
                  {activeTab === "creative" && "Estilos descontraídos, urbanos, temáticos e fotos com cores vibrantes."}
                  {activeTab === "pose" && "Poses ideais para posts de carrossel, chamadas para ação (CTA) ou mentoria."}
                </p>

                {/* Grid de Sugestões da Aba Ativa Filtradas por Gênero */}
                <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1 transition-all duration-300">
                  {SUGGESTIONS.filter(
                    (item) =>
                      item.category === activeTab &&
                      (item.gender === "neutral" || item.gender === selectedGender)
                  ).map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setPrompt(item.text)}
                      className="group relative flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950/30 px-2.5 py-1.5 text-[11px] text-slate-300 transition-all duration-300 hover:border-primary hover:bg-primary hover:text-white hover:shadow-[0_0_10px_rgba(0,131,199,0.15)]"
                      disabled={loading}
                    >
                      <span>{activeTab === "corporate" ? "👔" : activeTab === "creative" ? "✨" : "📸"}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controles de Ação (Aviso de Erro e Botões de Disparo) */}
      <div className="mx-auto max-w-2xl space-y-4 pt-2">
        {error && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center gap-4">
          <button
            onClick={handleGenerate}
            disabled={loading || !file || (!prompt.trim() && !styleFile)}
            className="relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 py-4 text-sm font-bold text-white transition-all hover:from-orange-500 hover:to-amber-500 active:scale-[0.98] disabled:opacity-50 hover:shadow-[0_0_20px_rgba(250,99,5,0.35)] duration-300"
          >
            {loading ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                Gerando Retrato...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Gerar Retrato Profissional
              </>
            )}
          </button>

          {(previewUrl || resultUrl) && (
            <button
              onClick={resetAll}
              disabled={loading}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-4 text-sm font-bold text-slate-300 transition-all hover:bg-slate-850 hover:text-white disabled:opacity-50 duration-200"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Seção de Resultado e Loading (Exibida abaixo das etapas se ativo) */}
      {(loading || resultUrl) && (
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 backdrop-blur-md shadow-2xl space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 text-center">
            Seu Retrato Profissional IA
          </h2>

          <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 shadow-2xl">
            {/* Estado Carregando com o Loader Circular igual as outras gerações */}
            {loading && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-sm p-6">
                <div className="relative flex flex-col items-center gap-6">
                  {/* SVG Container do Círculo de Progresso */}
                  <div className="relative w-36 h-36">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <defs>
                        <linearGradient id="avatarProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#0284c7" />
                          <stop offset="100%" stopColor="#f97316" />
                        </linearGradient>
                      </defs>

                      {/* Círculo de trilha cinza escuro suave */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke="rgba(30, 41, 59, 0.8)"
                        strokeWidth="6"
                        fill="transparent"
                      />

                      {/* Círculo de progresso ativo que se fecha */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke="url(#avatarProgressGradient)"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray="282.74"
                        strokeDashoffset={282.74 * (1 - progress / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-200"
                      />
                    </svg>

                    {/* Porcentagem em texto no centro absoluto */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white tracking-tight">
                        {Math.round(progress)}%
                      </span>
                    </div>
                  </div>

                  {/* Mensagem Otimista com a frase de carregamento atual */}
                  <div className="h-14 flex items-center justify-center">
                    <p className="text-sm font-medium text-slate-300 text-center max-w-[280px] leading-relaxed transition-all duration-300">
                      {getLoaderMessage()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Imagem do Resultado */}
            {resultUrl && (
              <img
                src={resultUrl}
                alt="Retrato Profissional Gerado"
                className="h-full w-full object-cover"
              />
            )}
          </div>

          {/* Estado de Sucesso (Resultado Gerado) */}
          {!loading && resultUrl && (
            <div className="space-y-4 max-w-md mx-auto">
              {success && (
                <div className="flex items-center gap-2.5 rounded-2xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-xs text-green-400 shadow-sm">
                  <CheckCircle2 className="h-4.5 w-4.5 flex-shrink-0 text-green-400 animate-pulse" />
                  <span>Seu retrato foi salvo automaticamente na sua Galeria de Mídias!</span>
                </div>
              )}

              {/* Botão de download */}
              <a
                href={resultUrl}
                download={`retrato_avatar_${Date.now()}.jpg`}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 py-3.5 text-sm font-bold text-white transition-all hover:bg-slate-900 active:scale-[0.98] duration-200"
              >
                <Download className="h-4 w-4" />
                Baixar Imagem
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
