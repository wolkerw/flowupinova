"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, TrendingUp, Target, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { PostDataOutput } from "@/lib/services/posts-service";
import type { BusinessProfileData } from "@/lib/services/business-profile-service";
import Image from "next/image";

interface BoostPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: NonNullable<PostDataOutput["post"]> | null;
  businessProfile: BusinessProfileData | null;
  onBoostSuccess?: () => void;
}

export function BoostPostModal({
  isOpen,
  onClose,
  post,
  businessProfile,
  onBoostSuccess,
}: BoostPostModalProps) {
  const { toast } = useToast();

  // States
  const [objective, setObjective] = useState("POST_ENGAGEMENT");
  const [budget, setBudget] = useState("20");
  const [durationDays, setDurationDays] = useState("5");

  // Targeting States
  const [location, setLocation] = useState(businessProfile?.address || "BR");
  const [ageMin, setAgeMin] = useState("18");
  const [ageMax, setAgeMax] = useState("65");
  const [interests, setInterests] = useState("");

  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);

  // Func para simular o "Sugerir Público com IA" (A ser implementada real na próxima etapa)
  const handleSuggestAudience = async () => {
    if (!post || !businessProfile) {
      toast({
        variant: "destructive",
        title: "Dados insuficientes",
        description: "Não foi possível carregar o contexto do negócio para sugerir o público.",
      });
      return;
    }

    setIsSuggesting(true);
    try {
      // TODO: Conectar com o endpoint /api/ai/suggest-audience que faremos em seguida
      // Simulando delay da IA
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulação de preenchimento inteligente
      setInterests("Empreendedorismo, Marketing Digital, Pequenas Empresas");
      setLocation("São Paulo, SP (Raio 15km)");
      setAgeMin("25");
      setAgeMax("45");

      toast({
        title: "Público Sugerido!",
        description: "A IA analisou seu post e seu negócio para criar essa segmentação.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na IA",
        description: "Não foi possível gerar a sugestão agora.",
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleBoost = async () => {
    if (!post) return;
    setIsBoosting(true);

    try {
      // TODO: Conectar com endpoint real /api/ads/boost
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: "Post Impulsionado com Sucesso! 🚀",
        description: "Seu anúncio está em análise pela Meta e começará a rodar em breve.",
      });

      onBoostSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao impulsionar",
        description: error.message || "Tente novamente mais tarde.",
      });
    } finally {
      setIsBoosting(false);
    }
  };

  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <TrendingUp className="h-6 w-6 text-primary" />
            Impulsionar Publicação
          </DialogTitle>
          <DialogDescription>
            Transforme este post em um anúncio de alta performance com a ajuda da IA.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 py-4 md:grid-cols-2">
          {/* Post Preview (Left Side) */}
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-semibold text-muted-foreground">Prévia do Post</p>
            {post.imageUrl && (
              <div className="relative aspect-square w-full overflow-hidden rounded-md border">
                <Image src={post.imageUrl} alt="Preview" fill className="object-cover" />
              </div>
            )}
            <p className="line-clamp-3 text-sm text-foreground">{post.text}</p>
          </div>

          {/* Configs (Right Side) */}
          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <Label htmlFor="objective">Objetivo da Campanha</Label>
              <Select value={objective} onValueChange={setObjective}>
                <SelectTrigger id="objective">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST_ENGAGEMENT">
                    Engajamento (Curtidas e Comentários)
                  </SelectItem>
                  <SelectItem value="LINK_CLICKS">Tráfego (Visitas ao Site/Perfil)</SelectItem>
                  <SelectItem value="MESSAGES">Mensagens (WhatsApp/Direct)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 font-bold text-primary">
                  <Target className="h-4 w-4" /> Público Alvo
                </Label>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleSuggestAudience}
                  disabled={isSuggesting}
                  className="bg-white text-primary hover:bg-primary/10"
                >
                  {isSuggesting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Sugerir com IA
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-xs">
                  Localização (País, Estado ou Cidade)
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-9 pl-9"
                    placeholder="Ex: São Paulo, SP"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="ageMin" className="text-xs">
                    Idade Mín.
                  </Label>
                  <Input
                    id="ageMin"
                    value={ageMin}
                    onChange={(e) => setAgeMin(e.target.value)}
                    type="number"
                    className="h-9"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label htmlFor="ageMax" className="text-xs">
                    Idade Máx.
                  </Label>
                  <Input
                    id="ageMax"
                    value={ageMax}
                    onChange={(e) => setAgeMax(e.target.value)}
                    type="number"
                    className="h-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="interests" className="text-xs">
                  Interesses (Separe por vírgula)
                </Label>
                <Textarea
                  id="interests"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="Ex: Pets, Cachorros, Banho e Tosa"
                  className="h-16 resize-none text-sm"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="budget">Orçamento Diário (R$)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  min="5"
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="duration">Duração (Dias)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  min="1"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded bg-muted p-3 text-sm font-medium">
              <span>Investimento Total Previsto:</span>
              <span className="text-lg font-bold text-primary">
                R$ {(parseInt(budget || "0") * parseInt(durationDays || "0")).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="ghost" onClick={onClose} disabled={isBoosting}>
            Cancelar
          </Button>
          <Button
            onClick={handleBoost}
            disabled={isBoosting || isSuggesting}
            className="bg-primary px-8 font-bold hover:bg-primary/90"
          >
            {isBoosting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <TrendingUp className="mr-2 h-4 w-4" />
            )}
            Confirmar Impulsionamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
