import { useEffect } from "react";
import {
  Container,
  Card,
  Text,
  Button,
  Group,
  Stack,
  Alert,
  LoadingOverlay,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useNavigate, useParams } from "react-router-dom";
import { trpc } from "../../../common/trpc";
import { DynamicFormRenderer } from "../../../components/Forms/DynamicFormRenderer";
import { FormField } from "../../../components/Forms/FormBuilder";
import LoadingPlaceholder from "../../../components/LoadingPlaceholder";
import PageTitle from "../../../components/PageTitle";
import { ROUTES } from "../../../router/routes";

interface RequestFormData {
  templateId: string;
  title: string;
  description: string;
  formData: Record<string, any>;
}

export default function NewRequestPage() {
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId: string }>();
  const utils = trpc.useUtils();

  const form = useForm<RequestFormData>({
    initialValues: {
      templateId: templateId || "",
      title: "",
      description: "",
      formData: {},
    },
    validate: {
      title: (value: string) =>
        value.length < 3 ? "Title must be at least 3 characters" : null,
      description: (value: string) =>
        value.length < 10 ? "Description must be at least 10 characters" : null,
    },
  });

  // Fetch template data
  const {
    data: template,
    isLoading: templateLoading,
    error: templateError,
  } = trpc.nextClient.workflows.getTemplates.useQuery(undefined, {
    enabled: !!templateId,
  });

  const selectedTemplate = template?.find((t) => t.id === templateId);

  const createRequestMutation =
    trpc.nextClient.workflows.createRequest.useMutation({
      onSuccess: () => {
        notifications.show({
          title: "Success",
          message: "Request submitted successfully",
          color: "green",
        });
        utils.nextClient.workflows.getMyRequests.invalidate();
        navigate(ROUTES.DASHBOARD_MY_REQUESTS);
      },
      onError: (error: any) => {
        notifications.show({
          title: "Error",
          message: error.message || "Failed to submit request",
          color: "red",
        });
      },
    });

  // Set template ID when it changes
  useEffect(() => {
    if (templateId) {
      form.setFieldValue("templateId", templateId);
    }
  }, [templateId]);

  // Validate form fields against template requirements
  const validateFormFields = (values: RequestFormData) => {
    const errors: Record<string, string> = {};

    if (!selectedTemplate?.formFields) return errors;

    const formFields = JSON.parse(
      selectedTemplate.formFields as string
    ) as FormField[];

    formFields.forEach((field) => {
      const fieldValue = values.formData[field.name];

      // Required field validation
      if (field.validation?.required && (!fieldValue || fieldValue === "")) {
        errors[`formData.${field.name}`] = `${field.label} is required`;
      }

      // String length validation
      if (fieldValue && typeof fieldValue === "string") {
        if (
          field.validation?.minLength &&
          fieldValue.length < field.validation.minLength
        ) {
          errors[`formData.${field.name}`] =
            `${field.label} must be at least ${field.validation.minLength} characters`;
        }
        if (
          field.validation?.maxLength &&
          fieldValue.length > field.validation.maxLength
        ) {
          errors[`formData.${field.name}`] =
            `${field.label} must be no more than ${field.validation.maxLength} characters`;
        }
      }

      // Number validation
      if (fieldValue && typeof fieldValue === "number") {
        if (
          field.validation?.min !== undefined &&
          fieldValue < field.validation.min
        ) {
          errors[`formData.${field.name}`] =
            `${field.label} must be at least ${field.validation.min}`;
        }
        if (
          field.validation?.max !== undefined &&
          fieldValue > field.validation.max
        ) {
          errors[`formData.${field.name}`] =
            `${field.label} must be no more than ${field.validation.max}`;
        }
      }
    });

    return errors;
  };

  const handleSubmit = (values: RequestFormData) => {
    // Validate custom form fields
    const fieldErrors = validateFormFields(values);
    if (Object.keys(fieldErrors).length > 0) {
      form.setErrors(fieldErrors);
      return;
    }

    createRequestMutation.mutate({
      templateId: values.templateId,
      title: values.title,
      description: values.description,
      data: values.formData,
    });
  };

  if (!templateId) {
    return (
      <Container size="xl" my="lg">
        <PageTitle>New Request</PageTitle>
        <Alert color="red" title="Missing Template">
          No template ID provided. Please select a template from the raise
          request page.
        </Alert>
      </Container>
    );
  }

  if (templateLoading) {
    return <LoadingPlaceholder />;
  }

  if (templateError || !selectedTemplate) {
    return (
      <Container size="xl" my="lg">
        <PageTitle>New Request</PageTitle>
        <Alert color="red" title="Template Not Found">
          The requested template could not be found or you don't have permission
          to access it.
        </Alert>
      </Container>
    );
  }

  const formFields = selectedTemplate.formFields
    ? (JSON.parse(selectedTemplate.formFields as string) as FormField[])
    : [];

  return (
    <Container size="xl" my="lg">
      <PageTitle>New {selectedTemplate.name} Request</PageTitle>

      <Text size="sm" c="dimmed" mb="xl">
        Fill out the form below to create a new{" "}
        {selectedTemplate.name.toLowerCase()} request.
        {selectedTemplate.description && ` ${selectedTemplate.description}`}
      </Text>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <LoadingOverlay visible={createRequestMutation.isPending} />

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            {/* Basic request information */}
            <Text fw={500} size="lg" mb="md">
              Request Information
            </Text>

            <div>
              <Text size="sm" fw={500} mb="xs">
                Request Title *
              </Text>
              <input
                type="text"
                placeholder="Enter a descriptive title for your request"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
                {...form.getInputProps("title")}
              />
              {form.errors.title && (
                <Text size="xs" c="red" mt="xs">
                  {form.errors.title}
                </Text>
              )}
            </div>

            <div>
              <Text size="sm" fw={500} mb="xs">
                Description *
              </Text>
              <textarea
                placeholder="Provide details about your request"
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px",
                  resize: "vertical",
                }}
                {...form.getInputProps("description")}
              />
              {form.errors.description && (
                <Text size="xs" c="red" mt="xs">
                  {form.errors.description}
                </Text>
              )}
            </div>

            {/* Dynamic form fields */}
            {formFields.length > 0 && (
              <>
                <Text fw={500} size="lg" mb="md" mt="xl">
                  Request Details
                </Text>
                <DynamicFormRenderer
                  formFields={formFields}
                  form={form}
                  disabled={createRequestMutation.isPending}
                />
              </>
            )}

            <Group justify="flex-end" mt="xl">
              <Button
                variant="subtle"
                onClick={() => navigate(ROUTES.DASHBOARD_RAISE_REQUEST)}
                disabled={createRequestMutation.isPending}
              >
                Back to Templates
              </Button>
              <Button type="submit" loading={createRequestMutation.isPending}>
                Submit Request
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Container>
  );
}
