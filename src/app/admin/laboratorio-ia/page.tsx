"use client";

import React, { useState } from "react";
import { FlaskConical, Image as ImageIcon, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function LaboratorioIAPage() {
  const [model, setModel] = useState("gemini-3.5-flash");
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState(
    "Você é um especialista em Copywriting Sênior, Marketing e Diretor de Arte de redes sociais...\n(Preencha com o prompt de teste)"
  );
  const [userPrompt, setUserPrompt] = useState("Crie um post para o Instagram focado em conversão.");
  
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
        throw new Error(data.error || "Erro desconhecido");
      }

      setResult(data.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
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
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                  <option value="gemini-3-pro-image">Gemini 3 Pro Image (Vision)</option>
                  <option value="manus-1.6">Manus 1.6 (Agent)</option>
                  <option value="manus-1.6-lite">Manus 1.6 Lite</option>
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
            <h2 className="mb-4 font-semibold text-gray-800">2. Prompt de Sistema (Instruções)</h2>
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
            <div className="flex-1 overflow-auto rounded-md bg-black p-4 font-mono text-sm text-green-400">
              <pre className="whitespace-pre-wrap">{typeof result === 'object' ? JSON.stringify(result, null, 2) : result}</pre>
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
