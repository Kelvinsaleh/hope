"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { createChatSession } from "@/lib/api/chat";

const BookSession = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleBooking = async () => {
    try {
      setIsLoading(true);
      // Simulate booking delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: "Session Booked!",
        description: "Your therapy session has been confirmed.",
      });

      // Create a new session and redirect to it
      const newSessionId = await createChatSession();
      router.push(`/therapy/${newSessionId}`);
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Book a Session</h3>
      <p className="text-sm text-muted-foreground">30-minute therapy session</p>
      <Button onClick={handleBooking} disabled={isLoading} className="w-full">
        {isLoading ? "Processing..." : "Book Now"}
      </Button>
    </div>
  );
};

export default BookSession;
