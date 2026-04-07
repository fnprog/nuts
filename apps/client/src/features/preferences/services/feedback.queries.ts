import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { feedbackService, type FeedbackData } from "../api/feedback";

export const useFeedbackMutation = () => {
  return useMutation({
    mutationFn: async (data: FeedbackData) => {
      const result = await feedbackService.submitFeedback(data);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      toast.success("Feedback submitted successfully");
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Failed to submit feedback. Please try again.");
    },
  });
};
