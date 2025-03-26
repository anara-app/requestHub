import { RouterProvider } from "react-router-dom";
import { router } from "./router/router";
import { useState } from "react";
import { trpc } from "./common/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { notifications, Notifications } from "@mantine/notifications";
import { ENV_KEYS } from "./common/constants";
import { TokenManager } from "./common/tokens";

function App() {
  const [queryClient] = useState(() => new QueryClient());

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: ENV_KEYS.TRPC_URL,
          async headers() {
            const token = TokenManager.getToken();
            return {
              Authorization: token ? `Bearer ${token}` : undefined,
            };
          },
          fetch: async (input, init) => {
            const response = await fetch(input, init);
            if (response.status === 401) {
              router.navigate("/auth");
              return response;
            }
            if (response.status === 403) {
              notifications.show({
                title: "Доступ запрещен",
                message: "У вас нет разрешения на выполнение этого действия",
                color: "red",
              });
              return response;
            }
            return response;
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Notifications position="top-center" />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
