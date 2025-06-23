import { useState, useEffect } from "react";
import { useLingui } from "@lingui/react/macro";
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
  Loader,
  Center,
  Modal,
  Box,
  Container,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { User, Edit, Save, Archive, RotateCcw } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { trpc } from "../../../common/trpc";
import { FormBuilder, FormField } from "../../../components/Forms";
import PageTitle from "../../../components/PageTitle";
import {
  WorkflowStepEditor,
  WorkflowStep,
} from "../../../components/WorkflowStepEditor";
import { ROUTES } from "../../../router/routes";

export default function WorkflowTemplatePage() {
  const { t } = useLingui();
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
    {
      assigneeType: "DYNAMIC",
      dynamicAssignee: "INITIATOR_SUPERVISOR",
      type: "approval",
      actionLabel: "",
    },
  ]);
  const [editFormFields, setEditFormFields] = useState<FormField[]>([]);

  const {
    data: template,
    isLoading,
    refetch,
  } = trpc.admin.workflows.getTemplate.useQuery({ id: id! }, { enabled: !!id });

  const { data: roles } = trpc.admin.roles.getRoles.useQuery();

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
        // Convert old format to new format if needed
        const convertedSteps = parsedSteps.map((step: any) => {
          if (step.role && !step.assigneeType) {
            // Legacy format - convert to new format
            return {
              assigneeType: "DYNAMIC" as const,
              dynamicAssignee: step.role,
              type: step.type || "approval",
              actionLabel: step.label || "",
            };
          }
          return step;
        });
        setEditSteps(convertedSteps);
      } catch (error) {
        setEditSteps([
          {
            assigneeType: "DYNAMIC",
            dynamicAssignee: "INITIATOR_SUPERVISOR",
            type: "approval",
            actionLabel: "",
          },
        ]);
      }

      try {
        const parsedFormFields = template.formFields
          ? JSON.parse(template.formFields)
          : [];
        setEditFormFields(parsedFormFields);
      } catch (error) {
        setEditFormFields([]);
      }
    }
  }, [template, isEditMode]);

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
        formFields: editFormFields,
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
      <Container size="xl" my="lg">
        <Center style={{ height: 400 }}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (!template) {
    return (
      <Container size="xl" my="lg">
        <Center style={{ height: 400 }}>
          <Stack align="center">
            <Text>{t`Template not found`}</Text>
            <Button onClick={handleBackToTemplates}>
              {t`Back to Templates`}
            </Button>
          </Stack>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" my="lg">
      <Group justify="space-between" align="center" mb="lg">
        <PageTitle>
          {isEditMode ? t`Edit Template` : t`Template Details`}
        </PageTitle>
        <Group>
          <Button variant="outline" onClick={handleBackToTemplates}>
            {t`Back to Templates`}
          </Button>
          {!isEditMode ? (
            <Group>
              {template.isActive && (
                <>
                  <Button leftSection={<Edit size={16} />} onClick={handleEdit}>
                    {t`Edit Template`}
                  </Button>
                  <Button
                    color="red"
                    variant="outline"
                    leftSection={<Archive size={16} />}
                    onClick={handleArchive}
                  >
                    {t`Archive`}
                  </Button>
                </>
              )}
              {!template.isActive && (
                <Button
                  color="green"
                  leftSection={<RotateCcw size={16} />}
                  onClick={handleRestore}
                >
                  {t`Restore`}
                </Button>
              )}
            </Group>
          ) : (
            <Group>
              <Button variant="outline" onClick={handleCancelEdit}>
                {t`Cancel`}
              </Button>
              <Button
                leftSection={<Save size={16} />}
                onClick={handleSave}
                loading={updateTemplateMutation.isPending}
              >
                {t`Save Changes`}
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
                  {t`Template Name`}
                </Text>
                <Text>{template.name}</Text>
              </div>

              <div>
                <Text fw={500} mb="xs">
                  {t`Description`}
                </Text>
                <Text>{template.description || "No description"}</Text>
              </div>

              <div>
                <Text fw={500} mb="xs">
                  {t`Status`}
                </Text>
                <Badge
                  color={template.isActive ? "green" : "gray"}
                  variant="light"
                >
                  {template.isActive ? t`Active` : t`Archived`}
                </Badge>
              </div>

              {!template.isActive && template.archiveReason && (
                <div>
                  <Text fw={500} mb="xs">
                    {t`Archive Reason`}
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
                label={t`Template Name`}
                placeholder={t`Enter template name`}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
              <Textarea
                label={t`Description`}
                placeholder={t`Enter template description`}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </>
          )}

          <Divider />

          {/* Workflow Steps */}
          <div>
            <Text fw={500} mb="sm">
              {t`Workflow Steps`}
            </Text>
            {!isEditMode ? (
              <Timeline>
                {(() => {
                  try {
                    const steps = JSON.parse(template.steps);
                    return steps.map((step: any, index: number) => {
                      let displayText = "";
                      let roleText = "";

                      if (step.assigneeType === "ROLE_BASED") {
                        displayText = step.actionLabel || `Step ${index + 1}`;
                        if (step.roleBasedAssignee) {
                          roleText = t`Role: ${step.roleBasedAssignee}`;
                        } else {
                          roleText = t`Role-based assignment (no role selected)`;
                        }
                      } else if (step.assigneeType === "DYNAMIC") {
                        displayText = step.actionLabel || `Step ${index + 1}`;
                        if (step.dynamicAssignee) {
                          const dynamicLabel =
                            step.dynamicAssignee === "INITIATOR_SUPERVISOR"
                              ? t`Initiator's Supervisor`
                              : step.dynamicAssignee;
                          roleText = t`Dynamic Assignment: ${dynamicLabel}`;
                        } else {
                          roleText = t`Dynamic assignment (no assignment selected)`;
                        }
                      } else if (step.role) {
                        // Legacy format
                        displayText = step.label || `Step ${index + 1}`;
                        roleText = t`Legacy Role: ${step.role}`;
                      } else {
                        displayText =
                          step.actionLabel || step.label || `Step ${index + 1}`;
                        roleText = t`Unknown assignment`;
                      }

                      return (
                        <Timeline.Item
                          key={index}
                          bullet={<User size={14} />}
                          title={displayText}
                        >
                          <Text size="sm" c="dimmed">
                            {roleText}
                          </Text>
                          <Text size="sm" c="dimmed">
                            {t`Type`}: {step.type}
                          </Text>
                        </Timeline.Item>
                      );
                    });
                  } catch (error) {
                    return (
                      <Text c="red">{t`Error parsing workflow steps`}</Text>
                    );
                  }
                })()}
              </Timeline>
            ) : (
              <WorkflowStepEditor
                steps={editSteps}
                onStepsChange={setEditSteps}
                roles={roles}
              />
            )}
          </div>

          <Divider />

          {/* Form Fields Section */}
          <div>
            <Text fw={500} mb="sm">
              {t`Form Fields`}
            </Text>
            {!isEditMode ? (
              <>
                {(() => {
                  try {
                    const formFields: FormField[] = template.formFields
                      ? JSON.parse(template.formFields)
                      : [];

                    if (formFields.length === 0) {
                      return (
                        <Text size="sm" c="dimmed">
                          {t`No form fields configured for this template.`}
                        </Text>
                      );
                    }

                    return (
                      <Stack gap="md">
                        {formFields.map((field) => (
                          <Paper key={field.id} p="md" withBorder>
                            <Group justify="space-between">
                              <Box>
                                <Group gap="xs">
                                  <Text fw={500}>{field.label}</Text>
                                  <Badge size="sm" variant="outline">
                                    {field.type}
                                  </Badge>
                                  {field.validation?.required && (
                                    <Badge size="sm" color="red">
                                      {t`Required`}
                                    </Badge>
                                  )}
                                </Group>
                                <Text size="sm" c="dimmed">
                                  {t`Field name`}: {field.name}
                                </Text>
                                {field.description && (
                                  <Text size="sm" c="dimmed" mt="xs">
                                    {field.description}
                                  </Text>
                                )}
                                {field.placeholder && (
                                  <Text size="sm" c="dimmed">
                                    {t`Placeholder`}: {field.placeholder}
                                  </Text>
                                )}
                                {field.options && field.options.length > 0 && (
                                  <Box mt="xs">
                                    <Text size="xs" c="dimmed" mb="xs">
                                      {t`Options`}:
                                    </Text>
                                    <Group gap="xs">
                                      {field.options.map((option, idx) => (
                                        <Badge
                                          key={idx}
                                          size="xs"
                                          variant="outline"
                                          color={
                                            option.disabled ? "gray" : "blue"
                                          }
                                        >
                                          {option.label}
                                        </Badge>
                                      ))}
                                    </Group>
                                  </Box>
                                )}
                              </Box>
                            </Group>
                          </Paper>
                        ))}
                      </Stack>
                    );
                  } catch (error) {
                    return <Text c="red">{t`Error parsing form fields`}</Text>;
                  }
                })()}
              </>
            ) : (
              <FormBuilder
                formFields={editFormFields}
                onFormFieldsChange={setEditFormFields}
              />
            )}
          </div>

          {!isEditMode && (
            <>
              <Divider />

              {/* Audit Trail Section */}
              <div>
                <Text fw={500} mb="sm">
                  {t`Audit Trail`}
                </Text>
                <Paper p="md" withBorder>
                  <Stack gap="sm">
                    {/* Created */}
                    <Group justify="space-between">
                      <Group gap="xs">
                        <Badge color="blue" variant="light" size="sm">
                          {t`Created`}
                        </Badge>
                        <Text size="sm">
                          {t`by`}{" "}
                          {template.createdBy
                            ? `${template.createdBy.firstName || ""} ${template.createdBy.lastName || ""}`.trim() ||
                              template.createdBy.email
                            : t`Unknown`}
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
                              {t`Updated`}
                            </Badge>
                            <Text size="sm">
                              {t`by`}{" "}
                              {template.updatedBy
                                ? `${template.updatedBy.firstName || ""} ${template.updatedBy.lastName || ""}`.trim() ||
                                  template.updatedBy.email
                                : t`Unknown`}
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
                            {t`Archived`}
                          </Badge>
                          <Text size="sm">
                            {t`by`}{" "}
                            {template.archivedBy
                              ? `${template.archivedBy.firstName || ""} ${template.archivedBy.lastName || ""}`.trim() ||
                                template.archivedBy.email
                              : t`Unknown`}
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
        title={t`Archive Template`}
        size="md"
      >
        <Stack gap="md">
          <Text>
            {t`Are you sure you want to archive the template`}{" "}
            <Text component="span" fw={700} c="red">
              "{template.name}"
            </Text>
            ?
          </Text>

          <Text size="sm" c="dimmed">
            {t`Archived templates will no longer be available for creating new requests, but existing requests using this template will continue to work.`}
          </Text>

          <Textarea
            label={t`Reason for archiving (optional)`}
            placeholder={t`Enter a reason for archiving this template...`}
            value={archiveReason}
            onChange={(e) => setArchiveReason(e.target.value)}
          />

          <Group justify="flex-end" gap="sm">
            <Button
              variant="outline"
              onClick={() => setArchiveOpened(false)}
              disabled={archiveTemplateMutation.isPending}
            >
              {t`Cancel`}
            </Button>
            <Button
              color="red"
              onClick={confirmArchive}
              loading={archiveTemplateMutation.isPending}
            >
              {t`Archive Template`}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Restore Template Modal */}
      <Modal
        opened={restoreOpened}
        onClose={() => setRestoreOpened(false)}
        title={t`Restore Template`}
        size="md"
      >
        <Stack gap="md">
          <Text>
            {t`Are you sure you want to restore the template`}{" "}
            <Text component="span" fw={700} c="green">
              "{template.name}"
            </Text>
            ?
          </Text>

          <Text size="sm" c="dimmed">
            {t`This will make the template available for creating new workflow requests again.`}
          </Text>

          <Group justify="flex-end" gap="sm">
            <Button
              variant="outline"
              onClick={() => setRestoreOpened(false)}
              disabled={restoreTemplateMutation.isPending}
            >
              {t`Cancel`}
            </Button>
            <Button
              color="green"
              onClick={confirmRestore}
              loading={restoreTemplateMutation.isPending}
            >
              {t`Restore Template`}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
