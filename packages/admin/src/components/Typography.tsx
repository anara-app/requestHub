import { Trans } from "@lingui/react/macro";
import { Text, TextProps } from "@mantine/core";
import { PropsWithChildren } from "react";

export function Typography(props: PropsWithChildren<TextProps>) {
  return (
    <Text component="span" {...props}>
      <Trans>{props.children}</Trans>
    </Text>
  );
}
