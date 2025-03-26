import { Box } from "@mantine/core";
import { PropsWithChildren } from "react";

export default function Container({ children }: PropsWithChildren) {
  return <Box p="md">{children}</Box>;
}
