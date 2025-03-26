import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/tiptap/styles.css";
import "@mantine/dropzone/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/tiptap/styles.css";
import "@mantine/dates/styles.css";
import "dayjs/locale/ru";
import { MantineProvider } from "@mantine/core";
import { theme } from "./common/theme.ts";
import { ModalsProvider } from "@mantine/modals";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <MantineProvider theme={theme}>
    <ModalsProvider>
      <App />
    </ModalsProvider>
  </MantineProvider>
);
