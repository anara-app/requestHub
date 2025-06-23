import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/tiptap/styles.css";
import "@mantine/dropzone/styles.css";
import "@mantine/dates/styles.css";
import "dayjs/locale/ru";
import { MantineProvider } from "@mantine/core";
import { theme } from "./common/theme.ts";
import { ModalsProvider } from "@mantine/modals";
import { I18nProvider } from "@lingui/react";
import { i18n, initializeLanguage } from "./common/i18n.ts";

//@ts-expect-error TODO: fix this
import { messages as messagesRu } from "../locales/ru/messages.po";
//@ts-expect-error TODO: fix this
import { messages as messagesEn } from "../locales/en/messages.po";

i18n.load("ru", messagesRu);
i18n.load("en", messagesEn);
i18n.activate("ru");

initializeLanguage();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <MantineProvider theme={theme}>
    <ModalsProvider>
      <I18nProvider i18n={i18n}>
        <App />
      </I18nProvider>
    </ModalsProvider>
  </MantineProvider>
);
