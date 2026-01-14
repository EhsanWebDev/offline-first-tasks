import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // always fetch fresh data
      staleTime: 0,
    },
  },
});

export default queryClient;
