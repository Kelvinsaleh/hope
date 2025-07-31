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

const glowAnimation = {
  initial: { opacity: 0.5, scale: 1 },
  animate: {
    opacity: [0.5, 1, 0.5],
    scale: [1, 1.05, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
    },
  },
};

const detectStressSignals = (message: string) => {
  const stressKeywords = [
    "stress",
    "anxiety",
    "worried",
    "panic",
    "overwhelmed",
    "nervous",
    "tense",
    "pressure",
  ];
  const foundKeyword = stressKeywords.find((kw) =>
    message.toLowerCase().includes(kw)
  );
  if (foundKeyword) {
    const activities = [
      {
        type: "breathing",
        title: "Calming Breaths",
        description: "Follow calming breathing exercises with visual guidance",
      },
      {
        type: "garden",
        title: "Zen Garden",
        description: "Create and maintain your digital peaceful space",
      },
      {
        type: "forest",
        title: "Mindful Forest",
        description: "Take a peaceful walk through a virtual forest",
      },
      {
        type: "waves",
        title: "Ocean Waves",
        description: "Match your breath with gentle ocean waves",
      },
    ];
    return {
      trigger: foundKeyword,
      activity: activities[Math.floor(Math.random() * activities.length)],
    };
  }
  return null;
};

export default function TherapySessionPage({ params }: { params: { sessionId: string } }) {
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

  // Fetch initial chat history
  useEffect(() => {
    const initChat = async () => {
      setIsLoading(true);
      try {
        const history = await getChatHistory(sessionId);
        setMessages(history || []);
      } catch (error) {
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

  // Load all chat sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const allSessions = await getAllChatSessions();
        setSessions(allSessions);
      } catch (error) {
        // handle error
      }
    };
    loadSessions();
  }, [messages]);

  // Scroll to bottom on new message
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  useEffect(() => {
    if (!isTyping) {
      scrollToBottom();
    }
  }, [messages, isTyping]);

  // Handle message send
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

      const stressCheck = detectStressSignals(currentMessage);
      if (stressCheck) {
        setStressPrompt(stressCheck);
        setIsTyping(false);
        return;
      }

      // Replace this with your API call
      const response = await fetch(`/api/chat/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentMessage }),
      }).then(res => res.json());

      const aiResponse = typeof response === "string" ? JSON.parse(response) : response;

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content:
          aiResponse.response ||
          aiResponse.message ||
          "I'm here to support you. Could you tell me more about what's on your mind?",
        timestamp: new Date(),
        metadata: {
          analysis: aiResponse.analysis || {
            emotionalState: "neutral",
            riskLevel: 0,
            themes: [],
            recommendedApproach: "supportive",
            progressIndicators: [],
          },
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
      scrollToBottom();
    } catch (error) {
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

  const handleSuggestedQuestion = async (text: string) => {
    if (!sessionId) {
      const newSessionId = await createChatSession();
      setSessionId(newSessionId);
      router.push(`/therapy/${newSessionId}`);
    }
    setMessage(text);
    setTimeout(() => {
      const textarea = document.querySelector("textarea");
      if (textarea) textarea.focus();
    }, 50);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Main chat area */}
        <div className="w-full max-w-3xl mx-auto flex flex-col flex-1 bg-white dark:bg-background rounded-lg border shadow-sm min-h-[60vh] sm:min-h-[70vh]">

          {/* Chat header */}
          <div className="p-3 sm:p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-base sm:text-lg">AI Therapist</h2>
                <p className="text-xs text-muted-foreground">
                  {messages.length} messages
                </p>
              </div>
            </div>
          </div>

          {/* Chat history */}
          <div className="flex-1 overflow-y-auto scroll-smooth w-full px-1 sm:px-4 py-2">
            <div className="max-w-full">
              <AnimatePresence initial={false}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-10">
                    <div className="text-center space-y-4">
                      <div className="relative inline-flex flex-col items-center">
                        <motion.div
                          className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"
                          initial="initial"
                          animate="animate"
                          variants={glowAnimation}
                        />
                        <div className="relative flex items-center gap-2 text-2xl font-semibold">
                          <div className="relative">
                            <Sparkles className="w-6 h-6 text-primary" />
                            <motion.div
                              className="absolute inset-0 text-primary"
                              initial="initial"
                              animate="animate"
                              variants={glowAnimation}
                            >
                              <Sparkles className="w-6 h-6" />
                            </motion.div>
                          </div>
                          <span className="bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">
                            AI Therapist
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-2 text-sm">
                          How can I assist you today?
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {SUGGESTED_QUESTIONS.map((q) => (
                          <button
                            key={q.text}
                            onClick={() => handleSuggestedQuestion(q.text)}
                            className="px-3 py-1 rounded-full border bg-muted text-xs sm:text-sm shadow hover:bg-primary/10 focus:outline-none"
                          >
                            {q.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <motion.div
                      key={msg.timestamp?.toString() || Math.random()}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "mb-2 rounded-lg break-words",
                        msg.role === "assistant"
                          ? "bg-muted/30 px-3 py-4 sm:px-6 sm:py-6"
                          : "bg-background px-3 py-4 sm:px-6 sm:py-6"
                      )}
                      style={{ wordBreak: "break-word" }}
                    >
                      <div className="flex gap-3 items-start">
                        <div className="w-8 h-8 shrink-0 mt-1">
                          {msg.role === "assistant" ? (
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
                              <Bot className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-1 overflow-hidden min-h-[2rem]">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">
                              {msg.role === "assistant"
                                ? "AI Therapist"
                                : "You"}
                            </p>
                            {msg.metadata?.technique && (
                              <Badge variant="secondary" className="text-xs">
                                {msg.metadata.technique}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm break-words whitespace-pre-wrap">{msg.content}</div>
                          <div className="text-[11px] text-muted-foreground mt-1">
                            {msg.timestamp &&
                              formatDistanceToNow(new Date(msg.timestamp), {
                                addSuffix: true,
                              })}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </AnimatePresence>
            </div>
          </div>

          {/* Input area */}
          <div className="border-t bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/50 px-2 py-3 sm:px-4">
            <form
              onSubmit={handleSubmit}
              className="w-full flex flex-col sm:flex-row gap-2 sm:gap-4 items-end"
            >
              <div className="flex-1 relative group">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    isChatPaused
                      ? "Complete the activity to continue..."
                      : "Ask me anything..."
                  }
                  className={cn(
                    "w-full resize-none rounded-2xl border bg-background px-3 py-2 text-base sm:text-lg min-h-[44px] max-h-40 transition focus:outline-primary",
                    isChatPaused && "opacity-70 cursor-not-allowed"
                  )}
                  rows={1}
                  disabled={isChatPaused}
                  autoFocus
                  style={{ wordBreak: "break-word" }}
                />
              </div>
              <Button
                type="submit"
                className={cn(
                  "h-11 w-11 sm:h-12 sm:w-12 flex items-center justify-center p-0 shadow transition",
                  (isTyping || isChatPaused || !message.trim()) && "opacity-50 cursor-not-allowed"
                )}
                disabled={isTyping || isChatPaused || !message.trim()}
                aria-label="Send message"
              >
                <Send className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </form>
            <div className="mt-2 text-xs text-center text-muted-foreground">
              Press <kbd className="px-2 py-0.5 rounded bg-muted">Enter ↵</kbd>{" "}
              to send, <kbd className="px-2 py-0.5 rounded bg-muted ml-1">Shift + Enter</kbd> for new line
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
