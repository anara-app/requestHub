import { useState } from "react";
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

type WorkflowRoleEnum =
  | "INITIATOR_SUPERVISOR"
  | "CEO"
  | "LEGAL"
  | "PROCUREMENT"
  | "FINANCE_MANAGER"
  | "ACCOUNTING"
  | "HR_SPECIALIST"
  | "SYSTEM_AUTOMATION"
  | "SECURITY_REVIEW"
  | "SECURITY_GUARD"
  | "INDUSTRIAL_SAFETY";

interface WorkflowStep {
  role: WorkflowRoleEnum;
  type: string;
  label: string;
}

export default function WorkflowTemplatesPage() {
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
        <PageTitle>Workflow Templates</PageTitle>
        <Group>
          <Switch
            label={showArchived ? "Show Active" : "Show Archived"}
            checked={showArchived}
            onChange={(event) => setShowArchived(event.currentTarget.checked)}
          />

          <Button
            leftSection={<Plus size={16} />}
            onClick={handleCreateTemplate}
          >
            Create Template
          </Button>
        </Group>
      </Group>

      {displayTemplates.length === 0 ? (
        <Center style={{ height: 200 }}>
          <Text c="dimmed">
            {showArchived
              ? "No archived templates found"
              : "No workflow templates found. Create one to get started."}
          </Text>
        </Center>
      ) : (
        <ScrollArea>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Steps</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Created By</Table.Th>
                {showArchived && <Table.Th>Archived Date</Table.Th>}
                {showArchived && <Table.Th>Archived By</Table.Th>}
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
                        {template.description || "No description"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light">{steps.length} steps</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={template.isActive ? "green" : "gray"}
                        variant="light"
                      >
                        {template.isActive ? "Active" : "Archived"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {template.createdBy
                          ? `${template.createdBy.firstName || ""} ${template.createdBy.lastName || ""}`.trim() ||
                            template.createdBy.email
                          : "Unknown"}
                      </Text>
                    </Table.Td>
                    {showArchived && (
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {template.archivedAt
                            ? new Date(template.archivedAt).toLocaleDateString()
                            : "N/A"}
                        </Text>
                      </Table.Td>
                    )}
                    {showArchived && (
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {template.archivedBy
                            ? `${template.archivedBy.firstName || ""} ${template.archivedBy.lastName || ""}`.trim() ||
                              template.archivedBy.email
                            : "N/A"}
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
