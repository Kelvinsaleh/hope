import { createChatSession } from "@/lib/api/chat";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

const BookSession = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleBooking = async () => {
    try {
      setIsLoading(true);
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

  // ...rest of file remains unchanged
};
