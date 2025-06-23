import { useState } from "react";
import { useLingui } from "@lingui/react/macro";
import {
  Button,
  TextInput,
  Textarea,
  Group,
  Stack,
  Paper,
  Text,
  Divider,
  Container,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router-dom";
import { trpc } from "../../../common/trpc";
import { FormBuilder, FormField } from "../../../components/Forms";
import PageTitle from "../../../components/PageTitle";
import {
  WorkflowStepEditor,
  WorkflowStep,
} from "../../../components/WorkflowStepEditor";
import { ROUTES } from "../../../router/routes";

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

  const handleCancel = () => {
    navigate(ROUTES.DASHBOARD_WORKFLOW_TEMPLATES);
  };

  const handleFormFieldsChange = (fields: FormField[]) => {
    setFormFields(fields);
  };

  return (
    <Container size="xl" my="lg">
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

          <WorkflowStepEditor
            steps={steps}
            onStepsChange={setSteps}
            roles={roles}
          />

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
