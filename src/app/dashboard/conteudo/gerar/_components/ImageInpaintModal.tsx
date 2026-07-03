import React, { useRef, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Paintbrush, X, RotateCcw, Sparkles } from "lucide-react";

interface ImageInpaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  prompt?: string;
  postId: string;
  userId: string;
  fileName: string;
  onSuccess: (newImageUrl: string) => void;
}

export const ImageInpaintModal: React.FC<ImageInpaintModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  prompt,
  postId,
  userId,
  fileName,
  onSuccess,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [brushSize, setBrushSize] = useState<number>(25);
  const [newText, setNewText] = useState<string>("");
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });

  const imageRef = useRef<HTMLImageElement | null>(null);

  // Carregar a imagem ao abrir o modal
  useEffect(() => {
    if (isOpen && imageUrl) {
      setImageLoaded(false);
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      // Usar a rota de download local como proxy para evitar restrições de CORS no canvas
      const proxyUrl = `/api/download?url=${encodeURIComponent(imageUrl)}`;
      img.src = proxyUrl;

      img.onload = () => {
        imageRef.current = img;
        
        // Limitar largura máxima para caber na tela de forma amigável
        const maxDisplayWidth = 512;
        let displayWidth = img.width;
        let displayHeight = img.height;

        if (displayWidth > maxDisplayWidth) {
          const ratio = maxDisplayWidth / displayWidth;
          displayWidth = maxDisplayWidth;
          displayHeight = Math.round(displayHeight * ratio);
        }

        setCanvasDimensions({ width: displayWidth, height: displayHeight });
        setImageLoaded(true);
      };

      img.onerror = (err) => {
        console.error("[INPAINT_IMAGE_LOAD_ERROR] Falha ao carregar imagem para o canvas:", err);
        alert("Não foi possível carregar a imagem para edição. Por favor, tente novamente.");
        onClose();
      };
    }
  }, [isOpen, imageUrl]);

  // Inicializar os canvas com a imagem e a máscara preta
  useEffect(() => {
    if (imageLoaded && canvasRef.current && maskCanvasRef.current && imageRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const maskCanvas = maskCanvasRef.current;
      const maskCtx = maskCanvas.getContext("2d");

      if (ctx && maskCtx) {
        // Limpar e desenhar imagem original no canvas principal
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);

        // Preencher canvas de máscara com preto sólido
        maskCtx.fillStyle = "#000000";
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
      }
    }
  }, [imageLoaded, canvasDimensions]);

  // Obter coordenadas de toque ou mouse relativas ao canvas
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current || !maskCanvasRef.current) return;
    
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas.getContext("2d");

    if (ctx && maskCtx) {
      // 1. Desenhar a máscara vermelha semitransparente no canvas principal
      ctx.fillStyle = "rgba(239, 68, 68, 0.4)";
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // 2. Desenhar em branco sólido no canvas de máscara (área inpaint)
      maskCtx.fillStyle = "#ffffff";
      maskCtx.beginPath();
      maskCtx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
      maskCtx.fill();
    }
  };

  const resetMask = () => {
    if (canvasRef.current && maskCanvasRef.current && imageRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const maskCanvas = maskCanvasRef.current;
      const maskCtx = maskCanvas.getContext("2d");

      if (ctx && maskCtx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
        
        maskCtx.fillStyle = "#000000";
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
      }
    }
  };

  const handleSubmit = async () => {
    if (!newText.trim()) return;
    if (!maskCanvasRef.current || !canvasRef.current) return;

    setLoading(true);
    try {
      // Obter máscara em Base64
      const maskBase64 = maskCanvasRef.current.toDataURL("image/png");

      const response = await fetch("/api/conteudo/corrigir-imagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          maskBase64,
          prompt,
          newText: newText.trim(),
          userId,
          postId,
          fileName,
        }),
      });

      const data = await response.json();

      if (data.success && data.imageUrl) {
        onSuccess(data.imageUrl);
        onClose();
      } else {
        alert(data.error || "Erro ao corrigir a imagem.");
      }
    } catch (err: any) {
      console.error("[INPAINT_SUBMIT_ERROR]", err);
      alert("Falha na comunicação com o servidor de correção.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className="max-w-xl bg-slate-900 text-slate-100 border-slate-800 shadow-2xl p-6 rounded-2xl">
        <DialogHeader className="mb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-violet-400">
              <Paintbrush className="w-5 h-5" />
              Corrigir Escrita da Imagem
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-400 mt-1">
            Pinte com o pincel sobre o texto com erro e digite a palavra correta abaixo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center gap-6 mt-2">
          {/* Canvas Wrapper */}
          <div 
            className="relative border-2 border-dashed border-slate-700 bg-slate-950 rounded-xl overflow-hidden shadow-inner flex items-center justify-center"
            style={{ 
              width: canvasDimensions.width ? `${canvasDimensions.width + 4}px` : "100%",
              height: canvasDimensions.height ? `${canvasDimensions.height + 4}px` : "300px",
              minHeight: "250px"
            }}
          >
            {!imageLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
                <span className="text-sm">Carregando imagem...</span>
              </div>
            )}

            <canvas
              ref={canvasRef}
              width={canvasDimensions.width}
              height={canvasDimensions.height}
              className={`cursor-crosshair block max-w-full ${imageLoaded ? "opacity-100" : "opacity-0"}`}
              onMouseDown={startDrawing}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onMouseMove={draw}
              onTouchStart={startDrawing}
              onTouchEnd={stopDrawing}
              onTouchMove={draw}
            />

            {/* Canvas de máscara invisível */}
            <canvas
              ref={maskCanvasRef}
              width={canvasDimensions.width}
              height={canvasDimensions.height}
              style={{ display: "none" }}
            />
          </div>

          {/* Ferramentas do Pincel */}
          {imageLoaded && (
            <div className="w-full flex flex-col gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Tamanho do Pincel</span>
                    <span className="font-semibold text-violet-400">{brushSize}px</span>
                  </div>
                  <Slider
                    min={10}
                    max={80}
                    step={1}
                    value={[brushSize]}
                    onValueChange={(val) => setBrushSize(val[0])}
                    className="cursor-pointer"
                  />
                </div>

                <Button
                  onClick={resetMask}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 h-9 flex items-center gap-1.5 px-3 rounded-lg"
                  disabled={loading}
                >
                  <RotateCcw className="w-4 h-4" />
                  Limpar
                </Button>
              </div>

              {/* Input de Texto Corretor */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="correctText" className="text-xs text-slate-400 font-medium">
                  Qual palavra ou frase deve aparecer na área pintada?
                </Label>
                <Input
                  id="correctText"
                  placeholder="Ex: Lançamento Incrível"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 h-10 rounded-lg text-sm"
                  disabled={loading}
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          {/* Botões do Modal */}
          <div className="w-full flex items-center justify-end gap-3 mt-2 border-t border-slate-800/80 pt-4">
            <Button
              onClick={onClose}
              type="button"
              variant="ghost"
              className="hover:bg-slate-800 hover:text-slate-200 text-slate-400 h-10 px-4 rounded-lg"
              disabled={loading}
            >
              Cancelar
            </Button>
            
            <Button
              onClick={handleSubmit}
              type="button"
              className="bg-violet-600 hover:bg-violet-500 text-white font-medium h-10 px-5 rounded-lg flex items-center gap-2 shadow-lg shadow-violet-900/30"
              disabled={loading || !newText.trim()}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Corrigindo escrita...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Regerar Texto ⚡
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
