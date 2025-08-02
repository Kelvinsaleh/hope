"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { createChatSession } from "@/lib/api/chat";

const StartSessionModal = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("text");
  const [error, setError] = useState<string>("");

  const handleStartSession = async () => {
    try {
      if (type !== "text") {
        setError("This session type is coming soon. Please select Text Chat.");
        return;
      }
      setOpen(false);

      // Create a new session and redirect to it
      const newSessionId = await createChatSession();
      router.push(`/therapy/${newSessionId}`);
    } catch (error) {
      console.error("Failed to start session:", error);
      setError("Failed to start session. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="flex items-center gap-2 w-full">
          <MessageSquare className="w-4 h-4" />
          Start Therapy Session
        </Button>
      </DialogTrigger>
      {/* Dialog content here */}
      {/* ...your modal UI */}
      <Button onClick={handleStartSession}>Start Session</Button>
      {error && <p className="text-red-500">{error}</p>}
    </Dialog>
  );
};

export default StartSessionModal;
