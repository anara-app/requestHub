import { Box, Text, Stack, Button, Center } from "@mantine/core";
import { Plus } from "lucide-react";

interface EmptyPlaceholderProps {
  title: string;
  subtitle?: string;
  buttonText?: string;
  onClick?: () => void;
}

export default function EmptyPlaceholder({
  title,
  subtitle,
  buttonText,
  onClick,
}: EmptyPlaceholderProps) {
  return (
    <Box py={40}>
      <Stack align="center" gap="xs">
        <Text size="lg" fw={500}>
          {title}
        </Text>
        {subtitle && (
          <Text size="sm" c="dimmed">
            {subtitle}
          </Text>
        )}
        {buttonText && (
          <Center>
            <Button
              onClick={onClick}
              leftSection={<Plus size={14} />}
              variant="light"
            >
              {buttonText}
            </Button>
          </Center>
        )}
      </Stack>
    </Box>
  );
}
