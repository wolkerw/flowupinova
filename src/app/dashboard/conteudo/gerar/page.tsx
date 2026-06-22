"use client";

import React, { Suspense } from "react";
import { WizardProvider, useWizard } from "./context/WizardContext";
import { Step1Idea } from "./_components/Step1Idea";
import { Step2TextSelection } from "./_components/Step2TextSelection";
import { Step3ImageSelection } from "./_components/Step3ImageSelection";
import { Step4BrandCustomization } from "./_components/Step4BrandCustomization";
import { Step5ReviewPublish } from "./_components/Step5ReviewPublish";
import { SchedulerModal } from "./_components/SchedulerModal";

function WizardContent() {
  const {
    step,
    setStep,
    showSchedulerModal,
    setShowSchedulerModal,
    scheduleDateTime,
    setScheduleDateTime,
    handlePublish,
    isPublishing,
    selectedImage,
    selectedContentId,
    referenceImageFile,
    mode,
  } = useWizard();

  const isReferenceMode = mode === "reference-photo" || mode === "reference-link";

  const wizardSteps =
    mode === "reference-photo"
      ? [
          { number: 1, label: "Ideia" },
          { number: 2, label: "Conteúdo" },
          { number: 3, label: "Marca" },
          { number: 4, label: "Revisão e Publicação" },
        ]
      : [
          { number: 1, label: "Ideia" },
          { number: 2, label: "Texto" },
          { number: 3, label: "Imagem" },
          { number: 4, label: "Marca" },
          { number: 5, label: "Revisão e Publicação" },
        ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Gerar Post</h1>
        <p className="mt-1 text-gray-600">
          {step === 1 &&
            "Etapa 1: Detalhe à nossa IA uma ideia e ela criará um post incrível para você."}
          {step === 2 &&
            (mode === "reference-photo"
              ? "Etapa 2: Selecione uma opção de legenda e acompanhe a imagem gerada."
              : "Etapa 2: Selecione uma opção de texto para o seu post.")}
          {step === 3 &&
            (mode === "reference-photo"
              ? "Etapa 3: Personalize sua imagem com sua logomarca."
              : isReferenceMode
                ? "Etapa 3: Veja a imagem criada a partir do seu produto."
                : "Etapa 3: Gere e selecione a melhor imagem para o seu post.")}
          {step === 4 &&
            (mode === "reference-photo"
              ? "Etapa 4: Revise e agende seu post para as redes sociais."
              : "Etapa 4: Personalize sua imagem com sua logomarca.")}
          {step === 5 &&
            mode !== "reference-photo" &&
            "Etapa 5: Revise e agende seu post para as redes sociais."}
        </p>
      </div>

      {/* Stepper Interativo */}
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6">
        {wizardSteps.map((s) => (
          <button
            key={s.number}
            onClick={() => {
              if (s.number <= step) {
                setStep(s.number);
              }
            }}
            disabled={s.number > step}
            className={`flex items-center gap-2 rounded-2xl px-3 py-1.5 transition-all duration-300 md:px-5 md:py-2 ${
              step === s.number
                ? "scale-105 border-2 border-accent bg-accent text-white shadow-lg shadow-orange-100"
                : s.number < step
                  ? "border-2 border-primary/20 bg-white text-primary hover:border-primary/40 hover:bg-primary/5"
                  : "cursor-not-allowed border-2 border-gray-100 bg-white text-gray-300 opacity-50"
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                step === s.number
                  ? "bg-white text-accent"
                  : s.number < step
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-300"
              }`}
            >
              {s.number}
            </span>
            <span className="hidden text-sm font-bold sm:inline">{s.label}</span>
          </button>
        ))}
      </div>

      {step === 1 && <Step1Idea />}
      {step === 2 && <Step2TextSelection />}
      {step === 3 &&
        (mode === "reference-photo" ? <Step4BrandCustomization /> : <Step3ImageSelection />)}
      {step === 4 &&
        (mode === "reference-photo" ? <Step5ReviewPublish /> : <Step4BrandCustomization />)}
      {step === 5 && mode !== "reference-photo" && <Step5ReviewPublish />}

      <SchedulerModal
        isOpen={showSchedulerModal}
        onClose={() => setShowSchedulerModal(false)}
        scheduleDateTime={scheduleDateTime}
        onDateTimeChange={setScheduleDateTime}
        onConfirm={() => handlePublish("schedule")}
        isPublishing={isPublishing}
      />
    </div>
  );
}

export default function GerarConteudoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <p>Carregando...</p>
        </div>
      }
    >
      <WizardProvider>
        <WizardContent />
      </WizardProvider>
    </Suspense>
  );
}
