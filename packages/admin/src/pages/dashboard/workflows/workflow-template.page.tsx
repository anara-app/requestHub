import { useState, useEffect } from "react";
import {
  Button,
  Group,
  Stack,
  Timeline,
  Paper,
  Divider,
  Text,
  Badge,
  TextInput,
  Textarea,
  Select,
  ActionIcon,
  Loader,
  Center,
  Modal,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { User, Edit, Save, X, Plus, Archive, RotateCcw } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
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

// Workflow roles based on the department mapping
const WORKFLOW_ROLES = [
  {
    value: "INITIATOR_SUPERVISOR",
    label: "Руководитель инициатора (Initiator's Supervisor)",
  },
  { value: "CEO", label: "Генеральный директор (CEO)" },
  { value: "LEGAL", label: "Юрист (Legal)" },
  { value: "PROCUREMENT", label: "Сотрудник отдела закупок (Procurement)" },
  { value: "FINANCE_MANAGER", label: "Финансовый менеджер (Finance Manager)" },
  { value: "ACCOUNTING", label: "Бухгалтерия (Accounting)" },
  { value: "HR_SPECIALIST", label: "HR Specialist" },
  { value: "SYSTEM_AUTOMATION", label: "Система (System Automation)" },
  { value: "SECURITY_REVIEW", label: "Служба безопасности (Security Review)" },
  { value: "SECURITY_GUARD", label: "Охрана (Security Guard)" },
  {
    value: "INDUSTRIAL_SAFETY",
    label: "Служба промышленной безопасности (Industrial Safety)",
  },
];

export default function WorkflowTemplatePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [archiveOpened, setArchiveOpened] = useState(false);
  const [restoreOpened, setRestoreOpened] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSteps, setEditSteps] = useState<WorkflowStep[]>([
    { role: "INITIATOR_SUPERVISOR", type: "approval", label: "" },
  ]);

  const {
    data: template,
    isLoading,
    refetch,
  } = trpc.admin.workflows.getTemplate.useQuery({ id: id! }, { enabled: !!id });

  const updateTemplateMutation =
    trpc.admin.workflows.updateTemplate.useMutation({
      onSuccess: () => {
        setIsEditMode(false);
        refetch();
        notifications.show({
          title: "Success",
          message: "Workflow template updated successfully",
          color: "green",
        });
      },
      onError: (error: any) => {
        notifications.show({
          title: "Error",
          message: error.message || "Failed to update workflow template",
          color: "red",
        });
      },
    });

  const archiveTemplateMutation =
    trpc.admin.workflows.archiveTemplate.useMutation({
      onSuccess: () => {
        setArchiveOpened(false);
        setArchiveReason("");
        refetch();
        notifications.show({
          title: "Success",
          message: "Workflow template archived successfully",
          color: "green",
        });
      },
      onError: (error: any) => {
        notifications.show({
          title: "Error",
          message: error.message || "Failed to archive workflow template",
          color: "red",
        });
      },
    });

  const restoreTemplateMutation =
    trpc.admin.workflows.restoreTemplate.useMutation({
      onSuccess: () => {
        setRestoreOpened(false);
        refetch();
        notifications.show({
          title: "Success",
          message: "Workflow template restored successfully",
          color: "green",
        });
      },
      onError: (error: any) => {
        notifications.show({
          title: "Error",
          message: error.message || "Failed to restore workflow template",
          color: "red",
        });
      },
    });

  // Initialize edit form when template loads or edit mode is enabled
  useEffect(() => {
    if (template && isEditMode) {
      setEditName(template.name);
      setEditDescription(template.description || "");

      try {
        const parsedSteps = JSON.parse(template.steps);
        setEditSteps(parsedSteps);
      } catch (error) {
        setEditSteps([
          { role: "INITIATOR_SUPERVISOR", type: "approval", label: "" },
        ]);
      }
    }
  }, [template, isEditMode]);

  const addEditStep = () => {
    setEditSteps([
      ...editSteps,
      { role: "INITIATOR_SUPERVISOR", type: "approval", label: "" },
    ]);
  };

  const removeEditStep = (index: number) => {
    if (editSteps.length > 1) {
      setEditSteps(editSteps.filter((_, i) => i !== index));
    }
  };

  const updateEditStep = (
    index: number,
    field: keyof WorkflowStep,
    value: string
  ) => {
    const updatedSteps = [...editSteps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    setEditSteps(updatedSteps);
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const handleSave = () => {
    if (!template || !editName.trim()) return;

    updateTemplateMutation.mutate({
      id: template.id,
      data: {
        name: editName,
        description: editDescription,
        steps: editSteps,
      },
    });
  };

  const handleArchive = () => {
    setArchiveOpened(true);
  };

  const confirmArchive = () => {
    if (!template) return;

    archiveTemplateMutation.mutate({
      id: template.id,
      reason: archiveReason,
    });
  };

  const handleRestore = () => {
    setRestoreOpened(true);
  };

  const confirmRestore = () => {
    if (!template) return;

    restoreTemplateMutation.mutate({
      id: template.id,
    });
  };

  const handleBackToTemplates = () => {
    navigate(ROUTES.DASHBOARD_WORKFLOW_TEMPLATES);
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

  if (!template) {
    return (
      <Container>
        <Center style={{ height: 400 }}>
          <Stack align="center">
            <Text>Template not found</Text>
            <Button onClick={handleBackToTemplates}>Back to Templates</Button>
          </Stack>
        </Center>
      </Container>
    );
  }

  return (
    <Container>
      <Group justify="space-between" align="center" mb="lg">
        <PageTitle>
          {isEditMode ? "Edit Template" : "Template Details"}
        </PageTitle>
        <Group>
          <Button variant="outline" onClick={handleBackToTemplates}>
            Back to Templates
          </Button>
          {!isEditMode ? (
            <Group>
              {template.isActive && (
                <>
                  <Button leftSection={<Edit size={16} />} onClick={handleEdit}>
                    Edit Template
                  </Button>
                  <Button
                    color="red"
                    variant="outline"
                    leftSection={<Archive size={16} />}
                    onClick={handleArchive}
                  >
                    Archive
                  </Button>
                </>
              )}
              {!template.isActive && (
                <Button
                  color="green"
                  leftSection={<RotateCcw size={16} />}
                  onClick={handleRestore}
                >
                  Restore
                </Button>
              )}
            </Group>
          ) : (
            <Group>
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button
                leftSection={<Save size={16} />}
                onClick={handleSave}
                loading={updateTemplateMutation.isPending}
              >
                Save Changes
              </Button>
            </Group>
          )}
        </Group>
      </Group>

      <Paper p="xl" withBorder>
        <Stack gap="xl">
          {/* Template Information */}
          {!isEditMode ? (
            <>
              <div>
                <Text fw={500} mb="xs">
                  Template Name
                </Text>
                <Text>{template.name}</Text>
              </div>

              <div>
                <Text fw={500} mb="xs">
                  Description
                </Text>
                <Text>{template.description || "No description"}</Text>
              </div>

              <div>
                <Text fw={500} mb="xs">
                  Status
                </Text>
                <Badge
                  color={template.isActive ? "green" : "gray"}
                  variant="light"
                >
                  {template.isActive ? "Active" : "Archived"}
                </Badge>
              </div>

              {!template.isActive && template.archiveReason && (
                <div>
                  <Text fw={500} mb="xs">
                    Archive Reason
                  </Text>
                  <Text size="sm" c="dimmed">
                    {template.archiveReason}
                  </Text>
                </div>
              )}
            </>
          ) : (
            <>
              <TextInput
                label="Template Name"
                placeholder="Enter template name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
              <Textarea
                label="Description"
                placeholder="Enter template description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </>
          )}

          <Divider />

          {/* Workflow Steps */}
          <div>
            <Text fw={500} mb="sm">
              Workflow Steps
            </Text>
            {!isEditMode ? (
              <Timeline>
                {(() => {
                  try {
                    const steps = JSON.parse(template.steps);
                    return steps.map((step: any, index: number) => (
                      <Timeline.Item
                        key={index}
                        bullet={<User size={14} />}
                        title={`Step ${index + 1}: ${step.label || step.role}`}
                      >
                        <Text size="sm" c="dimmed">
                          Role:{" "}
                          {WORKFLOW_ROLES.find((r) => r.value === step.role)
                            ?.label || step.role}
                        </Text>
                        <Text size="sm" c="dimmed">
                          Type: {step.type}
                        </Text>
                      </Timeline.Item>
                    ));
                  } catch (error) {
                    return <Text c="red">Error parsing workflow steps</Text>;
                  }
                })()}
              </Timeline>
            ) : (
              <Stack gap="md">
                {editSteps.map((step, index) => (
                  <Group key={index} align="end">
                    <Select
                      label={`Step ${index + 1} Role`}
                      data={WORKFLOW_ROLES}
                      value={step.role}
                      onChange={(value) =>
                        updateEditStep(
                          index,
                          "role",
                          value || "INITIATOR_SUPERVISOR"
                        )
                      }
                      style={{ flex: 1 }}
                    />
                    <TextInput
                      label="Step Label"
                      placeholder="Enter step label"
                      value={step.label}
                      onChange={(e) =>
                        updateEditStep(index, "label", e.target.value)
                      }
                      style={{ flex: 1 }}
                    />
                    {editSteps.length > 1 && (
                      <ActionIcon
                        color="red"
                        onClick={() => removeEditStep(index)}
                      >
                        <X size={16} />
                      </ActionIcon>
                    )}
                  </Group>
                ))}

                <Button
                  variant="outline"
                  onClick={addEditStep}
                  leftSection={<Plus size={16} />}
                >
                  Add Step
                </Button>
              </Stack>
            )}
          </div>

          {!isEditMode && (
            <>
              <Divider />

              {/* Audit Trail Section */}
              <div>
                <Text fw={500} mb="sm">
                  Audit Trail
                </Text>
                <Paper p="md" withBorder>
                  <Stack gap="sm">
                    {/* Created */}
                    <Group justify="space-between">
                      <Group gap="xs">
                        <Badge color="blue" variant="light" size="sm">
                          Created
                        </Badge>
                        <Text size="sm">
                          by{" "}
                          {template.createdBy
                            ? `${template.createdBy.firstName || ""} ${template.createdBy.lastName || ""}`.trim() ||
                              template.createdBy.email
                            : "Unknown"}
                        </Text>
                      </Group>
                      <Text size="sm" c="dimmed">
                        {new Date(template.createdAt).toLocaleString()}
                      </Text>
                    </Group>

                    {/* Last Updated */}
                    {template.updatedAt &&
                      template.updatedAt !== template.createdAt && (
                        <Group justify="space-between">
                          <Group gap="xs">
                            <Badge color="yellow" variant="light" size="sm">
                              Updated
                            </Badge>
                            <Text size="sm">
                              by{" "}
                              {template.updatedBy
                                ? `${template.updatedBy.firstName || ""} ${template.updatedBy.lastName || ""}`.trim() ||
                                  template.updatedBy.email
                                : "Unknown"}
                            </Text>
                          </Group>
                          <Text size="sm" c="dimmed">
                            {new Date(template.updatedAt).toLocaleString()}
                          </Text>
                        </Group>
                      )}

                    {/* Archived */}
                    {!template.isActive && template.archivedAt && (
                      <Group justify="space-between">
                        <Group gap="xs">
                          <Badge color="red" variant="light" size="sm">
                            Archived
                          </Badge>
                          <Text size="sm">
                            by{" "}
                            {template.archivedBy
                              ? `${template.archivedBy.firstName || ""} ${template.archivedBy.lastName || ""}`.trim() ||
                                template.archivedBy.email
                              : "Unknown"}
                          </Text>
                        </Group>
                        <Text size="sm" c="dimmed">
                          {new Date(template.archivedAt).toLocaleString()}
                        </Text>
                      </Group>
                    )}
                  </Stack>
                </Paper>
              </div>
            </>
          )}
        </Stack>
      </Paper>

      {/* Archive Template Modal */}
      <Modal
        opened={archiveOpened}
        onClose={() => setArchiveOpened(false)}
        title="Archive Template"
        size="md"
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to archive the template{" "}
            <Text component="span" fw={700} c="red">
              "{template.name}"
            </Text>
            ?
          </Text>

          <Text size="sm" c="dimmed">
            Archived templates will no longer be available for creating new
            requests, but existing requests using this template will continue to
            work.
          </Text>

          <Textarea
            label="Reason for archiving (optional)"
            placeholder="Enter a reason for archiving this template..."
            value={archiveReason}
            onChange={(e) => setArchiveReason(e.target.value)}
          />

          <Group justify="flex-end" gap="sm">
            <Button
              variant="outline"
              onClick={() => setArchiveOpened(false)}
              disabled={archiveTemplateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={confirmArchive}
              loading={archiveTemplateMutation.isPending}
            >
              Archive Template
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Restore Template Modal */}
      <Modal
        opened={restoreOpened}
        onClose={() => setRestoreOpened(false)}
        title="Restore Template"
        size="md"
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to restore the template{" "}
            <Text component="span" fw={700} c="green">
              "{template.name}"
            </Text>
            ?
          </Text>

          <Text size="sm" c="dimmed">
            This will make the template available for creating new workflow
            requests again.
          </Text>

          <Group justify="flex-end" gap="sm">
            <Button
              variant="outline"
              onClick={() => setRestoreOpened(false)}
              disabled={restoreTemplateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              color="green"
              onClick={confirmRestore}
              loading={restoreTemplateMutation.isPending}
            >
              Restore Template
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
