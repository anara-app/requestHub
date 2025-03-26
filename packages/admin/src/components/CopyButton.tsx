import { CopyButton as CButton, ActionIcon, Tooltip, rem } from "@mantine/core";
import { IconCopy, IconCheck } from "@tabler/icons-react";

export default function CopyButton({ text }: { text: string }) {
  return (
    <CButton value={text} timeout={2000}>
      {({ copied, copy }) => (
        <Tooltip label={copied ? "Copied" : "Copy"} withArrow position="right">
          <ActionIcon
            color={copied ? "teal" : "gray"}
            variant="subtle"
            onClick={copy}
          >
            {copied ? (
              <IconCheck style={{ width: rem(16) }} />
            ) : (
              <IconCopy style={{ width: rem(16) }} />
            )}
          </ActionIcon>
        </Tooltip>
      )}
    </CButton>
  );
}
