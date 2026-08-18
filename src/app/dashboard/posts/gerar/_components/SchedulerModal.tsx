"use client";

import React from "react";
import { motion } from "framer-motion";
import { CalendarIcon, X, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleDateTime: string;
  onDateTimeChange: (value: string) => void;
  onConfirm: () => void;
  isPublishing: boolean;
}

export const SchedulerModal = ({
  isOpen,
  onClose,
  scheduleDateTime,
  onDateTimeChange,
  onConfirm,
  isPublishing,
}: SchedulerModalProps) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="max-md w-full max-w-md rounded-xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b p-6">
          <h3 className="flex items-center gap-2 text-xl font-bold">
            <CalendarIcon className="h-5 w-5" /> Agendar Publicação
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="space-y-4 p-6">
          <Label htmlFor="schedule-datetime">Data e Hora</Label>
          <Input
            id="schedule-datetime"
            type="datetime-local"
            value={scheduleDateTime}
            onChange={(e) => onDateTimeChange(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-3 border-t bg-gray-50 p-6">
          <Button variant="outline" onClick={onClose} disabled={isPublishing}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPublishing || !scheduleDateTime}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            {isPublishing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Confirmar
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};
