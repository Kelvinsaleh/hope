"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Send, User, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getChatHistory, ChatMessage, getAllChatSessions, createChatSession } from "@/lib/api/chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";

// Suggested questions, animations, etc.
const SUGGESTED_QUESTIONS = [
  { text: "How can I manage my anxiety better?" },
  { text: "I've been feeling overwhelmed lately" },
  { text: "Can we talk about improving sleep?" },
  { text: "I need help with work-life balance" },
];

const TherapySessionPage = ({ params }: { params: { sessionId: string } }) => {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatPaused, setIsChatPaused] = useState(false);
  const [stressPrompt, setStressPrompt] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState(params.sessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial chat history with error logging
  useEffect(() => {
    const initChat = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching chat history for session:", sessionId);
        const history = await getChatHistory(sessionId);
        console.log("Chat history response:", history);
        setMessages(history || []);
      } catch (error) {
        console.error("Error fetching chat history:", error);
        setMessages([
          {
            role: "assistant",
            content:
              "I apologize, but I'm having trouble loading the chat session. Please try refreshing the page.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    initChat();
  }, [sessionId]);

  // Example handleSubmit for sending messages with error logging
  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    const currentMessage = message.trim();
    if (!currentMessage || isTyping || isChatPaused || !sessionId) return;

    setMessage("");
    setIsTyping(true);

    try {
      const userMessage: ChatMessage = {
        role: "user",
        content: currentMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Replace this with your API call
      const response = await fetch(`/api/chat/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentMessage }),
      });

      const aiResponse = await response.json();

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content:
          aiResponse.response ||
          aiResponse.message ||
          "I'm here to support you. Could you tell me more about what's on your mind?",
        timestamp: new Date(),
        metadata: {
          technique: aiResponse.metadata?.technique || "supportive",
          goal: aiResponse.metadata?.currentGoal || "Provide support",
          progress: aiResponse.metadata?.progress || {
            emotionalState: "neutral",
            riskLevel: 0,
          },
        },
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    } catch (error) {
      console.error("Chat send error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    }
  };

  // ...rest of your chat UI and logic

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Chat UI here */}
    </div>
  );
};

export default TherapySessionPage;
