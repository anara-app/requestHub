import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Loader,
  Center,
  Text,
  ScrollArea,
  Badge,
  Group,
  Switch,
} from "@mantine/core";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../../../common/trpc";
import Container from "../../../components/Container";
import PageTitle from "../../../components/PageTitle";
import { ROUTES } from "../../../router/routes";
import { useLingui } from "@lingui/react/macro";

interface WorkflowStep {
  assigneeType: 'ROLE_BASED' | 'DYNAMIC';
  roleBasedAssignee?: string;
  dynamicAssignee?: string;
  actionLabel: string;
  type: string;
}

export default function WorkflowTemplatesPage() {
  const { t } = useLingui();
  const navigate = useNavigate();
  const [showArchived, setShowArchived] = useState(false);

  const { data: templates, isLoading } =
    trpc.admin.workflows.getTemplates.useQuery();
  const { data: archivedTemplates } =
    trpc.admin.workflows.getArchivedTemplates.useQuery();

  // Filter templates based on showArchived toggle
  const displayTemplates = showArchived
    ? archivedTemplates || []
    : templates || [];

  const handleCreateTemplate = () => {
    navigate(ROUTES.NEW_WORKFLOW_TEMPLATE);
  };

  const handleViewTemplate = (template: any) => {
    navigate(`${ROUTES.DASHBOARD_WORKFLOW_TEMPLATE}/${template.id}`);
  };

  if (isLoading) {
    return (
      <Container>
        <Center style={{ height: 400 }}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  return (
    <Container>
      <Group justify="space-between" align="center" mb="lg">
        <PageTitle>{t`Workflow Templates`}</PageTitle>
        <Group>
          <Switch
            label={showArchived ? t`Show Active` : t`Show Archived`}
            checked={showArchived}
            onChange={(event) => setShowArchived(event.currentTarget.checked)}
          />

          <Button
            leftSection={<Plus size={16} />}
            onClick={handleCreateTemplate}
          >
            {t`Create Template`}
          </Button>
        </Group>
      </Group>

      {displayTemplates.length === 0 ? (
        <Center style={{ height: 200 }}>
          <Text c="dimmed">
            {showArchived
              ? t`No archived templates found`
              : t`No workflow templates found. Create one to get started.`}
          </Text>
        </Center>
      ) : (
        <ScrollArea>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t`Name`}</Table.Th>
                <Table.Th>{t`Description`}</Table.Th>
                <Table.Th>{t`Steps`}</Table.Th>
                <Table.Th>{t`Status`}</Table.Th>
                <Table.Th>{t`Created By`}</Table.Th>
                {showArchived && <Table.Th>{t`Archived Date`}</Table.Th>}
                {showArchived && <Table.Th>{t`Archived By`}</Table.Th>}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {displayTemplates.map((template: any) => {
                let steps: any[] = [];
                try {
                  steps = JSON.parse(template.steps);
                } catch (error) {
                  steps = [];
                }

                return (
                  <Table.Tr
                    key={template.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => handleViewTemplate(template)}
                  >
                    <Table.Td>
                      <Text fw={500}>{template.name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed" lineClamp={2}>
                        {template.description || t`No description`}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light">{steps.length} {t`steps`}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={template.isActive ? "green" : "gray"}
                        variant="light"
                      >
                        {template.isActive ? t`Active` : t`Archived`}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {template.createdBy
                          ? `${template.createdBy.firstName || ""} ${template.createdBy.lastName || ""}`.trim() ||
                            template.createdBy.email
                          : t`Unknown`}
                      </Text>
                    </Table.Td>
                    {showArchived && (
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {template.archivedAt
                            ? new Date(template.archivedAt).toLocaleDateString()
                            : t`N/A`}
                        </Text>
                      </Table.Td>
                    )}
                    {showArchived && (
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {template.archivedBy
                            ? `${template.archivedBy.firstName || ""} ${template.archivedBy.lastName || ""}`.trim() ||
                              template.archivedBy.email
                            : t`N/A`}
                        </Text>
                      </Table.Td>
                    )}
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}
    </Container>
  );
}
