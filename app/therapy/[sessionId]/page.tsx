"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getChatHistory, ChatMessage, createChatSession } from "@/lib/api/chat";
import { Button } from "@/components/ui/button";

const TherapySessionPage = ({ params }: { params: { sessionId: string } }) => {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState(params.sessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial chat history with error logging
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

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    const currentMessage = message.trim();
    if (!currentMessage || isTyping || !sessionId) return;

    setMessage("");
    setIsTyping(true);

    try {
      const userMessage: ChatMessage = {
        role: "user",
        content: currentMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

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
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <span>Loading chat...</span>
          </div>
        ) : (
          <div>
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">
                Start your conversation below...
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`my-2 ${
                    msg.role === "assistant"
                      ? "text-blue-700 bg-blue-50 rounded-lg px-4 py-2"
                      : "text-black bg-gray-100 rounded-lg px-4 py-2 text-right"
                  }`}
                >
                  <div>
                    <strong>
                      {msg.role === "assistant" ? "AI: " : "You: "}
                    </strong>
                    <span>{msg.content}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {msg.timestamp && new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex p-4 border-t bg-background">
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="flex-1 border rounded-xl px-3 py-2 mr-2"
          placeholder="Type your message..."
          disabled={isTyping}
        />
        <Button type="submit" disabled={isTyping || !message.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
};

export default TherapySessionPage;
