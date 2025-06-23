import { useState } from "react";
import { useLingui } from "@lingui/react/macro";
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

interface WorkflowStep {
  assigneeType: "ROLE_BASED" | "DYNAMIC";
  roleBasedAssignee?: string;
  dynamicAssignee?: string;
  actionLabel: string;
  type: string;
}

export const NewWorkflowTemplatePage = () => {
  const { t } = useLingui();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<WorkflowStep[]>([
    {
      assigneeType: "DYNAMIC",
      dynamicAssignee: "INITIATOR_SUPERVISOR",
      type: "approval",
      actionLabel: "",
    },
  ]);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const { data: roles } = trpc.admin.roles.getRoles.useQuery();

  const createTemplateMutation =
    trpc.admin.workflows.createTemplate.useMutation({
      onSuccess: () => {
        notifications.show({
          title: t`Success`,
          message: t`Workflow template created successfully`,
          color: "green",
        });
        navigate(ROUTES.DASHBOARD_WORKFLOW_TEMPLATES);
      },
      onError: (error: any) => {
        notifications.show({
          title: t`Error`,
          message: error.message || t`Failed to create workflow template`,
          color: "red",
        });
      },
    });

  const addStep = () => {
    setSteps([
      ...steps,
      {
        assigneeType: "DYNAMIC",
        dynamicAssignee: "INITIATOR_SUPERVISOR",
        type: "approval",
        actionLabel: "",
      },
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
        title: t`Error`,
        message: t`Template name is required`,
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

  const dynamicOptions = [
    { value: "INITIATOR_SUPERVISOR", label: "Initiator's Supervisor" },
  ];

  const roleOptions =
    roles?.map((role) => ({
      value: role.name,
      label: role.name,
    })) || [];

  const handleCancel = () => {
    navigate(ROUTES.DASHBOARD_WORKFLOW_TEMPLATES);
  };

  const handleFormFieldsChange = (fields: FormField[]) => {
    setFormFields(fields);
  };

  return (
    <Container>
      <PageTitle>{t`Create New Workflow Template`}</PageTitle>

      <Paper p="xl" withBorder>
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
                  onChange={(e) =>
                    updateStep(index, "actionLabel", e.target.value)
                  }
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

          <Button
            variant="outline"
            onClick={addStep}
            leftSection={<Plus size={16} />}
          >
            {t`Add Step`}
          </Button>

          <Divider my="xl" />

          {/* Form Builder Component */}
          <FormBuilder
            formFields={formFields}
            onFormFieldsChange={handleFormFieldsChange}
          />

          <Group justify="flex-end" mt="xl">
            <Button variant="outline" onClick={handleCancel}>
              {t`Cancel`}
            </Button>
            <Button
              onClick={handleCreate}
              loading={createTemplateMutation.isPending}
            >
              {t`Create Template`}
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
};
