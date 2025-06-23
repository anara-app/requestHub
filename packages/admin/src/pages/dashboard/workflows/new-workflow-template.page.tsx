import { useState } from "react";
import {
  Button,
  TextInput,
  Textarea,
  Group,
  ActionIcon,
  Stack,
  Select,
  Paper,
  Text,
  Divider,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { X, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../../../common/trpc";
import Container from "../../../components/Container";
import { FormBuilder, FormField } from "../../../components/Forms";
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

export const NewWorkflowTemplatePage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<WorkflowStep[]>([
    { role: "INITIATOR_SUPERVISOR", type: "approval", label: "" },
  ]);
  const [formFields, setFormFields] = useState<FormField[]>([]);

  const createTemplateMutation =
    trpc.admin.workflows.createTemplate.useMutation({
      onSuccess: () => {
        notifications.show({
          title: "Success",
          message: "Workflow template created successfully",
          color: "green",
        });
        navigate(ROUTES.DASHBOARD_WORKFLOW_TEMPLATES);
      },
      onError: (error: any) => {
        notifications.show({
          title: "Error",
          message: error.message || "Failed to create workflow template",
          color: "red",
        });
      },
    });

  const addStep = () => {
    setSteps([
      ...steps,
      { role: "INITIATOR_SUPERVISOR", type: "approval", label: "" },
    ]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const updateStep = (
    index: number,
    field: keyof WorkflowStep,
    value: string
  ) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    setSteps(updatedSteps);
  };

  const handleCreate = () => {
    if (!name.trim()) {
      notifications.show({
        title: "Error",
        message: "Template name is required",
        color: "red",
      });
      return;
    }

    createTemplateMutation.mutate({
      name,
      description,
      steps,
      formFields,
    });
  };

  const handleCancel = () => {
    navigate(ROUTES.DASHBOARD_WORKFLOW_TEMPLATES);
  };

  const handleFormFieldsChange = (fields: FormField[]) => {
    setFormFields(fields);
  };

  return (
    <Container>
      <PageTitle>Create New Workflow Template</PageTitle>

      <Paper p="xl" withBorder>
        <Stack gap="md">
          <TextInput
            label="Template Name"
            placeholder="Enter template name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Textarea
            label="Description"
            placeholder="Enter template description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Text fw={500}>Workflow Steps</Text>
          {steps.map((step, index) => (
            <Group key={index} align="end">
              <Select
                label={`Step ${index + 1} Role`}
                data={WORKFLOW_ROLES}
                value={step.role}
                onChange={(value) =>
                  updateStep(index, "role", value || "INITIATOR_SUPERVISOR")
                }
                style={{ flex: 1 }}
              />
              <TextInput
                label="Step Label"
                placeholder="Enter step label"
                value={step.label}
                onChange={(e) => updateStep(index, "label", e.target.value)}
                style={{ flex: 1 }}
              />
              {steps.length > 1 && (
                <ActionIcon color="red" onClick={() => removeStep(index)}>
                  <X size={16} />
                </ActionIcon>
              )}
            </Group>
          ))}

          <Button
            variant="outline"
            onClick={addStep}
            leftSection={<Plus size={16} />}
          >
            Add Step
          </Button>

          <Divider my="xl" />

          {/* Form Builder Component */}
          <FormBuilder
            formFields={formFields}
            onFormFieldsChange={handleFormFieldsChange}
          />

          <Group justify="flex-end" mt="xl">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              loading={createTemplateMutation.isPending}
            >
              Create Template
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
};
