import { useState } from "react";
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
} from "@mantine/core";
import { Eye, Plus, Edit, Trash2, X, User, ArrowRight, CheckCircle } from "lucide-react";
import { notifications } from "@mantine/notifications";
import Container from "../../../components/Container";
import PageTitle from "../../../components/PageTitle";
import { trpc } from "../../../common/trpc";

interface WorkflowStep {
  role: string;
  type: string;
  label: string;
}

// Workflow roles based on the department mapping
const WORKFLOW_ROLES = [
  { value: "INITIATOR", label: "Инициатор (Initiator)" },
  { value: "INITIATOR_SUPERVISOR", label: "Руководитель инициатора (Initiator's Supervisor)" },
  { value: "CEO", label: "Генеральный директор (CEO)" },
  { value: "LEGAL", label: "Юрист (Legal)" },
  { value: "PROCUREMENT", label: "Сотрудник отдела закупок (Procurement)" },
  { value: "FINANCE_MANAGER", label: "Финансовый менеджер (Finance Manager)" },
  { value: "ACCOUNTING", label: "Бухгалтерия (Accounting)" },
  { value: "HR_SPECIALIST", label: "HR Specialist" },
  { value: "SYSTEM_AUTOMATION", label: "Система (System/Automation)" },
  { value: "SECURITY_REVIEW", label: "Служба безопасности (Security Review)" },
  { value: "SECURITY_GUARD", label: "Охрана / Пост охраны" },
  { value: "INDUSTRIAL_SAFETY", label: "Служба промышленной безопасности" },
  // Legacy roles for backward compatibility
  { value: "MANAGER", label: "Manager (Legacy)" },
  { value: "FINANCE", label: "Finance (Legacy)" },
];

