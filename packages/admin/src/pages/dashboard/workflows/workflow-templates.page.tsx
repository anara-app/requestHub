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
} from "@mantine/core";
import { Eye, Plus, Edit, Trash2, X } from "lucide-react";
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
          <ActionIcon variant="light" size="sm">
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
    </Container>
  );
} 