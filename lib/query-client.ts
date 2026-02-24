import { QueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
    mutations: {
      onError: (error) => {
        toast.error(
          error instanceof AxiosError
            ? error.response?.data?.error || error.message
            : "An error occurred while performing the operation",
        );
      },
    },
  },
});
