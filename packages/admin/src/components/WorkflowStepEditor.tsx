import { useLingui } from "@lingui/react/macro";
import {
  Button,
  ActionIcon,
  Stack,
  Select,
  Paper,
  Text,
  TextInput,
  Group,
} from "@mantine/core";
import { X, Plus } from "lucide-react";

export interface WorkflowStep {
  assigneeType: "ROLE_BASED" | "DYNAMIC";
  roleBasedAssignee?: string;
  dynamicAssignee?: string;
  actionLabel: string;
  type: string;
}

const dynamicOptions = [
  { value: "INITIATOR_SUPERVISOR", label: "Initiator's Supervisor" },
];

interface WorkflowStepEditorProps {
  steps: WorkflowStep[];
  onStepsChange: (steps: WorkflowStep[]) => void;
  roles?: Array<{ name: string }>;
}

export const WorkflowStepEditor = ({
  steps,
  onStepsChange,
  roles = [],
}: WorkflowStepEditorProps) => {
  const { t } = useLingui();

  const addStep = () => {
    const newSteps = [
      ...steps,
      {
        assigneeType: "DYNAMIC" as const,
        dynamicAssignee: "INITIATOR_SUPERVISOR",
        type: "approval",
        actionLabel: "",
      },
    ];
    onStepsChange(newSteps);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      const newSteps = steps.filter((_, i) => i !== index);
      onStepsChange(newSteps);
    }
  };

  const updateStep = (
    index: number,
    field: keyof WorkflowStep,
    value: string
  ) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    onStepsChange(updatedSteps);
  };

  const roleOptions = roles.map((role) => ({
    value: role.name,
    label: role.name,
  }));

  return (
    <Stack gap="md">
      <Text fw={500}>{t`Workflow Steps`}</Text>
      {steps.map((step, index) => (
        <Paper key={index} p="md" withBorder>
          <Stack gap="sm">
            <Text fw={500} size="sm">
              {t`Step`} {index + 1}
            </Text>

            <Select
              label={t`Assignment Type`}
              data={[
                {
                  value: "ROLE_BASED",
                  label: t`Role-based (assign to users with specific role)`,
                },
                {
                  value: "DYNAMIC",
                  label: t`Dynamic (assign based on relationships)`,
                },
              ]}
              value={step.assigneeType}
              onChange={(value) =>
                updateStep(index, "assigneeType", value || "DYNAMIC")
              }
            />

            {step.assigneeType === "ROLE_BASED" && (
              <Select
                label={t`Role`}
                placeholder={t`Select a role`}
                data={roleOptions}
                value={step.roleBasedAssignee || ""}
                onChange={(value) =>
                  updateStep(index, "roleBasedAssignee", value || "")
                }
                searchable
              />
            )}

            {step.assigneeType === "DYNAMIC" && (
              <Select
                label={t`Dynamic Assignment`}
                data={dynamicOptions}
                value={step.dynamicAssignee || ""}
                onChange={(value) =>
                  updateStep(index, "dynamicAssignee", value || "")
                }
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

      <Group justify="flex-start">
        <Button
          variant="outline"
          onClick={addStep}
          leftSection={<Plus size={16} />}
        >
          {t`Add Step`}
        </Button>
      </Group>
    </Stack>
  );
};
