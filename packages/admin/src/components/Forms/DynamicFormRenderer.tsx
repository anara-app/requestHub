import React from "react";
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
} from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
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
        return (
          <FileInput
            {...commonProps}
            {...inputProps}
            multiple={field.multiple}
            accept={field.accept}
          />
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
