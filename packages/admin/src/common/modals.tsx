import { Text } from "@mantine/core";
import { modals } from "@mantine/modals";

interface Options {
  title?: string;
  body?: string;
  labels?: { confirm?: string; cancel?: string };
  color?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
}

export function confirmModal({
  title = "Внимание",
  body = "Вы уверены, что хотите продолжить это действие?",
  labels,
  color = "red",
  onCancel,
  onConfirm,
}: Options) {
  modals.openConfirmModal({
    title: <Text fw="bold">{title}</Text>,
    centered: true,
    children: <Text size="sm">{body}</Text>,
    labels: {
      confirm: labels?.confirm || "Подтвердить",
      cancel: labels?.cancel || "Отмена",
    },
    confirmProps: { color },
    onCancel,
    onConfirm,
  });
}
