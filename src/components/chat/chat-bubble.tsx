"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertCircle, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type Message = {
  sender: 'user' | 'ai';
  text: string;
  isError?: boolean;
};

interface ChatBubbleProps {
  message: Message;
}

const Avatar = ({ sender, isError }: { sender: 'user' | 'ai', isError?: boolean }) => {
  const isUser = sender === 'user';
  
  const icon = isUser ? (
    <User className="h-4 w-4 text-primary-foreground" />
  ) : isError ? (
    <AlertCircle className="h-4 w-4 text-destructive-foreground" />
  ) : (
    <Bot className="h-4 w-4 text-primary-foreground" />
  );

  const background = isUser 
    ? "bg-gradient-to-br from-accent to-primary"
    : isError 
    ? "bg-destructive" 
    : "bg-gradient-to-br from-accent to-primary";

  return (
    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", background)}>
      {icon}
    </div>
  );
};

export const ChatBubble = ({ message }: ChatBubbleProps) => {
  const { sender, text, isError } = message;
  const isUser = sender === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className={cn("mb-4 flex items-start gap-3", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && <Avatar sender={sender} isError={isError} />}
      <div
        className={cn(
          "max-w-md rounded-2xl px-4 py-3",
          isUser
            ? "ml-12 rounded-br-none bg-gradient-to-br from-accent to-primary text-primary-foreground"
            : "mr-12 rounded-bl-none border bg-card text-card-foreground shadow-sm",
          isError && !isUser && "border-destructive/50 bg-destructive/10 text-destructive"
        )}
      >
        {isUser ? (
          <p>{text}</p>
        ) : (
          <ReactMarkdown
            className="prose prose-sm max-w-none prose-p:text-card-foreground prose-headings:text-card-foreground prose-strong:text-card-foreground prose-a:text-primary hover:prose-a:text-primary/80"
            remarkPlugins={[remarkGfm]}
          >
            {text}
          </ReactMarkdown>
        )}
      </div>
      {isUser && <Avatar sender={sender} />}
    </motion.div>
  );
};
