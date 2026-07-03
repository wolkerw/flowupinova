"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Type,
  Trash2,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Check,
  Loader2,
  Square,
  Circle,
  Minus,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

// Fontes disponíveis (carregadas via Google Fonts no layout global)
const FONT_OPTIONS = [
  "Montserrat",
  "Inter",
  "Bebas Neue",
  "Oswald",
  "Roboto",
  "Playfair Display",
  "Poppins",
  "Raleway",
];

interface ImageInpaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  prompt?: string;
  postId: string;
  userId: string;
  fileName: string;
  onSuccess: (newImageUrl: string) => void;
  initialText?: string;
  brandKitPrimaryColor?: string;
  brandKitSecondaryColor?: string;
}

export type LayerType = "text" | "rectangle" | "circle" | "line";

export interface EditorLayer {
  id: string;
  type: LayerType;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number; // 0 a 1
  rotation: number; // 0 a 360 graus
  scale: number; // 0.1 a 3.0

  // Propriedades do texto
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string; // também preenchimento de formas
  bold: boolean;
  italic: boolean;
  align: "left" | "center" | "right";
  bgColor: string; // fundo do texto
  bgOpacity: number; // opacidade do fundo do texto

  // Propriedades de formas gráficas
  strokeColor: string; // cor da borda
  strokeWidth: number; // espessura da borda/linha
  filled: boolean; // se desenha preenchimento em formas
  fillOpacity?: number; // opacidade do preenchimento
  strokeOpacity?: number; // opacidade da borda/linha
  borderRadius?: number; // arredondamento de borda para retângulos
}

const DEFAULT_LAYER: Omit<EditorLayer, "id" | "x" | "y"> = {
  type: "text",
  text: "Seu texto aqui",
  fontSize: 32,
  fontFamily: "Montserrat",
  color: "#ffffff",
  bold: true,
  italic: false,
  align: "center",
  bgColor: "#000000",
  bgOpacity: 0,
  width: 280,
  height: 40,
  opacity: 1.0,
  rotation: 0,
  scale: 1.0,
  strokeColor: "#ffffff",
  strokeWidth: 2,
  filled: true,
  fillOpacity: 1.0,
  strokeOpacity: 1.0,
  borderRadius: 0,
};

// Auxiliar para calcular a altura dinâmica do texto com quebra de linha
const getTextHeight = (
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
  fontFamily: string,
  bold: boolean,
  italic: boolean,
  width: number
): number => {
  const fontStyle = `${italic ? "italic" : ""} ${bold ? "bold" : ""} ${fontSize}px ${fontFamily}`;
  ctx.save();
  ctx.font = fontStyle;
  const words = text.split("\n").flatMap((line) => line.split(" "));
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > width && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  if (currentLine) {
    lines.push(currentLine);
  }
  ctx.restore();
  const lineHeight = fontSize * 1.25;
  return lines.length * lineHeight + 10;
};

