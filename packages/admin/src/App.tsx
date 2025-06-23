import { RouterProvider } from "react-router-dom";
import { router } from "./router/router";
import { useState } from "react";
import { trpc } from "./common/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { notifications, Notifications } from "@mantine/notifications";
import { ENV_KEYS } from "./common/constants";
import { ROUTES } from "./router/routes";
import { i18n } from "./common/i18n";

function App() {
  const [queryClient] = useState(() => new QueryClient());

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: ENV_KEYS.TRPC_URL,
          fetch: async (input, init) => {
            const modifiedInit = {
              ...init,
              credentials: "include", // <-- THIS IS WHERE IT BELONGS
            };

            //@ts-expect-error types on credentials
            const response = await fetch(input, modifiedInit);

            if (response.status === 401) {
              router.navigate({
                pathname: ROUTES.AUTH,
                search: `?redirectedFrom=${window.location.pathname}`,
              });
              return response;
            }

            if (response.status === 403) {
              notifications.show({
                title: i18n._("Access Denied"),
                message: i18n._("You don't have permission to perform this action"),
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
