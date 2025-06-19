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
} from "@mantine/core";
import { Eye, Plus, Edit, Trash2, X, User, ArrowRight, CheckCircle } from "lucide-react";
import Container from "../../../components/Container";
import PageTitle from "../../../components/PageTitle";
import { trpc } from "../../../common/trpc";

interface WorkflowStep {
  role: string;
  type: string;
  label: string;
}

export default function WorkflowTemplatesPage() {
  const [opened, setOpened] = useState(false);
  const [viewOpened, setViewOpened] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<WorkflowStep[]>([{ role: "", type: "approval", label: "" }]);

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
          <ActionIcon variant="light" size="sm" color="yellow">
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
                  <TextInput
                    label="Role"
                    placeholder="e.g., manager, finance"
                    required
                    value={step.role}
                    onChange={(e) => updateStep(index, "role", e.target.value)}
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
    </Container>
  );
} 