export default function WorkflowTemplatesPage() {
  const [opened, setOpened] = useState(false);
  const [viewOpened, setViewOpened] = useState(false);
  const [editOpened, setEditOpened] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<WorkflowStep[]>([{ role: "", type: "approval", label: "" }]);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSteps, setEditSteps] = useState<WorkflowStep[]>([{ role: "", type: "approval", label: "" }]);

  const { data: templates, isLoading, refetch } = trpc.admin.workflows.getTemplates.useQuery();

  const createTemplateMutation = trpc.admin.workflows.createTemplate.useMutation({
    onSuccess: () => {
      setOpened(false);
      setName("");
      setDescription("");
      setSteps([{ role: "", type: "approval", label: "" }]);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTemplateMutation.mutate({
      name,
      description,
      steps,
    });
  };

  const addStep = () => {
    setSteps([...steps, { role: "", type: "approval", label: "" }]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const updateStep = (index: number, field: keyof WorkflowStep, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleViewTemplate = (template: any) => {
    setSelectedTemplate(template);
    setViewOpened(true);
  };

  const handleEditTemplate = (template: any) => {
    setSelectedTemplate(template);
    setEditName(template.name);
    setEditDescription(template.description || "");
    setEditSteps(JSON.parse(template.steps || "[]"));
    setEditOpened(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!editName.trim()) {
      notifications.show({
        title: "Validation Error",
        message: "Template name is required",
        color: "red",
      });
      return;
    }

    // Validate steps
    const hasEmptySteps = editSteps.some(step => !step.role.trim() || !step.label.trim());
    if (hasEmptySteps) {
      notifications.show({
        title: "Validation Error",
        message: "All steps must have a role and label",
        color: "red",
      });
      return;
    }

    if (selectedTemplate) {
      updateTemplateMutation.mutate({
        id: selectedTemplate.id,
        data: {
          name: editName,
          description: editDescription,
          steps: editSteps,
        },
      });
    }
  };

  const addEditStep = () => {
    setEditSteps([...editSteps, { role: "", type: "approval", label: "" }]);
  };

  const removeEditStep = (index: number) => {
    if (editSteps.length > 1) {
      setEditSteps(editSteps.filter((_, i) => i !== index));
    }
  };

  const updateEditStep = (index: number, field: keyof WorkflowStep, value: string) => {
    const newSteps = [...editSteps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setEditSteps(newSteps);
  };

  const hasUnsavedChanges = () => {
    if (!selectedTemplate) return false;
    
    const originalSteps = JSON.parse(selectedTemplate.steps || "[]");
    return (
      editName !== selectedTemplate.name ||
      editDescription !== (selectedTemplate.description || "") ||
      JSON.stringify(editSteps) !== JSON.stringify(originalSteps)
    );
  };

  const handleEditClose = () => {
    if (hasUnsavedChanges()) {
      const confirmed = window.confirm("You have unsaved changes. Are you sure you want to close?");
      if (!confirmed) return;
    }
    setEditOpened(false);
    setSelectedTemplate(null);
  };

  const rows = templates?.map((template: any) => (
    <Table.Tr key={template.id}>
      <Table.Td>{template.name}</Table.Td>
      <Table.Td>{template.description || "-"}</Table.Td>
      <Table.Td>
        <Badge color={template.isActive ? "green" : "red"}>
          {template.isActive ? "Active" : "Inactive"}
        </Badge>
      </Table.Td>
      <Table.Td>{JSON.parse(template.steps || "[]").length} steps</Table.Td>
      <Table.Td>
        <Group gap="xs">
          <ActionIcon 
            variant="light" 
            size="sm"
            onClick={() => handleViewTemplate(template)}
          >
            <Eye size={14} />
          </ActionIcon>
          <ActionIcon 
            variant="light" 
            size="sm" 
            color="yellow"
            onClick={() => handleEditTemplate(template)}
          >
            <Edit size={14} />
          </ActionIcon>
          <ActionIcon variant="light" size="sm" color="red">
            <Trash2 size={14} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container>
      <PageTitle
        title="Workflow Templates"
        right={
          <Button leftSection={<Plus size={14} />} onClick={() => setOpened(true)}>
            Create Template
          </Button>
        }
      />

      <Box>
        {isLoading && (
          <Center>
            <Loader />
          </Center>
        )}

        {templates && (
          <ScrollArea>
            <Table mb="md" withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Steps</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          </ScrollArea>
        )}
      </Box>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Create Workflow Template"
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="Template Name"
              placeholder="Enter template name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Textarea
              label="Description"
              placeholder="Enter template description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Box>
              <Text fw={500} mb="sm">
                Workflow Steps
              </Text>
              {steps.map((step, index) => (
                                  <Group key={index} mb="sm" align="end">
                    <Select
                      label="Role"
                      placeholder="Select a role"
                      required
                      data={WORKFLOW_ROLES}
                      value={step.role}
                      onChange={(value) => updateStep(index, "role", value || "")}
                      searchable
                      style={{ minWidth: 250 }}
                    />
                  <TextInput
                    label="Label"
                    placeholder="e.g., Manager Approval"
                    required
                    value={step.label}
                    onChange={(e) => updateStep(index, "label", e.target.value)}
                  />
                  <ActionIcon
                    color="red"
                    variant="light"
                    onClick={() => removeStep(index)}
                    disabled={steps.length === 1}
                  >
                    <X size={14} />
                  </ActionIcon>
                </Group>
              ))}
              <Button variant="light" onClick={addStep}>
                Add Step
              </Button>
            </Box>

            <Group justify="flex-end">
              <Button variant="outline" onClick={() => setOpened(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={createTemplateMutation.isPending}>
                Create Template
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* View Template Modal */}
      <Modal
        opened={viewOpened}
        onClose={() => setViewOpened(false)}
        title={selectedTemplate ? `Template: ${selectedTemplate.name}` : "Template Details"}
        size="md"
      >
        {selectedTemplate && (
          <Stack gap="lg">
            {/* Template Info */}
            <Paper p="md" withBorder>
              <Stack gap="sm">
                <Group justify="space-between" align="flex-start">
                  <Box>
                    <Text fw={600} size="lg">{selectedTemplate.name}</Text>
                    {selectedTemplate.description && (
                      <Text size="sm" c="dimmed" mt={4}>
                        {selectedTemplate.description}
                      </Text>
                    )}
                  </Box>
                  <Badge color={selectedTemplate.isActive ? "green" : "red"} variant="light">
                    {selectedTemplate.isActive ? "Active" : "Inactive"}
                  </Badge>
                </Group>
              </Stack>
            </Paper>

            {/* Workflow Steps */}
            <Box>
              <Text fw={500} size="md" mb="md">
                Approval Flow
              </Text>
              <Paper p="md" withBorder>
                <Timeline bulletSize={28} lineWidth={2}>
                  {JSON.parse(selectedTemplate.steps || "[]").map((step: WorkflowStep, index: number) => (
                    <Timeline.Item
                      key={index}
                      bullet={<User size={16} />}
                      title={step.label}
                      color="blue"
                    >
                      <Group gap="xs" mt={4}>
                        <Badge variant="outline" size="sm">
                          {step.role}
                        </Badge>
                        <Text size="xs" c="dimmed">
                          Step {index + 1}
                        </Text>
                      </Group>
                      <Text size="sm" c="dimmed" mt={4}>
                        Requires approval from <strong>{step.role}</strong> role
                      </Text>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Paper>
            </Box>

            {/* Summary */}
            <Paper p="md" withBorder bg="gray.0">
              <Group justify="space-between">
                <Box>
                  <Text size="sm" fw={500}>Total Steps</Text>
                  <Text size="lg" fw={600} c="blue">
                    {JSON.parse(selectedTemplate.steps || "[]").length}
                  </Text>
                </Box>
                <Box>
                  <Text size="sm" fw={500}>Roles Involved</Text>
                  <Text size="lg" fw={600} c="green">
                    {new Set(JSON.parse(selectedTemplate.steps || "[]").map((s: WorkflowStep) => s.role)).size}
                  </Text>
                </Box>
                <Box>
                  <Text size="sm" fw={500}>Status</Text>
                  <Text size="lg" fw={600} c={selectedTemplate.isActive ? "green" : "red"}>
                    {selectedTemplate.isActive ? "Active" : "Inactive"}
                  </Text>
                </Box>
              </Group>
            </Paper>

            {/* Roles List */}
            <Box>
              <Text fw={500} size="sm" mb="sm" c="dimmed">
                Involved Roles
              </Text>
              <Group gap="xs">
                {Array.from(new Set(JSON.parse(selectedTemplate.steps || "[]").map((s: WorkflowStep) => s.role))).map((role) => (
                  <Badge key={role as string} variant="filled" size="sm">
                    {role as string}
                  </Badge>
                ))}
              </Group>
                         </Box>
           </Stack>
         )}
       </Modal>

      {/* Edit Template Modal */}
      <Modal
        opened={editOpened}
        onClose={handleEditClose}
        title={selectedTemplate ? `Edit Template: ${selectedTemplate.name}` : "Edit Template"}
        size="lg"
      >
        {selectedTemplate && (
          <form onSubmit={handleEditSubmit}>
            <Stack gap="md">
              <TextInput
                label="Template Name"
                placeholder="Enter template name"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />

              <Textarea
                label="Description"
                placeholder="Enter template description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />

              <Box>
                <Text fw={500} mb="sm">
                  Workflow Steps
                </Text>
                {editSteps.map((step, index) => (
                                     <Group key={index} mb="sm" align="end">
                     <Select
                       label="Role"
                       placeholder="Select a role"
                       required
                       data={WORKFLOW_ROLES}
                       value={step.role}
                       onChange={(value) => updateEditStep(index, "role", value || "")}
                       searchable
                       style={{ minWidth: 250 }}
                     />
                    <TextInput
                      label="Label"
                      placeholder="e.g., Manager Approval"
                      required
                      value={step.label}
                      onChange={(e) => updateEditStep(index, "label", e.target.value)}
                    />
                    <ActionIcon
                      color="red"
                      variant="light"
                      onClick={() => removeEditStep(index)}
                      disabled={editSteps.length === 1}
                    >
                      <X size={14} />
                    </ActionIcon>
                  </Group>
                ))}
                <Button variant="light" onClick={addEditStep}>
                  Add Step
                </Button>
              </Box>

              {/* Preview of changes */}
              <Paper p="md" withBorder bg="blue.0">
                <Text fw={500} size="sm" mb="sm" c="blue">
                  Preview: Updated Approval Flow
                </Text>
                <Timeline bulletSize={20} lineWidth={2}>
                  {editSteps.map((step, index) => (
                    <Timeline.Item
                      key={index}
                      bullet={<User size={12} />}
                      title={step.label || `Step ${index + 1}`}
                      color="blue"
                    >
                      <Group gap="xs">
                        <Badge variant="outline" size="xs">
                          {step.role || "Role not set"}
                        </Badge>
                        <Text size="xs" c="dimmed">
                          Step {index + 1}
                        </Text>
                      </Group>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Paper>

                             <Group justify="flex-end">
                 <Button variant="outline" onClick={handleEditClose}>
                   Cancel
                 </Button>
                <Button type="submit" loading={updateTemplateMutation.isPending}>
                  Update Template
                </Button>
              </Group>
            </Stack>
          </form>
        )}
      </Modal>
    </Container>
  );
} 