export const ImageInpaintModal: React.FC<ImageInpaintModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  postId,
  userId,
  fileName,
  onSuccess,
  initialText,
  brandKitPrimaryColor,
  brandKitSecondaryColor,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [canvasW, setCanvasW] = useState(0);
  const [canvasH, setCanvasH] = useState(0);

  const [layers, setLayers] = useState<EditorLayer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [interactionType, setInteractionType] = useState<"move" | "resize" | "resizeWidth" | "resizeHeight" | "rotate" | null>(null);
  const [dragOffset, setDragOffset] = useState({ dx: 0, dy: 0 });
  const [startParams, setStartParams] = useState({
    mouseX: 0,
    mouseY: 0,
    layerX: 0,
    layerY: 0,
    layerW: 0,
    layerH: 0,
    layerRotation: 0,
    layerScale: 1.0,
    centerX: 0,
    centerY: 0,
  });
  const [loading, setLoading] = useState(false);

  // Refs sempre atualizados para evitar stale closures na renderização e exportação
  const layersRef = useRef<EditorLayer[]>([]);
  const selectedIdRef = useRef<string | null>(null);
  useEffect(() => { layersRef.current = layers; }, [layers]);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  // Carregar fontes do Google Fonts dinamicamente
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;700&family=Montserrat:ital,wght@0,400;0,700;1,400;1,700&family=Oswald:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Poppins:ital,wght@0,400;0,700;1,400;1,700&family=Raleway:ital,wght@0,400;0,700;1,400;1,700&family=Roboto:ital,wght@0,400;0,700;1,400;1,700&display=swap";
    if (!document.head.querySelector('link[href*="Montserrat"]')) {
      document.head.appendChild(link);
    }
  }, []);

  // Carregar imagem ao abrir o modal
  useEffect(() => {
    if (!isOpen || !imageUrl) return;
    setImageLoaded(false);
    setLayers([]);
    setSelectedId(null);

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    const proxyUrl =
      imageUrl.startsWith("blob:") || imageUrl.startsWith("data:")
        ? imageUrl
        : `/api/download?url=${encodeURIComponent(imageUrl)}`;
    img.src = proxyUrl;

    img.onload = () => {
      imageRef.current = img;

      // Calcular tamanho responsivo máximo para o canvas, deixando folga para o painel de 320px
      const displayWidthMax = Math.min(620, window.innerWidth - 380);
      const displayHeightMax = window.innerHeight - 240;

      let displayW = img.width;
      let displayH = img.height;

      if (displayW > displayWidthMax || displayH > displayHeightMax) {
        const ratioW = displayWidthMax / displayW;
        const ratioH = displayHeightMax / displayH;
        const scale = Math.min(ratioW, ratioH);
        displayW = Math.round(displayW * scale);
        displayH = Math.round(displayH * scale);
      }

      setCanvasW(displayW);
      setCanvasH(displayH);
      setImageLoaded(true);
    };

    img.onerror = (err) => {
      console.error("[EDITOR_IMAGE_LOAD_ERROR] Falha ao carregar imagem para edição:", err);
      alert("Não foi possível carregar a imagem para o editor.");
      onClose();
    };
  }, [isOpen, imageUrl, initialText, onClose]);

  // Função centralizada para renderização das camadas
  const drawLayersToCtx = useCallback((
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    layersToDraw: EditorLayer[],
    activeSelectedId: string | null
  ) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);

    layersToDraw.forEach((l) => {
      ctx.save();
      ctx.globalAlpha = l.opacity;

      let H_eff = l.height;
      if (l.type === "text") {
        H_eff = getTextHeight(ctx, l.text, l.fontSize, l.fontFamily, l.bold, l.italic, l.width);
      }

      // Definir ponto central do elemento
      const cx = l.x + l.width / 2;
      const cy = l.y + H_eff / 2;

      // Aplicar transformações de rotação e escala a partir do centro
      ctx.translate(cx, cy);
      ctx.rotate(((l.rotation || 0) * Math.PI) / 180);
      ctx.scale(l.scale || 1.0, l.scale || 1.0);

      if (l.type === "text") {
        const fontStyle = `${l.italic ? "italic" : ""} ${l.bold ? "bold" : ""} ${l.fontSize}px ${l.fontFamily}`;
        ctx.font = fontStyle;
        ctx.textBaseline = "top";

        const words = l.text.split("\n").flatMap((line) => line.split(" "));
        const lines: string[] = [];
        let currentLine = "";

        words.forEach((word) => {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const metrics = ctx.measureText(testLine);
          if (metrics.width > l.width && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        });
        if (currentLine) {
          lines.push(currentLine);
        }

        const lineHeight = l.fontSize * 1.25;
        const totalHeight = lines.length * lineHeight;

        if (l.bgOpacity > 0) {
          ctx.save();
          ctx.globalAlpha = l.opacity * l.bgOpacity;
          ctx.fillStyle = l.bgColor;
          ctx.fillRect(-l.width / 2, -totalHeight / 2, l.width, totalHeight + 10);
          ctx.restore();
        }

        lines.forEach((line, index) => {
          ctx.fillStyle = l.color;
          let textX = -l.width / 2;
          if (l.align === "center") {
            textX = -ctx.measureText(line).width / 2;
          } else if (l.align === "right") {
            textX = l.width / 2 - ctx.measureText(line).width;
          }
          ctx.fillText(line, textX, -totalHeight / 2 + 5 + index * lineHeight);
        });

        if (activeSelectedId === l.id) {
          const currentScale = l.scale || 1.0;
          ctx.strokeStyle = "#8B5CF6";
          ctx.lineWidth = 2 / currentScale;
          ctx.setLineDash([6 / currentScale, 4 / currentScale]);
          ctx.strokeRect(-l.width / 2 - 4, -totalHeight / 2 - 4, l.width + 8, totalHeight + 18);

          // Puxador de redimensionamento (largura) no meio direito
          ctx.fillStyle = "#8B5CF6";
          ctx.beginPath();
          ctx.arc(l.width / 2 + 4, 0, 6 / currentScale, 0, Math.PI * 2);
          ctx.fill();

          // Puxador de rotação no topo central
          ctx.strokeStyle = "#8B5CF6";
          ctx.lineWidth = 1.5 / currentScale;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(0, -totalHeight / 2 - 4);
          ctx.lineTo(0, -totalHeight / 2 - 20);
          ctx.stroke();

          ctx.fillStyle = "#3B82F6";
          ctx.beginPath();
          ctx.arc(0, -totalHeight / 2 - 20, 6 / currentScale, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (l.type === "rectangle") {
        const r = l.borderRadius || 0;
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(-l.width / 2, -l.height / 2, l.width, l.height, r);
        } else {
          ctx.rect(-l.width / 2, -l.height / 2, l.width, l.height);
        }

        if (l.filled) {
          ctx.save();
          ctx.globalAlpha = l.opacity * (l.fillOpacity !== undefined ? l.fillOpacity : 1.0);
          ctx.fillStyle = l.color;
          ctx.fill();
          ctx.restore();
        }
        if (l.strokeWidth > 0) {
          ctx.save();
          ctx.globalAlpha = l.opacity * (l.strokeOpacity !== undefined ? l.strokeOpacity : 1.0);
          ctx.strokeStyle = l.strokeColor;
          ctx.lineWidth = l.strokeWidth / (l.scale || 1.0);
          ctx.stroke();
          ctx.restore();
        }

        if (activeSelectedId === l.id) {
          const currentScale = l.scale || 1.0;
          ctx.strokeStyle = "#8B5CF6";
          ctx.lineWidth = 2 / currentScale;
          ctx.setLineDash([6 / currentScale, 4 / currentScale]);
          ctx.strokeRect(-l.width / 2 - 4, -l.height / 2 - 4, l.width + 8, l.height + 8);

          // Puxador de redimensionamento no canto inferior direito
          ctx.fillStyle = "#8B5CF6";
          ctx.beginPath();
          ctx.arc(l.width / 2 + 4, l.height / 2 + 4, 6 / currentScale, 0, Math.PI * 2);
          ctx.fill();

          // Puxador lateral direito (largura)
          ctx.fillStyle = "#8B5CF6";
          ctx.beginPath();
          ctx.arc(l.width / 2 + 4, 0, 6 / currentScale, 0, Math.PI * 2);
          ctx.fill();

          // Puxador inferior central (altura)
          ctx.fillStyle = "#8B5CF6";
          ctx.beginPath();
          ctx.arc(0, l.height / 2 + 4, 6 / currentScale, 0, Math.PI * 2);
          ctx.fill();

          // Puxador de rotação no topo central
          ctx.strokeStyle = "#8B5CF6";
          ctx.lineWidth = 1.5 / currentScale;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(0, -l.height / 2 - 4);
          ctx.lineTo(0, -l.height / 2 - 20);
          ctx.stroke();

          ctx.fillStyle = "#3B82F6";
          ctx.beginPath();
          ctx.arc(0, -l.height / 2 - 20, 6 / currentScale, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (l.type === "circle") {
        const rx = Math.abs(l.width / 2);
        const ry = Math.abs(l.height / 2);

        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        if (l.filled) {
          ctx.save();
          ctx.globalAlpha = l.opacity * (l.fillOpacity !== undefined ? l.fillOpacity : 1.0);
          ctx.fillStyle = l.color;
          ctx.fill();
          ctx.restore();
        }
        if (l.strokeWidth > 0) {
          ctx.save();
          ctx.globalAlpha = l.opacity * (l.strokeOpacity !== undefined ? l.strokeOpacity : 1.0);
          ctx.strokeStyle = l.strokeColor;
          ctx.lineWidth = l.strokeWidth / (l.scale || 1.0);
          ctx.stroke();
          ctx.restore();
        }

        if (activeSelectedId === l.id) {
          const currentScale = l.scale || 1.0;
          ctx.strokeStyle = "#8B5CF6";
          ctx.lineWidth = 2 / currentScale;
          ctx.setLineDash([6 / currentScale, 4 / currentScale]);
          ctx.strokeRect(-l.width / 2 - 4, -l.height / 2 - 4, l.width + 8, l.height + 8);

          // Puxador de redimensionamento
          ctx.fillStyle = "#8B5CF6";
          ctx.beginPath();
          ctx.arc(l.width / 2 + 4, l.height / 2 + 4, 6 / currentScale, 0, Math.PI * 2);
          ctx.fill();

          // Puxador lateral direito (largura)
          ctx.fillStyle = "#8B5CF6";
          ctx.beginPath();
          ctx.arc(l.width / 2 + 4, 0, 6 / currentScale, 0, Math.PI * 2);
          ctx.fill();

          // Puxador inferior central (altura)
          ctx.fillStyle = "#8B5CF6";
          ctx.beginPath();
          ctx.arc(0, l.height / 2 + 4, 6 / currentScale, 0, Math.PI * 2);
          ctx.fill();

          // Puxador de rotação
          ctx.strokeStyle = "#8B5CF6";
          ctx.lineWidth = 1.5 / currentScale;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(0, -l.height / 2 - 4);
          ctx.lineTo(0, -l.height / 2 - 20);
          ctx.stroke();

          ctx.fillStyle = "#3B82F6";
          ctx.beginPath();
          ctx.arc(0, -l.height / 2 - 20, 6 / currentScale, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (l.type === "line") {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(-l.width / 2, -l.height / 2);
        ctx.lineTo(l.width / 2, l.height / 2);
        ctx.globalAlpha = l.opacity * (l.strokeOpacity !== undefined ? l.strokeOpacity : 1.0);
        ctx.strokeStyle = l.color;
        ctx.lineWidth = (l.strokeWidth || 4) / (l.scale || 1.0);
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.restore();

        if (activeSelectedId === l.id) {
          const currentScale = l.scale || 1.0;
          ctx.strokeStyle = "#8B5CF6";
          ctx.lineWidth = 2 / currentScale;
          ctx.setLineDash([6 / currentScale, 4 / currentScale]);
          ctx.strokeRect(-l.width / 2 - 6, -l.height / 2 - 6, l.width + 12, l.height + 12);

          // Puxador de redimensionamento na ponta da linha
          ctx.fillStyle = "#8B5CF6";
          ctx.beginPath();
          ctx.arc(l.width / 2, l.height / 2, 6 / currentScale, 0, Math.PI * 2);
          ctx.fill();

          // Puxador de rotação
          ctx.strokeStyle = "#8B5CF6";
          ctx.lineWidth = 1.5 / currentScale;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(0, -l.height / 2 - 6);
          ctx.lineTo(0, -l.height / 2 - 20);
          ctx.stroke();

          ctx.fillStyle = "#3B82F6";
          ctx.beginPath();
          ctx.arc(0, -l.height / 2 - 20, 6 / currentScale, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    });
  }, []);

  // Loop de renderização no canvas
  useEffect(() => {
    if (!imageLoaded || !canvasRef.current || !imageRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawLayersToCtx(ctx, imageRef.current, layers, selectedId);
  }, [imageLoaded, layers, selectedId, canvasW, canvasH, drawLayersToCtx]);

  // Obter posição do cursor sobre o canvas
  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Teste de colisão de cursor para camadas e puxadores de controle
  const hitTest = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const tempCtx = canvas.getContext("2d");
    if (!tempCtx) return null;

    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i];
      let H_eff = l.height;
      if (l.type === "text") {
        H_eff = getTextHeight(tempCtx, l.text, l.fontSize, l.fontFamily, l.bold, l.italic, l.width);
      }

      const cx = l.x + l.width / 2;
      const cy = l.y + H_eff / 2;
      const theta = ((l.rotation || 0) * Math.PI) / 180;
      const scale = l.scale || 1.0;

      // Converter coordenadas do clique global para o espaço local do elemento
      const dx = x - cx;
      const dy = y - cy;
      const cos = Math.cos(-theta);
      const sin = Math.sin(-theta);
      const lx = (dx * cos - dy * sin) / scale;
      const ly = (dx * sin + dy * cos) / scale;

      // Puxador de Rotação (topo central)
      const rotHandleX = 0;
      const rotHandleY = -H_eff / 2 - 20;
      if (Math.hypot(lx - rotHandleX, ly - rotHandleY) * scale <= 12) {
        return { id: l.id, type: "rotate" as const };
      }

      // Puxador de Redimensionamento (canto inferior direito)
      const resHandleX = l.width / 2 + 4;
      const resHandleY = l.type === "text" ? 0 : H_eff / 2 + 4;
      if (Math.hypot(lx - resHandleX, ly - resHandleY) * scale <= 12) {
        return { id: l.id, type: "resize" as const };
      }

      // Puxadores laterais para deformar (somente retângulo e círculo)
      if (l.type === "rectangle" || l.type === "circle") {
        const rightHandleX = l.width / 2 + 4;
        const rightHandleY = 0;
        if (Math.hypot(lx - rightHandleX, ly - rightHandleY) * scale <= 12) {
          return { id: l.id, type: "resizeWidth" as const };
        }

        const bottomHandleX = 0;
        const bottomHandleY = H_eff / 2 + 4;
        if (Math.hypot(lx - bottomHandleX, ly - bottomHandleY) * scale <= 12) {
          return { id: l.id, type: "resizeHeight" as const };
        }
      }

      // Teste de corpo
      if (l.type === "line") {
        const W = l.width;
        const H = l.height;
        const A = lx - (-W / 2);
        const B = ly - (-H / 2);
        const dot = A * W + B * H;
        const lenSq = W * W + H * H;
        let param = -1;
        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;
        if (param < 0) {
          xx = -W / 2;
          yy = -H / 2;
        } else if (param > 1) {
          xx = W / 2;
          yy = H / 2;
        } else {
          xx = -W / 2 + param * W;
          yy = -H / 2 + param * H;
        }

        if (Math.hypot(lx - xx, ly - yy) * scale <= 8) {
          return { id: l.id, type: "move" as const };
        }
      } else {
        if (lx >= -l.width / 2 && lx <= l.width / 2 && ly >= -H_eff / 2 && ly <= H_eff / 2) {
          return { id: l.id, type: "move" as const };
        }
      }
    }
    return null;
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getPos(e);
    const hit = hitTest(x, y);
    if (hit) {
      setSelectedId(hit.id);
      const l = layers.find((layer) => layer.id === hit.id);
      if (!l) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const tempCtx = canvas.getContext("2d");
      if (!tempCtx) return;

      let H_eff = l.height;
      if (l.type === "text") {
        H_eff = getTextHeight(tempCtx, l.text, l.fontSize, l.fontFamily, l.bold, l.italic, l.width);
      }

      const cx = l.x + l.width / 2;
      const cy = l.y + H_eff / 2;

      setInteractionType(hit.type);
      setStartParams({
        mouseX: x,
        mouseY: y,
        layerX: l.x,
        layerY: l.y,
        layerW: l.width,
        layerH: l.height,
        layerRotation: l.rotation || 0,
        layerScale: l.scale || 1.0,
        centerX: cx,
        centerY: cy,
      });

      setDragOffset({ dx: x - l.x, dy: y - l.y });
    } else {
      setSelectedId(null);
      setInteractionType(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactionType || !selectedId) return;
    const { x, y } = getPos(e);
    const l = layers.find((layer) => layer.id === selectedId);
    if (!l) return;

    if (interactionType === "move") {
      const newX = x - dragOffset.dx;
      const newY = y - dragOffset.dy;
      setLayers((prev) =>
        prev.map((layer) =>
          layer.id === selectedId
            ? { ...layer, x: newX, y: newY }
            : layer
        )
      );
    } else if (interactionType === "rotate") {
      const dx = x - startParams.centerX;
      const dy = y - startParams.centerY;
      const currentAngleRad = Math.atan2(dy, dx);
      let newAngleDeg = (currentAngleRad * 180) / Math.PI + 90;
      newAngleDeg = (Math.round(newAngleDeg) + 360) % 360;

      setLayers((prev) =>
        prev.map((layer) =>
          layer.id === selectedId ? { ...layer, rotation: newAngleDeg } : layer
        )
      );
    } else if (interactionType === "resize") {
      const dx = x - startParams.centerX;
      const dy = y - startParams.centerY;
      const theta = (startParams.layerRotation * Math.PI) / 180;
      const cos = Math.cos(-theta);
      const sin = Math.sin(-theta);
      const lx = dx * cos - dy * sin;
      const ly = dx * sin + dy * cos;

      if (l.type === "text") {
        const newW = Math.max(80, (lx * 2) / startParams.layerScale);
        const newX = startParams.centerX - newW / 2;
        setLayers((prev) =>
          prev.map((layer) =>
            layer.id === selectedId
              ? { ...layer, width: Math.round(newW), x: Math.round(newX) }
              : layer
          )
        );
      } else if (l.type === "rectangle" || l.type === "circle") {
        const newW = Math.max(10, (lx * 2) / startParams.layerScale);
        const newH = Math.max(10, (ly * 2) / startParams.layerScale);
        const newX = startParams.centerX - newW / 2;
        const newY = startParams.centerY - newH / 2;
        setLayers((prev) =>
          prev.map((layer) =>
            layer.id === selectedId
              ? {
                  ...layer,
                  width: Math.round(newW),
                  height: Math.round(newH),
                  x: Math.round(newX),
                  y: Math.round(newY),
                }
              : layer
          )
        );
      } else if (l.type === "line") {
        const newW = x - l.x;
        const newH = y - l.y;
        setLayers((prev) =>
          prev.map((layer) =>
            layer.id === selectedId ? { ...layer, width: newW, height: newH } : layer
          )
        );
      }
    } else if (interactionType === "resizeWidth") {
      const dx = x - startParams.centerX;
      const dy = y - startParams.centerY;
      const theta = (startParams.layerRotation * Math.PI) / 180;
      const cos = Math.cos(-theta);
      const sin = Math.sin(-theta);
      const lx = dx * cos - dy * sin;

      const newW = Math.max(10, (lx * 2) / startParams.layerScale);
      const newX = startParams.centerX - newW / 2;
      setLayers((prev) =>
        prev.map((layer) =>
          layer.id === selectedId
            ? { ...layer, width: Math.round(newW), x: Math.round(newX) }
            : layer
        )
      );
    } else if (interactionType === "resizeHeight") {
      const dx = x - startParams.centerX;
      const dy = y - startParams.centerY;
      const theta = (startParams.layerRotation * Math.PI) / 180;
      const cos = Math.cos(-theta);
      const sin = Math.sin(-theta);
      const ly = dx * sin + dy * cos;

      const newH = Math.max(10, (ly * 2) / startParams.layerScale);
      const newY = startParams.centerY - newH / 2;
      setLayers((prev) =>
        prev.map((layer) =>
          layer.id === selectedId
            ? { ...layer, height: Math.round(newH), y: Math.round(newY) }
            : layer
        )
      );
    }
  };

  const handleCanvasMouseUp = () => {
    setInteractionType(null);
  };

  // CRUD de camadas
  const addLayer = (type: LayerType = "text", x?: number, y?: number, text?: string) => {
    const hasTextLayer = layers.some(l => l.type === "text");
    const newLayer: EditorLayer = {
      ...DEFAULT_LAYER,
      type,
      id: crypto.randomUUID(),
      x: x ?? 40,
      y: y ?? 40,
      width: type === "text" ? 280 : type === "rectangle" ? 120 : type === "circle" ? 100 : 150,
      height: type === "text" ? 40 : type === "rectangle" ? 80 : type === "circle" ? 100 : 0,
      text: text || (initialText && !hasTextLayer ? initialText : DEFAULT_LAYER.text),
      color: type === "text" ? "#ffffff" : "#8B5CF6",
      strokeColor: "#ffffff",
      strokeWidth: type === "text" ? 0 : 2,
      filled: type !== "line",
      rotation: 0,
      scale: 1.0,
    };
    setLayers((prev) => [...prev, newLayer]);
    setSelectedId(newLayer.id);
  };

  const deleteSelected = () => {
    setLayers((prev) => prev.filter((l) => l.id !== selectedId));
    setSelectedId(null);
  };

  const updateSelected = (patch: Partial<EditorLayer>) => {
    setLayers((prev) => prev.map((l) => (l.id === selectedId ? { ...l, ...patch } : l)));
  };

  const selected = layers.find((l) => l.id === selectedId) || null;

  const moveLayerForward = () => {
    if (!selectedId) return;
    const idx = layers.findIndex((l) => l.id === selectedId);
    if (idx !== -1 && idx < layers.length - 1) {
      const newLayers = [...layers];
      const temp = newLayers[idx];
      newLayers[idx] = newLayers[idx + 1];
      newLayers[idx + 1] = temp;
      setLayers(newLayers);
    }
  };

  const moveLayerBackward = () => {
    if (!selectedId) return;
    const idx = layers.findIndex((l) => l.id === selectedId);
    if (idx > 0) {
      const newLayers = [...layers];
      const temp = newLayers[idx];
      newLayers[idx] = newLayers[idx - 1];
      newLayers[idx - 1] = temp;
      setLayers(newLayers);
    }
  };

  // Exportar e salvar
  const handleApply = async () => {
    const img = imageRef.current;
    if (!img || layersRef.current.length === 0) return;
    setLoading(true);
    try {
      try { await document.fonts.ready; } catch (_) {}

      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = img.naturalWidth;
      exportCanvas.height = img.naturalHeight;
      const exportCtx = exportCanvas.getContext("2d");
      if (!exportCtx) throw new Error("Não foi possível criar o contexto de exportação.");

      const scaleX = img.naturalWidth / canvasW;
      const scaleY = img.naturalHeight / canvasH;
      const scaledLayers = layersRef.current.map((l) => ({
        ...l,
        x: l.x * scaleX,
        y: l.y * scaleY,
        width: l.width * scaleX,
        height: l.height * scaleY,
        fontSize: Math.round(l.fontSize * scaleX),
        strokeWidth: Math.round(l.strokeWidth * scaleX),
      }));

      drawLayersToCtx(exportCtx, img, scaledLayers, null);

      const imageBase64 = exportCanvas.toDataURL("image/jpeg", 0.95);

      const response = await fetch("/api/conteudo/salvar-imagem-editada", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, userId, postId, fileName }),
      });

      const data = await response.json();
      if (data.success && data.imageUrl) {
        onSuccess(data.imageUrl);
        onClose();
      } else {
        alert(data.error || "Erro ao salvar a imagem editada.");
      }
    } catch (err) {
      console.error("[EDITOR_APPLY_ERROR]", err);
      alert("Falha ao salvar as edições da imagem.");
    } finally {
      setLoading(false);
    }
  };

  // Cores de marca rápidas
  const renderBrandKitPalette = (onSelectColor: (color: string) => void) => {
    if (!brandKitPrimaryColor && !brandKitSecondaryColor) return null;
    return (
      <div className="flex flex-col gap-1.5 mt-1">
        <span className="text-[10px] text-slate-500 uppercase font-medium tracking-wide">Cores do seu Brand Kit</span>
        <div className="flex gap-2">
          {brandKitPrimaryColor && (
            <button
              type="button"
              onClick={() => onSelectColor(brandKitPrimaryColor)}
              className="w-7 h-7 rounded-full border border-slate-700 shadow-sm transition-transform hover:scale-110 active:scale-95"
              style={{ backgroundColor: brandKitPrimaryColor }}
              title="Cor Primária da Marca"
            />
          )}
          {brandKitSecondaryColor && (
            <button
              type="button"
              onClick={() => onSelectColor(brandKitSecondaryColor)}
              className="w-7 h-7 rounded-full border border-slate-700 shadow-sm transition-transform hover:scale-110 active:scale-95"
              style={{ backgroundColor: brandKitSecondaryColor }}
              title="Cor Secundária da Marca"
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] md:w-full h-[95vh] lg:h-[85vh] max-h-[95vh] lg:max-h-[85vh] bg-slate-900 text-slate-100 border-slate-800 shadow-2xl p-0 rounded-2xl overflow-hidden flex flex-col">
        <div className="flex flex-col h-full min-h-0">
          {/* Header */}
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-800">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-violet-400">
              <Type className="w-5 h-5" />
              Editor Visual
            </DialogTitle>
            <DialogDescription className="text-slate-400 mt-1 text-sm">
              Adicione textos ou formas. Arraste para posicionar. Ajuste tamanho, escala, rotação e cores no painel lateral.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col lg:flex-row gap-0 flex-1 min-h-0">
            {/* Canvas Area */}
            <div className="flex-1 flex items-center justify-center bg-slate-950 p-6 min-h-[300px]">
              {!imageLoaded ? (
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                  <span className="text-sm">Carregando imagem...</span>
                </div>
              ) : (
                <canvas
                  ref={canvasRef}
                  width={canvasW}
                  height={canvasH}
                  style={{ maxWidth: "100%", maxHeight: "60vh", cursor: interactionType ? "grabbing" : "default" }}
                  className="rounded-xl shadow-2xl border border-slate-800"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                />
              )}
            </div>

            {/* Painel de Ferramentas */}
            <div className="w-full lg:w-80 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col h-full min-h-0">
              {/* Adicionar elementos e Ações globais */}
              <div className="p-4 border-b border-slate-800 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs text-slate-400 uppercase tracking-wide">
                  <span>Adicionar Elemento</span>
                  {selected && (
                    <Button
                      onClick={deleteSelected}
                      variant="outline"
                      size="sm"
                      className="bg-red-900/20 hover:bg-red-900/40 border-red-800/50 text-red-400 h-7 px-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Excluir
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  <Button
                    onClick={() => addLayer("text")}
                    variant="outline"
                    size="icon"
                    className="bg-slate-800 hover:bg-slate-700 border-slate-700 h-9 w-full"
                    title="Texto"
                    disabled={!imageLoaded}
                  >
                    <Type className="w-4 h-4 text-violet-300" />
                  </Button>
                  <Button
                    onClick={() => addLayer("rectangle")}
                    variant="outline"
                    size="icon"
                    className="bg-slate-800 hover:bg-slate-700 border-slate-700 h-9 w-full"
                    title="Retângulo"
                    disabled={!imageLoaded}
                  >
                    <Square className="w-4 h-4 text-violet-300" />
                  </Button>
                  <Button
                    onClick={() => addLayer("circle")}
                    variant="outline"
                    size="icon"
                    className="bg-slate-800 hover:bg-slate-700 border-slate-700 h-9 w-full"
                    title="Círculo"
                    disabled={!imageLoaded}
                  >
                    <Circle className="w-4 h-4 text-violet-300" />
                  </Button>
                  <Button
                    onClick={() => addLayer("line")}
                    variant="outline"
                    size="icon"
                    className="bg-slate-800 hover:bg-slate-700 border-slate-700 h-9 w-full"
                    title="Linha"
                    disabled={!imageLoaded}
                  >
                    <Minus className="w-4 h-4 text-violet-300" />
                  </Button>
                </div>
              </div>

              {/* Conteúdo rolável das ferramentas do elemento selecionado */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {selected ? (
                  <div className="flex flex-col gap-5 p-4">
                    {/* Ordenação (Z-Index) */}
                    <div className="flex flex-col gap-2">
                      <Label className="text-xs text-slate-400 uppercase tracking-wide">Ordenação da Camada</Label>
                      <div className="flex gap-2">
                        <button
                          onClick={moveLayerBackward}
                          title="Enviar para trás"
                          className="flex-1 h-9 rounded-lg border bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                          <ChevronDown className="w-4 h-4" />
                          <span>Recuar</span>
                        </button>
                        <button
                          onClick={moveLayerForward}
                          title="Trazer para frente"
                          className="flex-1 h-9 rounded-lg border bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                          <ChevronUp className="w-4 h-4" />
                          <span>Avançar</span>
                        </button>
                      </div>
                    </div>

                    {/* Opacidade */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-xs text-slate-400">
                        <Label className="uppercase tracking-wide">Opacidade</Label>
                        <span className="text-violet-400 font-semibold">
                          {Math.round(selected.opacity * 100)}%
                        </span>
                      </div>
                      <Slider
                        min={0.1}
                        max={1.0}
                        step={0.05}
                        value={[selected.opacity]}
                        onValueChange={([v]) => updateSelected({ opacity: v })}
                      />
                    </div>

                    {/* Tamanho (Escala) */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-xs text-slate-400">
                        <Label className="uppercase tracking-wide">Tamanho</Label>
                        <span className="text-violet-400 font-semibold">
                          {Math.round((selected.scale || 1.0) * 100)}%
                        </span>
                      </div>
                      <Slider
                        min={0.1}
                        max={6.0}
                        step={0.05}
                        value={[selected.scale || 1.0]}
                        onValueChange={([v]) => updateSelected({ scale: v })}
                      />
                    </div>

                    {/* Rotação */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-xs text-slate-400">
                        <Label className="uppercase tracking-wide">Rotação</Label>
                        <span className="text-violet-400 font-semibold">
                          {selected.rotation || 0}°
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={360}
                        step={1}
                        value={[selected.rotation || 0]}
                        onValueChange={([v]) => updateSelected({ rotation: v })}
                      />
                    </div>

                    {selected.type === "text" && (
                      <>
                        {/* Texto */}
                        <div className="flex flex-col gap-2">
                          <Label className="text-xs text-slate-400 uppercase tracking-wide">Texto</Label>
                          <textarea
                            value={selected.text}
                            onChange={(e) => updateSelected({ text: e.target.value })}
                            rows={3}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm p-2.5 resize-none focus:outline-none focus:border-violet-500"
                            placeholder="Digite o text..."
                          />
                        </div>

                        {/* Fonte */}
                        <div className="flex flex-col gap-2">
                          <Label className="text-xs text-slate-400 uppercase tracking-wide">Fonte</Label>
                          <select
                            value={selected.fontFamily}
                            onChange={(e) => updateSelected({ fontFamily: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm p-2 focus:outline-none focus:border-violet-500"
                          >
                            {FONT_OPTIONS.map((f) => (
                              <option key={f} value={f} style={{ fontFamily: f }}>
                                {f}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Tamanho da Fonte */}
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between text-xs text-slate-400">
                            <Label className="uppercase tracking-wide">Tamanho da Fonte</Label>
                            <span className="text-violet-400 font-semibold">{selected.fontSize}px</span>
                          </div>
                          <Slider
                            min={12}
                            max={120}
                            step={1}
                            value={[selected.fontSize]}
                            onValueChange={([v]) => updateSelected({ fontSize: v })}
                          />
                        </div>

                        {/* Largura da caixa de texto */}
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between text-xs text-slate-400">
                            <Label className="uppercase tracking-wide">Largura da Caixa</Label>
                            <span className="text-violet-400 font-semibold">{selected.width}px</span>
                          </div>
                          <Slider
                            min={80}
                            max={canvasW || 560}
                            step={4}
                            value={[selected.width]}
                            onValueChange={([v]) => updateSelected({ width: v })}
                          />
                        </div>

                        {/* Cor do texto */}
                        <div className="flex flex-col gap-2">
                          <Label className="text-xs text-slate-400 uppercase tracking-wide">Cor do Texto</Label>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                              <input
                                type="color"
                                value={selected.color}
                                onChange={(e) => updateSelected({ color: e.target.value })}
                                className="w-10 h-10 rounded-lg border border-slate-700 cursor-pointer bg-transparent"
                              />
                              <Input
                                value={selected.color}
                                onChange={(e) => updateSelected({ color: e.target.value })}
                                className="flex-1 bg-slate-800 border-slate-700 text-slate-100 h-9 text-sm font-mono"
                                maxLength={7}
                              />
                            </div>
                            {renderBrandKitPalette((c) => updateSelected({ color: c }))}
                          </div>
                        </div>

                        {/* Cor de fundo do texto */}
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between text-xs text-slate-400">
                            <Label className="uppercase tracking-wide">Fundo da Caixa</Label>
                            <span className="text-violet-400 font-semibold">
                              {Math.round(selected.bgOpacity * 100)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={selected.bgColor}
                              onChange={(e) => updateSelected({ bgColor: e.target.value })}
                              className="w-10 h-10 rounded-lg border border-slate-700 cursor-pointer bg-transparent"
                            />
                            <Slider
                              min={0}
                              max={1}
                              step={0.05}
                              value={[selected.bgOpacity]}
                              onValueChange={([v]) => updateSelected({ bgOpacity: v })}
                              className="flex-1"
                            />
                          </div>
                          {renderBrandKitPalette((c) => updateSelected({ bgColor: c }))}
                        </div>

                        {/* Estilo */}
                        <div className="flex flex-col gap-2">
                          <Label className="text-xs text-slate-400 uppercase tracking-wide">Estilo</Label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateSelected({ bold: !selected.bold })}
                              className={`flex-1 h-9 rounded-lg border text-sm font-bold flex items-center justify-center gap-1 transition-colors ${
                                selected.bold
                                  ? "bg-violet-600 border-violet-500 text-white"
                                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                              }`}
                            >
                              <Bold className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateSelected({ italic: !selected.italic })}
                              className={`flex-1 h-9 rounded-lg border text-sm flex items-center justify-center gap-1 transition-colors ${
                                selected.italic
                                  ? "bg-violet-600 border-violet-500 text-white"
                                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                              }`}
                            >
                              <Italic className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Alinhamento */}
                        <div className="flex flex-col gap-2">
                          <Label className="text-xs text-slate-400 uppercase tracking-wide">Alinhamento</Label>
                          <div className="flex gap-2">
                            {(["left", "center", "right"] as const).map((a) => {
                              const Icon = a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight;
                              return (
                                <button
                                  key={a}
                                  onClick={() => updateSelected({ align: a })}
                                  className={`flex-1 h-9 rounded-lg border flex items-center justify-center transition-colors ${
                                    selected.align === a
                                      ? "bg-violet-600 border-violet-500 text-white"
                                      : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                                  }`}
                                >
                                  <Icon className="w-4 h-4" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}

                    {(selected.type === "rectangle" || selected.type === "circle") && (
                      <>
                        {/* Ajuste manual de Largura */}
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between text-xs text-slate-400">
                            <Label className="uppercase tracking-wide">Largura</Label>
                            <span className="text-violet-400 font-semibold">{selected.width}px</span>
                          </div>
                          <Slider
                            min={10}
                            max={canvasW * 2 || 1200}
                            step={2}
                            value={[selected.width]}
                            onValueChange={([v]) => updateSelected({ width: v })}
                          />
                        </div>

                        {/* Ajuste manual de Altura */}
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between text-xs text-slate-400">
                            <Label className="uppercase tracking-wide">Altura</Label>
                            <span className="text-violet-400 font-semibold">{selected.height}px</span>
                          </div>
                          <Slider
                            min={10}
                            max={canvasH * 2 || 1200}
                            step={2}
                            value={[selected.height]}
                            onValueChange={([v]) => updateSelected({ height: v })}
                          />
                        </div>

                        {selected.type === "rectangle" && (
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-xs text-slate-400">
                              <Label className="uppercase tracking-wide">Arredondamento das Bordas</Label>
                              <span className="text-violet-400 font-semibold">{selected.borderRadius || 0}px</span>
                            </div>
                            <Slider
                              min={0}
                              max={Math.min(selected.width, selected.height) / 2}
                              step={1}
                              value={[selected.borderRadius || 0]}
                              onValueChange={([v]) => updateSelected({ borderRadius: v })}
                            />
                          </div>
                        )}

                        {/* Preenchimento - toggle on/off */}
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-slate-400 uppercase tracking-wide">Preenchimento</Label>
                          <button
                            type="button"
                            onClick={() => updateSelected({ filled: !selected.filled })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                              selected.filled ? "bg-violet-600" : "bg-slate-700"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                selected.filled ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Cor de Preenchimento — visível somente quando ligado */}
                        {selected.filled && (
                          <div className="flex flex-col gap-2">
                            <Label className="text-xs text-slate-400 uppercase tracking-wide">Cor de Preenchimento</Label>
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-3">
                                <input
                                  type="color"
                                  value={selected.color}
                                  onChange={(e) => updateSelected({ color: e.target.value })}
                                  className="w-10 h-10 rounded-lg border border-slate-700 cursor-pointer bg-transparent"
                                />
                                <Input
                                  value={selected.color}
                                  onChange={(e) => updateSelected({ color: e.target.value })}
                                  className="flex-1 bg-slate-800 border-slate-700 text-slate-100 h-9 text-sm font-mono"
                                  maxLength={7}
                                />
                              </div>
                              {renderBrandKitPalette((c) => updateSelected({ color: c }))}
                            </div>
                          </div>
                        )}

                        {/* Borda — sempre disponível, independente de preenchimento */}
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between text-xs text-slate-400">
                            <Label className="uppercase tracking-wide">Espessura da Borda</Label>
                            <span className="text-violet-400 font-semibold">{selected.strokeWidth}px</span>
                          </div>
                          <Slider
                            min={0}
                            max={30}
                            step={1}
                            value={[selected.strokeWidth]}
                            onValueChange={([v]) => updateSelected({ strokeWidth: v })}
                          />
                        </div>

                        {selected.strokeWidth > 0 && (
                          <div className="flex flex-col gap-2">
                            <Label className="text-xs text-slate-400 uppercase tracking-wide">Cor da Borda</Label>
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-3">
                                <input
                                  type="color"
                                  value={selected.strokeColor}
                                  onChange={(e) => updateSelected({ strokeColor: e.target.value })}
                                  className="w-10 h-10 rounded-lg border border-slate-700 cursor-pointer bg-transparent"
                                />
                                <Input
                                  value={selected.strokeColor}
                                  onChange={(e) => updateSelected({ strokeColor: e.target.value })}
                                  className="flex-1 bg-slate-800 border-slate-700 text-slate-100 h-9 text-sm font-mono"
                                  maxLength={7}
                                />
                              </div>
                              {renderBrandKitPalette((c) => updateSelected({ strokeColor: c }))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {selected.type === "line" && (
                      <>
                        {/* Ajuste manual de dimensão da linha */}
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between text-xs text-slate-400">
                            <Label className="uppercase tracking-wide">Comprimento X</Label>
                            <span className="text-violet-400 font-semibold">{selected.width}px</span>
                          </div>
                          <Slider
                            min={-300}
                            max={300}
                            step={2}
                            value={[selected.width]}
                            onValueChange={([v]) => updateSelected({ width: v })}
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between text-xs text-slate-400">
                            <Label className="uppercase tracking-wide">Comprimento Y</Label>
                            <span className="text-violet-400 font-semibold">{selected.height}px</span>
                          </div>
                          <Slider
                            min={-300}
                            max={300}
                            step={2}
                            value={[selected.height]}
                            onValueChange={([v]) => updateSelected({ height: v })}
                          />
                        </div>

                        {/* Cor da Linha */}
                        <div className="flex flex-col gap-2">
                          <Label className="text-xs text-slate-400 uppercase tracking-wide">Cor da Linha</Label>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                              <input
                                type="color"
                                value={selected.color}
                                onChange={(e) => updateSelected({ color: e.target.value })}
                                className="w-10 h-10 rounded-lg border border-slate-700 cursor-pointer bg-transparent"
                              />
                              <Input
                                value={selected.color}
                                onChange={(e) => updateSelected({ color: e.target.value })}
                                className="flex-1 bg-slate-800 border-slate-700 text-slate-100 h-9 text-sm font-mono"
                                maxLength={7}
                              />
                            </div>
                            {renderBrandKitPalette((c) => updateSelected({ color: c }))}
                          </div>
                        </div>

                        {/* Espessura da Linha */}
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between text-xs text-slate-400">
                            <Label className="uppercase tracking-wide">Espessura</Label>
                            <span className="text-violet-400 font-semibold">{selected.strokeWidth}px</span>
                          </div>
                          <Slider
                            min={1}
                            max={30}
                            step={1}
                            value={[selected.strokeWidth]}
                            onValueChange={([v]) => updateSelected({ strokeWidth: v })}
                          />
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 h-full flex flex-col items-center justify-center gap-3 text-slate-500 p-6 text-center">
                    <Type className="w-10 h-10 opacity-30" />
                    <p className="text-sm">
                      Escolha um elemento acima para adicionar ao canvas, ou clique em um item existente para editá-lo.
                    </p>
                  </div>
                )}
              </div>

              {/* Botão Aplicar - Fixo no rodapé da barra lateral */}
              <div className="p-4 border-t border-slate-800 bg-slate-900 mt-auto">
                <div className="flex gap-2">
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    className="flex-1 hover:bg-slate-800 text-slate-400"
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleApply}
                    disabled={loading || layers.length === 0}
                    className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-medium gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Aplicar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
