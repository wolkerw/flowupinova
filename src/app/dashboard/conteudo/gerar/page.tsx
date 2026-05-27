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
    referenceImageFile
  } = useWizard();

  const wizardSteps = [
    { number: 1, label: "Ideia" },
    { number: 2, label: "Texto" },
    { number: 3, label: "Imagem" },
    { number: 4, label: "Marca" },
    { number: 5, label: "Revisão" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Gerar Post</h1>
        <p className="mt-1 text-gray-600">
          {step === 1 && "Etapa 1: Detalhe à nossa IA uma ideia e ela criará um post incrível para você."}
          {step === 2 && "Etapa 2: Selecione uma opção de texto para o seu post."}
          {step === 3 && (referenceImageFile 
            ? "Etapa 3: Veja a imagem criada a partir do seu produto." 
            : "Etapa 3: Gere e selecione a melhor imagem para o seu post.")}
          {step === 4 && "Etapa 4: Personalize sua imagem com sua logomarca."}
          {step === 5 && "Etapa 5: Revise e agende seu post para as redes sociais."}
        </p>
      </div>

      {/* Stepper Interativo */}
      <div className="flex flex-wrap justify-center items-center gap-3 md:gap-6">
        {wizardSteps.map((s) => (
          <button
            key={s.number}
            onClick={() => {
              if (s.number <= step) {
                setStep(s.number);
              }
            }}
            disabled={s.number > step}
            className={`flex items-center gap-2 px-3 py-1.5 md:px-5 md:py-2 rounded-2xl transition-all duration-300 ${
              step === s.number
                ? "bg-accent text-white shadow-lg shadow-orange-100 scale-105 border-2 border-accent"
                : s.number < step
                ? "bg-white text-primary border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                : "bg-white text-gray-300 border-2 border-gray-100 cursor-not-allowed opacity-50"
            }`}
          >
            <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
              step === s.number 
                ? "bg-white text-accent" 
                : s.number < step 
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-300"
            }`}>
              {s.number}
            </span>
            <span className="text-sm font-bold hidden sm:inline">{s.label}</span>
          </button>
        ))}
      </div>

      {step === 1 && <Step1Idea />}
      {step === 2 && <Step2TextSelection />}
      {step === 3 && <Step3ImageSelection />}
      {step === 4 && selectedImage && <Step4BrandCustomization />}
      {step === 5 && selectedContentId && selectedImage && <Step5ReviewPublish />}

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
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><p>Carregando...</p></div>}>
      <WizardProvider>
        <WizardContent />
      </WizardProvider>
    </Suspense>
  );
}
