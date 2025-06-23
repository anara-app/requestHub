import React from "react";
import { useLingui } from "@lingui/react/macro";
import {
  TextInput,
  Textarea,
  NumberInput,
  Select,
  MultiSelect,
  Radio,
  Checkbox,
  Switch,
  Group,
  Stack,
  Grid,
  FileInput,
  Rating,
  Slider,
  Text,
  Box,
  Button,
  Alert,
  Loader,
} from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { ENV_KEYS } from "../../common/constants";
import { FormField } from "./FormBuilder";

interface DynamicFormRendererProps {
  formFields: FormField[];
  form: UseFormReturnType<any>;
  disabled?: boolean;
}

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  formFields,
  form,
  disabled = false,
}) => {
  const { t } = useLingui();
  const [uploadingFiles, setUploadingFiles] = React.useState<Set<string>>(
    new Set()
  );

  const handleFileUpload = async (file: File, fieldName: string) => {
    if (!file) return;

    setUploadingFiles((prev) => new Set(prev).add(fieldName));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${ENV_KEYS.REST_API_URL}/media`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Update form field with the entire response object
      form.setFieldValue(`formData.${fieldName}`, result);

      notifications.show({
        title: t`Success`,
        message: t`File "${file.name}" uploaded successfully`,
        color: "green",
      });
    } catch (error) {
      console.error("File upload error:", error);
      notifications.show({
        title: t`Upload Error`,
        message:
          error instanceof Error ? error.message : t`Failed to upload file`,
        color: "red",
      });

      // Clear the field value on error
      form.setFieldValue(`formData.${fieldName}`, "");
    } finally {
      setUploadingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fieldName);
        return newSet;
      });
    }
  };

  const renderField = (field: FormField) => {
    const commonProps = {
      label: field.label,
      description: field.description,
      required: field.validation?.required,
      disabled,
    };

    const inputProps = {
      ...form.getInputProps(`formData.${field.name}`),
      placeholder: field.placeholder,
    };

    switch (field.type) {
      case "text":
      case "email":
      case "tel":
      case "url":
      case "password":
        return <TextInput {...commonProps} {...inputProps} type={field.type} />;

      case "textarea":
        return (
          <Textarea
            {...commonProps}
            {...inputProps}
            rows={field.rows || 3}
            minRows={field.rows || 3}
          />
        );

      case "number":
        return (
          <NumberInput
            {...commonProps}
            {...inputProps}
            min={field.validation?.min}
            max={field.validation?.max}
            step={field.step}
          />
        );

      case "date":
      case "datetime-local":
      case "time":
        return <TextInput {...commonProps} {...inputProps} type={field.type} />;

      case "select":
        return (
          <Select
            {...commonProps}
            {...inputProps}
            data={
              field.options?.map((opt) => ({
                label: opt.label,
                value: opt.value.toString(),
                disabled: opt.disabled,
              })) || []
            }
            searchable
            clearable
          />
        );

      case "multiselect":
        return (
          <MultiSelect
            {...commonProps}
            {...inputProps}
            data={
              field.options?.map((opt) => ({
                label: opt.label,
                value: opt.value.toString(),
                disabled: opt.disabled,
              })) || []
            }
            searchable
            clearable
          />
        );

      case "radio":
        return (
          <Box>
            <Text size="sm" fw={500} mb="xs">
              {field.label}
              {field.validation?.required && (
                <span style={{ color: "red" }}> *</span>
              )}
            </Text>
            {field.description && (
              <Text size="xs" c="dimmed" mb="sm">
                {field.description}
              </Text>
            )}
            <Radio.Group {...inputProps}>
              <Stack gap="xs">
                {field.options?.map((option, index) => (
                  <Radio
                    key={index}
                    value={option.value.toString()}
                    label={option.label}
                    disabled={disabled || option.disabled}
                  />
                ))}
              </Stack>
            </Radio.Group>
          </Box>
        );

      case "checkbox":
        return (
          <Checkbox
            {...commonProps}
            {...inputProps}
            checked={inputProps.value || false}
          />
        );

      case "switch":
        return (
          <Switch
            {...commonProps}
            {...inputProps}
            checked={inputProps.value || false}
          />
        );

      case "file":
        const isUploading = uploadingFiles.has(field.name);
        const fileData = form.values.formData?.[field.name];

        return (
          <Box>
            <Text size="sm" fw={500} mb="xs">
              {field.label}
              {field.validation?.required && (
                <span style={{ color: "red" }}> *</span>
              )}
            </Text>
            {field.description && (
              <Text size="xs" c="dimmed" mb="sm">
                {field.description}
              </Text>
            )}

            <Stack gap="sm">
              <FileInput
                placeholder={
                  fileData
                    ? t`Change file...`
                    : field.placeholder || t`Select file...`
                }
                multiple={field.multiple}
                accept={field.accept}
                disabled={disabled || isUploading}
                onChange={(file) => {
                  if (file) {
                    if (Array.isArray(file)) {
                      // Handle multiple files if needed
                      file.forEach((f) => handleFileUpload(f, field.name));
                    } else {
                      handleFileUpload(file, field.name);
                    }
                  }
                }}
                rightSection={isUploading ? <Loader size="xs" /> : undefined}
              />

              {isUploading && (
                <Alert color="blue">
                  <Group gap="xs">
                    <Loader size="xs" />
                    <Text size="sm">{t`Uploading file...`}</Text>
                  </Group>
                </Alert>
              )}

              {fileData && !isUploading && (
                <Alert color="green">
                  <Group justify="space-between">
                    <Text size="sm">{t`✓ File uploaded successfully`}</Text>
                    <Button
                      size="xs"
                      variant="subtle"
                      color="red"
                      onClick={() =>
                        form.setFieldValue(`formData.${field.name}`, null)
                      }
                      disabled={disabled}
                    >
                      {t`Remove`}
                    </Button>
                  </Group>
                  <Stack gap="xs" mt="sm">
                    <Group gap="xs">
                      <Text size="sm" fw={500}>
                        {fileData.originalFileName || fileData.filename}
                      </Text>
                      <Text
                        size="xs"
                        c="dimmed"
                        style={{
                          backgroundColor: "#f1f3f4",
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        {fileData.type}
                      </Text>
                    </Group>
                    {fileData.type === "IMAGE" && fileData.url && (
                      <Box
                        style={{
                          border: "1px solid #e0e0e0",
                          borderRadius: "4px",
                          padding: "4px",
                          display: "inline-block",
                          maxWidth: "200px",
                        }}
                      >
                        <img
                          src={fileData.url}
                          alt={fileData.originalFileName || fileData.filename}
                          style={{
                            maxWidth: "100%",
                            height: "auto",
                            borderRadius: "2px",
                          }}
                        />
                      </Box>
                    )}
                    <Text
                      size="xs"
                      c="dimmed"
                      style={{ wordBreak: "break-all" }}
                    >
                      URL: {fileData.url}
                    </Text>
                  </Stack>
                </Alert>
              )}
            </Stack>
          </Box>
        );

      case "rating":
        return (
          <Box>
            <Text size="sm" fw={500} mb="xs">
              {field.label}
              {field.validation?.required && (
                <span style={{ color: "red" }}> *</span>
              )}
            </Text>
            {field.description && (
              <Text size="xs" c="dimmed" mb="sm">
                {field.description}
              </Text>
            )}
            <Rating {...inputProps} count={field.validation?.max || 5} />
          </Box>
        );

      case "slider":
        return (
          <Box>
            <Text size="sm" fw={500} mb="xs">
              {field.label}
              {field.validation?.required && (
                <span style={{ color: "red" }}> *</span>
              )}
            </Text>
            {field.description && (
              <Text size="xs" c="dimmed" mb="sm">
                {field.description}
              </Text>
            )}
            <Slider
              {...inputProps}
              min={field.validation?.min || 0}
              max={field.validation?.max || 100}
              step={field.step || 1}
              marks={[
                {
                  value: field.validation?.min || 0,
                  label: (field.validation?.min || 0).toString(),
                },
                {
                  value: field.validation?.max || 100,
                  label: (field.validation?.max || 100).toString(),
                },
              ]}
            />
          </Box>
        );

      default:
        return <TextInput {...commonProps} {...inputProps} />;
    }
  };

  // Check if field should be displayed based on conditional logic
  const shouldDisplayField = (field: FormField): boolean => {
    if (!field.conditional) return true;

    const dependentFieldValue =
      form.values.formData?.[field.conditional.dependsOn];
    const conditionValue = field.conditional.value;

    switch (field.conditional.condition) {
      case "equals":
        return dependentFieldValue === conditionValue;
      case "not_equals":
        return dependentFieldValue !== conditionValue;
      case "contains":
        return (
          typeof dependentFieldValue === "string" &&
          typeof conditionValue === "string" &&
          dependentFieldValue.includes(conditionValue)
        );
      case "not_contains":
        return (
          typeof dependentFieldValue === "string" &&
          typeof conditionValue === "string" &&
          !dependentFieldValue.includes(conditionValue)
        );
      case "greater_than":
        return (
          typeof dependentFieldValue === "number" &&
          typeof conditionValue === "number" &&
          dependentFieldValue > conditionValue
        );
      case "less_than":
        return (
          typeof dependentFieldValue === "number" &&
          typeof conditionValue === "number" &&
          dependentFieldValue < conditionValue
        );
      default:
        return true;
    }
  };

  // Sort fields by order
  const sortedFields = [...formFields].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );

  return (
    <Grid>
      {sortedFields.filter(shouldDisplayField).map((field) => (
        <Grid.Col key={field.id} span={field.columns || 12}>
          {renderField(field)}
        </Grid.Col>
      ))}
    </Grid>
  );
};
