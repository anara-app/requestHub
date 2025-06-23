import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Box,
  Loader,
  Center,
  Text,
  ScrollArea,
  Badge,
  Modal,
  TextInput,
  Textarea,
  Group,
  ActionIcon,
  Stack,
  Timeline,
  Paper,
  Divider,
  Select,
  Switch,
} from "@mantine/core";
import { Eye, Plus, Edit, Archive, RotateCcw, X, User, ArrowRight, CheckCircle } from "lucide-react";
import { notifications } from "@mantine/notifications";
import Container from "../../../components/Container";
import PageTitle from "../../../components/PageTitle";
import { trpc } from "../../../common/trpc";
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
  const [opened, setOpened] = useState(false);
  const [viewOpened, setViewOpened] = useState(false);
  const [editOpened, setEditOpened] = useState(false);
  const [archiveOpened, setArchiveOpened] = useState(false);
  const [restoreOpened, setRestoreOpened] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<WorkflowStep[]>([{ 
    assigneeType: "DYNAMIC", 
    dynamicAssignee: "INITIATOR_SUPERVISOR", 
    type: "approval", 
    actionLabel: "" 
  }]);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSteps, setEditSteps] = useState<WorkflowStep[]>([{ 
    assigneeType: "DYNAMIC", 
    dynamicAssignee: "INITIATOR_SUPERVISOR", 
    type: "approval", 
    actionLabel: "" 
  }]);
  const [archiveReason, setArchiveReason] = useState("");

  const { data: templates, isLoading, refetch } = trpc.admin.workflows.getTemplates.useQuery();
  const { data: archivedTemplates, refetch: refetchArchived } = trpc.admin.workflows.getArchivedTemplates.useQuery();
  const { data: roles } = trpc.admin.roles.getRoles.useQuery();

  // Create options for role selection
  const roleOptions = roles?.map(role => ({
    value: role.name,
    label: role.name,
  })) || [];

  // Dynamic assignment options
  const dynamicOptions = [
    { value: "INITIATOR_SUPERVISOR", label: "Initiator's Supervisor" },
  ];

  // Filter templates based on showArchived toggle
  const displayTemplates = showArchived ? archivedTemplates || [] : templates || [];

  const createTemplateMutation = trpc.admin.workflows.createTemplate.useMutation({
    onSuccess: () => {
      setOpened(false);
      setName("");
      setDescription("");
      setSteps([{ 
        assigneeType: "DYNAMIC", 
        dynamicAssignee: "INITIATOR_SUPERVISOR", 
        type: "approval", 
        actionLabel: "" 
      }]);
      refetch();
    },
  });

  const updateTemplateMutation = trpc.admin.workflows.updateTemplate.useMutation({
    onSuccess: () => {
      setEditOpened(false);
      setSelectedTemplate(null);
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

  const archiveTemplateMutation = trpc.admin.workflows.archiveTemplate.useMutation({
    onSuccess: () => {
      setArchiveOpened(false);
      setSelectedTemplate(null);
      setArchiveReason("");
      refetch();
      refetchArchived();
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

  const restoreTemplateMutation = trpc.admin.workflows.restoreTemplate.useMutation({
    onSuccess: () => {
      setRestoreOpened(false);
      setSelectedTemplate(null);
      refetch();
      refetchArchived();
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

  const addStep = () => {
    setSteps([...steps, { 
      assigneeType: "DYNAMIC", 
      dynamicAssignee: "INITIATOR_SUPERVISOR", 
      type: "approval", 
      actionLabel: "" 
    }]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const updateStep = (index: number, field: keyof WorkflowStep, value: string) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    setSteps(updatedSteps);
  };

  const addEditStep = () => {
    setEditSteps([...editSteps, { 
      assigneeType: "DYNAMIC", 
      dynamicAssignee: "INITIATOR_SUPERVISOR", 
      type: "approval", 
      actionLabel: "" 
    }]);
  };

  const removeEditStep = (index: number) => {
    if (editSteps.length > 1) {
      setEditSteps(editSteps.filter((_, i) => i !== index));
    }
  };

  const updateEditStep = (index: number, field: keyof WorkflowStep, value: string) => {
    const updatedSteps = [...editSteps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    setEditSteps(updatedSteps);
  };

  const handleCreate = () => {
    if (!name.trim()) return;

    createTemplateMutation.mutate({
      name,
      description,
      steps,
    });
  };

  const handleEdit = (template: any) => {
    setSelectedTemplate(template);
    setEditName(template.name);
    setEditDescription(template.description || "");

    try {
      const parsedSteps = JSON.parse(template.steps);
      setEditSteps(parsedSteps);
    } catch (error) {
      setEditSteps([{ 
        assigneeType: "DYNAMIC", 
        dynamicAssignee: "INITIATOR_SUPERVISOR", 
        type: "approval", 
        actionLabel: "" 
      }]);
    }

    setEditOpened(true);
  };

  const handleUpdate = () => {
    if (!selectedTemplate || !editName.trim()) return;

    updateTemplateMutation.mutate({
      id: selectedTemplate.id,
      data: {
        name: editName,
        description: editDescription,
        steps: editSteps,
      },
    });
  };

  const handleArchive = (template: any) => {
    setSelectedTemplate(template);
    setArchiveOpened(true);
  };

  const confirmArchive = () => {
    if (!selectedTemplate) return;

    archiveTemplateMutation.mutate({
      id: selectedTemplate.id,
      reason: archiveReason,
    });
  };

  const handleRestore = (template: any) => {
    setSelectedTemplate(template);
    setRestoreOpened(true);
  };

  const confirmRestore = () => {
    if (!selectedTemplate) return;

    restoreTemplateMutation.mutate({
      id: selectedTemplate.id,
    });
  };

  const handleView = (template: any) => {
    setSelectedTemplate(template);
    setViewOpened(true);
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
          <Button leftSection={<Plus size={16} />} onClick={() => setOpened(true)}>
            {t`Create Template`}
          </Button>
        </Group>
      </Group>

      {displayTemplates.length === 0 ? (
        <Center style={{ height: 200 }}>
          <Text c="dimmed">
            {showArchived ? t`No archived templates found` : t`No workflow templates found. Create one to get started.`}
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
                <Table.Th>{t`Actions`}</Table.Th>
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
                  <Table.Tr key={template.id}>
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
                      <Badge color={template.isActive ? "green" : "gray"} variant="light">
                        {template.isActive ? t`Active` : t`Archived`}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {template.createdBy
                          ? `${template.createdBy.firstName || ''} ${template.createdBy.lastName || ''}`.trim() || template.createdBy.email
                          : t`Unknown`
                        }
                      </Text>
                    </Table.Td>
                    {showArchived && (
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {template.archivedAt
                            ? new Date(template.archivedAt).toLocaleDateString()
                            : t`N/A`
                          }
                        </Text>
                      </Table.Td>
                    )}
                    {showArchived && (
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {template.archivedBy
                            ? `${template.archivedBy.firstName || ''} ${template.archivedBy.lastName || ''}`.trim() || template.archivedBy.email
                            : t`N/A`
                          }
                        </Text>
                      </Table.Td>
                    )}
                    <Table.Td>
                      <Group gap={4}>
                        <ActionIcon
                          variant="subtle"
                          onClick={() => handleView(template)}
                          title={t`View Template`}
                        >
                          <Eye size={16} />
                        </ActionIcon>
                        {template.isActive && (
                          <>
                            <ActionIcon
                              variant="subtle"
                              onClick={() => handleEdit(template)}
                              title={t`Edit Template`}
                            >
                              <Edit size={16} />
                            </ActionIcon>
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() => handleArchive(template)}
                              title={t`Archive Template`}
                            >
                              <Archive size={16} />
                            </ActionIcon>
                          </>
                        )}
                        {!template.isActive && (
                          <ActionIcon
                            variant="subtle"
                            color="green"
                            onClick={() => handleRestore(template)}
                            title={t`Restore Template`}
                          >
                            <RotateCcw size={16} />
                          </ActionIcon>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}

      {/* Create Template Modal */}
      <Modal opened={opened} onClose={() => setOpened(false)} title={t`Create Workflow Template`} size="lg">
        <Stack gap="md">
          <TextInput
            label={t`Template Name`}
            placeholder={t`Enter template name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Textarea
            label={t`Description`}
            placeholder={t`Enter template description`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Text fw={500}>{t`Workflow Steps`}</Text>
          {steps.map((step, index) => (
            <Paper key={index} p="md" withBorder>
              <Stack gap="sm">
                <Text fw={500} size="sm">{t`Step`} {index + 1}</Text>
                
                <Select
                  label={t`Assignment Type`}
                  data={[
                    { value: "ROLE_BASED", label: t`Role-based (assign to users with specific role)` },
                    { value: "DYNAMIC", label: t`Dynamic (assign based on relationships)` },
                  ]}
                  value={step.assigneeType}
                  onChange={(value) => updateStep(index, "assigneeType", value || "DYNAMIC")}
                />

                {step.assigneeType === "ROLE_BASED" && (
                  <Select
                    label={t`Role`}
                    placeholder={t`Select a role`}
                    data={roleOptions}
                    value={step.roleBasedAssignee || ""}
                    onChange={(value) => updateStep(index, "roleBasedAssignee", value || "")}
                    searchable
                  />
                )}

                {step.assigneeType === "DYNAMIC" && (
                  <Select
                    label={t`Dynamic Assignment`}
                    data={dynamicOptions}
                    value={step.dynamicAssignee || ""}
                    onChange={(value) => updateStep(index, "dynamicAssignee", value || "")}
                  />
                )}

                <TextInput
                  label={t`Action Label`}
                  placeholder={t`Enter action label (e.g., 'Review and Approve')`}
                  value={step.actionLabel}
                  onChange={(e) => updateStep(index, "actionLabel", e.target.value)}
                />

                {steps.length > 1 && (
                  <Group justify="flex-end">
                    <ActionIcon color="red" onClick={() => removeStep(index)}>
                      <X size={16} />
                    </ActionIcon>
                  </Group>
                )}
              </Stack>
            </Paper>
          ))}

          <Button variant="outline" onClick={addStep}>
            {t`Add Step`}
          </Button>

          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setOpened(false)}>
              {t`Cancel`}
            </Button>
            <Button onClick={handleCreate} loading={createTemplateMutation.isPending}>
              {t`Create Template`}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Archive Template Modal */}
      <Modal
        opened={archiveOpened}
        onClose={() => setArchiveOpened(false)}
        title="Archive Template"
        size="md"
      >
        {selectedTemplate && (
          <Stack gap="md">
            <Text>
              Are you sure you want to archive the template{" "}
              <Text component="span" fw={700} c="red">
                "{selectedTemplate.name}"
              </Text>
              ?
            </Text>

            <Text size="sm" c="dimmed">
              Archived templates will no longer be available for creating new requests, but existing requests using this template will continue to work.
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
        )}
      </Modal>

      {/* Restore Template Modal */}
      <Modal
        opened={restoreOpened}
        onClose={() => setRestoreOpened(false)}
        title="Restore Template"
        size="md"
      >
        {selectedTemplate && (
          <Stack gap="md">
            <Text>
              Are you sure you want to restore the template{" "}
              <Text component="span" fw={700} c="green">
                "{selectedTemplate.name}"
              </Text>
              ?
            </Text>

            <Text size="sm" c="dimmed">
              This will make the template available for creating new workflow requests again.
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
        )}
      </Modal>

      {/* View Template Modal */}
      <Modal opened={viewOpened} onClose={() => setViewOpened(false)} title="Template Details" size="lg">
        {selectedTemplate && (
          <Stack gap="md">
            <div>
              <Text fw={500}>Template Name</Text>
              <Text>{selectedTemplate.name}</Text>
            </div>

            <div>
              <Text fw={500}>Description</Text>
              <Text>{selectedTemplate.description || "No description"}</Text>
            </div>

            <div>
              <Text fw={500}>Status</Text>
              <Badge color={selectedTemplate.isActive ? "green" : "gray"} variant="light">
                {selectedTemplate.isActive ? "Active" : "Archived"}
              </Badge>
            </div>

            {!selectedTemplate.isActive && selectedTemplate.archiveReason && (
              <div>
                <Text fw={500}>Archive Reason</Text>
                <Text size="sm" c="dimmed">{selectedTemplate.archiveReason}</Text>
              </div>
            )}

            <Divider />

            <div>
              <Text fw={500} mb="sm">Workflow Steps</Text>
              <Timeline>
                {(() => {
                  try {
                    const steps = JSON.parse(selectedTemplate.steps);
                    return steps.map((step: any, index: number) => (
                      <Timeline.Item
                        key={index}
                        bullet={<User size={14} />}
                        title={`Step ${index + 1}: ${step.actionLabel || step.label || 'Approval'}`}
                      >
                        <Text size="sm" c="dimmed">
                          Assignment: {step.assigneeType === 'ROLE_BASED' 
                            ? `Role-based (${step.roleBasedAssignee || 'Unknown role'})` 
                            : `Dynamic (${step.dynamicAssignee || 'Unknown dynamic assignment'})`
                          }
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
            </div>

            <Divider />

            {/* Audit Trail Section */}
            <div>
              <Text fw={500} mb="sm">Audit Trail</Text>
              <Paper p="md" withBorder>
                <Stack gap="sm">
                  {/* Created */}
                  <Group justify="space-between">
                    <Group gap="xs">
                      <Badge color="blue" variant="light" size="sm">Created</Badge>
                      <Text size="sm">
                        by {selectedTemplate.createdBy
                          ? `${selectedTemplate.createdBy.firstName || ''} ${selectedTemplate.createdBy.lastName || ''}`.trim() || selectedTemplate.createdBy.email
                          : "Unknown"
                        }
                      </Text>
                    </Group>
                    <Text size="sm" c="dimmed">
                      {new Date(selectedTemplate.createdAt).toLocaleString()}
                    </Text>
                  </Group>

                  {/* Last Updated */}
                  {selectedTemplate.updatedAt && selectedTemplate.updatedAt !== selectedTemplate.createdAt && (
                    <Group justify="space-between">
                      <Group gap="xs">
                        <Badge color="yellow" variant="light" size="sm">Updated</Badge>
                        <Text size="sm">
                          by {selectedTemplate.updatedBy
                            ? `${selectedTemplate.updatedBy.firstName || ''} ${selectedTemplate.updatedBy.lastName || ''}`.trim() || selectedTemplate.updatedBy.email
                            : "Unknown"
                          }
                        </Text>
                      </Group>
                      <Text size="sm" c="dimmed">
                        {new Date(selectedTemplate.updatedAt).toLocaleString()}
                      </Text>
                    </Group>
                  )}

                  {/* Archived */}
                  {!selectedTemplate.isActive && selectedTemplate.archivedAt && (
                    <Group justify="space-between">
                      <Group gap="xs">
                        <Badge color="red" variant="light" size="sm">Archived</Badge>
                        <Text size="sm">
                          by {selectedTemplate.archivedBy
                            ? `${selectedTemplate.archivedBy.firstName || ''} ${selectedTemplate.archivedBy.lastName || ''}`.trim() || selectedTemplate.archivedBy.email
                            : "Unknown"
                          }
                        </Text>
                      </Group>
                      <Text size="sm" c="dimmed">
                        {new Date(selectedTemplate.archivedAt).toLocaleString()}
                      </Text>
                    </Group>
                  )}
                </Stack>
              </Paper>
            </div>

          </Stack>
        )}
      </Modal>

      {/* Edit Template Modal */}
      <Modal opened={editOpened} onClose={() => setEditOpened(false)} title="Edit Workflow Template" size="lg">
        <Stack gap="md">
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

          <Text fw={500}>Workflow Steps</Text>
          {editSteps.map((step, index) => (
            <Paper key={index} p="md" withBorder>
              <Stack gap="sm">
                <Text fw={500} size="sm">Step {index + 1}</Text>
                
                <Select
                  label="Assignment Type"
                  data={[
                    { value: "ROLE_BASED", label: "Role-based (assign to users with specific role)" },
                    { value: "DYNAMIC", label: "Dynamic (assign based on relationships)" },
                  ]}
                  value={step.assigneeType}
                  onChange={(value) => updateEditStep(index, "assigneeType", value || "DYNAMIC")}
                />

                {step.assigneeType === "ROLE_BASED" && (
                  <Select
                    label="Role"
                    placeholder="Select a role"
                    data={roleOptions}
                    value={step.roleBasedAssignee || ""}
                    onChange={(value) => updateEditStep(index, "roleBasedAssignee", value || "")}
                    searchable
                  />
                )}

                {step.assigneeType === "DYNAMIC" && (
                  <Select
                    label="Dynamic Assignment"
                    data={dynamicOptions}
                    value={step.dynamicAssignee || ""}
                    onChange={(value) => updateEditStep(index, "dynamicAssignee", value || "")}
                  />
                )}

                <TextInput
                  label="Action Label"
                  placeholder="Enter action label (e.g., 'Review and Approve')"
                  value={step.actionLabel}
                  onChange={(e) => updateEditStep(index, "actionLabel", e.target.value)}
                />

                {editSteps.length > 1 && (
                  <Group justify="flex-end">
                    <ActionIcon color="red" onClick={() => removeEditStep(index)}>
                      <X size={16} />
                    </ActionIcon>
                  </Group>
                )}
              </Stack>
            </Paper>
          ))}

          <Button variant="outline" onClick={addEditStep}>
            Add Step
          </Button>

          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setEditOpened(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} loading={updateTemplateMutation.isPending}>
              Update Template
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
} 