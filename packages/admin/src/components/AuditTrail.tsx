import { useLingui } from "@lingui/react/macro";
import { Paper, Text, Table, Group, Badge, Stack } from "@mantine/core";
import {
  User,
  CheckCircle,
  XCircle,
  MessageCircle,
  Plus,
  ArrowRight,
  FileText,
} from "lucide-react";

interface AuditTrailEntry {
  id: string;
  action: string;
  description: string;
  details?: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    role?: {
      name: string;
    } | null;
  };
}

interface AuditTrailProps {
  auditTrail: AuditTrailEntry[];
  isLoading?: boolean;
}

export default function AuditTrail({ auditTrail, isLoading }: AuditTrailProps) {
  const { t } = useLingui();
  const getActionIcon = (action: string) => {
    switch (action) {
      case "REQUEST_CREATED":
        return <Plus size={16} />;
      case "REQUEST_SUBMITTED":
        return <FileText size={16} />;
      case "REQUEST_APPROVED":
        return <CheckCircle size={16} />;
      case "REQUEST_REJECTED":
        return <XCircle size={16} />;
      case "STEP_PROGRESSED":
        return <ArrowRight size={16} />;
      case "COMMENT_ADDED":
        return <MessageCircle size={16} />;
      default:
        return <User size={16} />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "REQUEST_CREATED":
        return "blue";
      case "REQUEST_SUBMITTED":
        return "cyan";
      case "REQUEST_APPROVED":
        return "green";
      case "REQUEST_REJECTED":
        return "red";
      case "STEP_PROGRESSED":
        return "violet";
      case "COMMENT_ADDED":
        return "orange";
      case "REQUEST_CANCELLED":
        return "gray";
      default:
        return "gray";
    }
  };

  const formatActionLabel = (action: string) => {
    return action
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  if (isLoading) {
    return (
      <Paper shadow="sm" p="lg" withBorder>
        <Text size="lg" fw={500} mb="md">{t`Audit Trail`}</Text>
        <Text c="dimmed">{t`Loading audit trail...`}</Text>
      </Paper>
    );
  }

  if (!auditTrail || auditTrail.length === 0) {
    return (
      <Paper shadow="sm" p="lg" withBorder>
        <Text size="lg" fw={500} mb="md">{t`Audit Trail`}</Text>
        <Text c="dimmed" ta="center" py="md">
          {t`No audit trail entries found`}
        </Text>
      </Paper>
    );
  }

  return (
    <Paper shadow="sm" p="lg" withBorder>
      <Text size="lg" fw={500} mb="md">{t`Audit Trail`}</Text>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t`Action`}</Table.Th>
            <Table.Th>{t`Description`}</Table.Th>
            <Table.Th>{t`User`}</Table.Th>
            <Table.Th>{t`Role`}</Table.Th>
            <Table.Th>{t`Date`}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {auditTrail.map((entry) => (
            <Table.Tr key={entry.id}>
              <Table.Td>
                <Group gap="xs">
                  {getActionIcon(entry.action)}
                  <Badge
                    color={getActionColor(entry.action)}
                    variant="light"
                    size="sm"
                  >
                    {formatActionLabel(entry.action)}
                  </Badge>
                </Group>
              </Table.Td>
              <Table.Td>
                <Stack gap="xs">
                  <Text size="sm" fw={500}>
                    {entry.description}
                  </Text>
                  {entry.details && (
                    <Text size="xs" c="dimmed">
                      {entry.details}
                    </Text>
                  )}
                </Stack>
              </Table.Td>
              <Table.Td>
                <Text size="sm">
                  {entry.user.firstName} {entry.user.lastName}
                </Text>
              </Table.Td>
              <Table.Td>
                {entry.user.role && (
                  <Badge size="sm" variant="outline" color="gray">
                    {entry.user.role.name}
                  </Badge>
                )}
              </Table.Td>
              <Table.Td>
                <Text size="xs" c="dimmed">
                  {new Date(entry.createdAt).toLocaleString()}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}
