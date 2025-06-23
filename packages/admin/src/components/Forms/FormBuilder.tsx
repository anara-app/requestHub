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
  Switch,
  NumberInput,
  Badge,
  Box,
  Divider,
  Checkbox,
  Grid,
  Modal,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { X, Plus, Settings } from "lucide-react";
import { trpc } from "../../common/trpc";

// Form field types (matching server types)
export type FormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "tel"
  | "url"
  | "password"
  | "date"
  | "datetime-local"
  | "time"
  | "select"
  | "multiselect"
  | "radio"
  | "checkbox"
  | "file"
  | "switch"
  | "slider"
  | "rating";

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  name: string;
  placeholder?: string;
  description?: string;
  defaultValue?: string | number | boolean | any[];
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    customMessage?: string;
  };
  options?: Array<{
    label: string;
    value: string | number | boolean;
    disabled?: boolean;
  }>;
  multiple?: boolean;
  accept?: string;
  step?: number;
  rows?: number;
  columns?: number;
  order?: number;
  conditional?: {
    dependsOn: string;
    condition:
      | "equals"
      | "not_equals"
      | "contains"
      | "not_contains"
      | "greater_than"
      | "less_than";
    value: string | number | boolean;
  };
}

interface FormBuilderProps {
  formFields: FormField[];
  onFormFieldsChange: (fields: FormField[]) => void;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({
  formFields,
  onFormFieldsChange,
}) => {
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [modalOpened, setModalOpened] = useState(false);

  // Fetch form field types
  const { data: fieldTypes } =
    trpc.admin.workflows.getFormFieldTypes.useQuery();

  // Form field management functions
  const generateFieldId = () => {
    return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const addFormField = () => {
    const newField: FormField = {
      id: generateFieldId(),
      type: "text",
      label: "",
      name: "",
      columns: 12,
      order: formFields.length,
      validation: {
        required: false,
      },
    };
    setEditingField(newField);
    setModalOpened(true);
  };

  const saveFormField = () => {
    if (!editingField) return;

    if (!editingField.label.trim() || !editingField.name.trim()) {
      notifications.show({
        title: "Error",
        message: "Field label and name are required",
        color: "red",
      });
      return;
    }

    // Check for duplicate names
    const isDuplicateName = formFields.some(
      (field) =>
        field.id !== editingField.id && field.name === editingField.name
    );

    if (isDuplicateName) {
      notifications.show({
        title: "Error",
        message: "Field name must be unique",
        color: "red",
      });
      return;
    }

    const existingIndex = formFields.findIndex(
      (field) => field.id === editingField.id
    );

    let updatedFields: FormField[];
    if (existingIndex >= 0) {
      // Update existing field
      updatedFields = [...formFields];
      updatedFields[existingIndex] = editingField;
    } else {
      // Add new field
      updatedFields = [...formFields, editingField];
    }

    onFormFieldsChange(updatedFields);
    setEditingField(null);
    setModalOpened(false);
  };

  const editFormField = (field: FormField) => {
    setEditingField({ ...field });
    setModalOpened(true);
  };

  const removeFormField = (fieldId: string) => {
    const updatedFields = formFields.filter((field) => field.id !== fieldId);
    onFormFieldsChange(updatedFields);
  };

  const cancelEditField = () => {
    setEditingField(null);
    setModalOpened(false);
  };

  const addFieldOption = () => {
    if (!editingField) return;

    const newOption = {
      label: "",
      value: "",
      disabled: false,
    };

    setEditingField({
      ...editingField,
      options: [...(editingField.options || []), newOption],
    });
  };

  const updateFieldOption = (
    index: number,
    field: "label" | "value" | "disabled",
    value: any
  ) => {
    if (!editingField || !editingField.options) return;

    const updatedOptions = [...editingField.options];
    updatedOptions[index] = { ...updatedOptions[index], [field]: value };

    setEditingField({
      ...editingField,
      options: updatedOptions,
    });
  };

  const removeFieldOption = (index: number) => {
    if (!editingField || !editingField.options) return;

    setEditingField({
      ...editingField,
      options: editingField.options.filter((_, i) => i !== index),
    });
  };

  return (
    <Box>
      <Text fw={500}>Custom Form Fields</Text>
      <Text size="sm" c="dimmed" mb="md">
        Create custom form fields that users will fill when creating requests
        with this template
      </Text>

      {formFields.length > 0 ? (
        <Stack gap="md" mb="md">
          {formFields.map((field) => (
            <Paper key={field.id} p="md" withBorder>
              <Group justify="space-between">
                <Box>
                  <Group gap="xs">
                    <Text fw={500}>{field.label || "Untitled Field"}</Text>
                    <Badge size="sm" variant="outline">
                      {fieldTypes?.types.find((t) => t.value === field.type)
                        ?.label || field.type}
                    </Badge>
                    {field.validation?.required && (
                      <Badge size="sm" color="red">
                        Required
                      </Badge>
                    )}
                  </Group>
                  <Text size="sm" c="dimmed">
                    Field name: {field.name || "Not set"}
                  </Text>
                  {field.description && (
                    <Text size="sm" c="dimmed" mt="xs">
                      {field.description}
                    </Text>
                  )}
                </Box>
                <Group gap="xs">
                  <ActionIcon
                    variant="outline"
                    onClick={() => editFormField(field)}
                  >
                    <Settings size={16} />
                  </ActionIcon>
                  <ActionIcon
                    color="red"
                    variant="outline"
                    onClick={() => removeFormField(field.id)}
                  >
                    <X size={16} />
                  </ActionIcon>
                </Group>
              </Group>
            </Paper>
          ))}
        </Stack>
      ) : (
        <Box py="xl" style={{ textAlign: "center" }}>
          <Text c="dimmed" mb="md">
            No form fields added yet. Add your first field to get started.
          </Text>
        </Box>
      )}

      <Button
        variant="outline"
        onClick={addFormField}
        leftSection={<Plus size={16} />}
      >
        Add Form Field
      </Button>

      {/* Form Field Editor Modal */}
      <Modal
        opened={modalOpened}
        onClose={cancelEditField}
        title={
          editingField
            ? `${formFields.some((f) => f.id === editingField.id) ? "Edit" : "Add"} Form Field`
            : "Form Field"
        }
        size="lg"
        centered
      >
        {editingField && (
          <>
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="Field Label"
                  placeholder="Enter field label"
                  value={editingField.label}
                  onChange={(e) =>
                    setEditingField({ ...editingField, label: e.target.value })
                  }
                  required
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="Field Name"
                  placeholder="Enter field name (no spaces)"
                  value={editingField.name}
                  onChange={(e) =>
                    setEditingField({
                      ...editingField,
                      name: e.target.value.replace(/\s+/g, "_").toLowerCase(),
                    })
                  }
                  required
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Select
                  label="Field Type"
                  data={
                    fieldTypes?.types.map((type) => ({
                      value: type.value,
                      label: type.label,
                    })) || []
                  }
                  value={editingField.type}
                  onChange={(value) =>
                    value &&
                    setEditingField({
                      ...editingField,
                      type: value as FormFieldType,
                    })
                  }
                  required
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  label="Column Width (1-12)"
                  min={1}
                  max={12}
                  value={editingField.columns}
                  onChange={(value) =>
                    setEditingField({
                      ...editingField,
                      columns: typeof value === "number" ? value : 12,
                    })
                  }
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <TextInput
                  label="Placeholder"
                  placeholder="Enter placeholder text"
                  value={editingField.placeholder || ""}
                  onChange={(e) =>
                    setEditingField({
                      ...editingField,
                      placeholder: e.target.value,
                    })
                  }
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <Textarea
                  label="Description"
                  placeholder="Enter field description"
                  value={editingField.description || ""}
                  onChange={(e) =>
                    setEditingField({
                      ...editingField,
                      description: e.target.value,
                    })
                  }
                />
              </Grid.Col>

              {/* Validation Settings */}
              <Grid.Col span={12}>
                <Text fw={500} mt="md" mb="md">
                  Validation Rules
                </Text>
                <Group gap="lg">
                  <Checkbox
                    label="Required"
                    checked={editingField.validation?.required || false}
                    onChange={(e) =>
                      setEditingField({
                        ...editingField,
                        validation: {
                          ...editingField.validation,
                          required: e.currentTarget.checked,
                        },
                      })
                    }
                  />
                  {editingField.type === "textarea" && (
                    <NumberInput
                      label="Rows"
                      min={1}
                      max={10}
                      value={editingField.rows || 3}
                      onChange={(value) =>
                        setEditingField({
                          ...editingField,
                          rows: typeof value === "number" ? value : 3,
                        })
                      }
                    />
                  )}
                </Group>
              </Grid.Col>

              {["text", "textarea", "email", "tel", "url", "password"].includes(
                editingField.type
              ) && (
                <>
                  <Grid.Col span={6}>
                    <NumberInput
                      label="Min Length"
                      min={0}
                      value={editingField.validation?.minLength || ""}
                      onChange={(value) =>
                        setEditingField({
                          ...editingField,
                          validation: {
                            ...editingField.validation,
                            minLength:
                              typeof value === "number" ? value : undefined,
                          },
                        })
                      }
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <NumberInput
                      label="Max Length"
                      min={0}
                      value={editingField.validation?.maxLength || ""}
                      onChange={(value) =>
                        setEditingField({
                          ...editingField,
                          validation: {
                            ...editingField.validation,
                            maxLength:
                              typeof value === "number" ? value : undefined,
                          },
                        })
                      }
                    />
                  </Grid.Col>
                </>
              )}

              {["number", "slider", "rating"].includes(editingField.type) && (
                <>
                  <Grid.Col span={6}>
                    <NumberInput
                      label="Min Value"
                      value={editingField.validation?.min || ""}
                      onChange={(value) =>
                        setEditingField({
                          ...editingField,
                          validation: {
                            ...editingField.validation,
                            min: typeof value === "number" ? value : undefined,
                          },
                        })
                      }
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <NumberInput
                      label="Max Value"
                      value={editingField.validation?.max || ""}
                      onChange={(value) =>
                        setEditingField({
                          ...editingField,
                          validation: {
                            ...editingField.validation,
                            max: typeof value === "number" ? value : undefined,
                          },
                        })
                      }
                    />
                  </Grid.Col>
                </>
              )}

              {editingField.type === "file" && (
                <>
                  <Grid.Col span={6}>
                    <Switch
                      label="Allow Multiple Files"
                      checked={editingField.multiple || false}
                      onChange={(e) =>
                        setEditingField({
                          ...editingField,
                          multiple: e.currentTarget.checked,
                        })
                      }
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <TextInput
                      label="Accepted File Types"
                      placeholder="e.g., .pdf,.doc,.jpg"
                      value={editingField.accept || ""}
                      onChange={(e) =>
                        setEditingField({
                          ...editingField,
                          accept: e.target.value,
                        })
                      }
                    />
                  </Grid.Col>
                </>
              )}

              {/* Options for select, multiselect, radio */}
              {["select", "multiselect", "radio"].includes(
                editingField.type
              ) && (
                <Grid.Col span={12}>
                  <Text fw={500} mt="md" mb="md">
                    Options
                  </Text>
                  {editingField.options?.map((option, index) => (
                    <Group key={index} align="end" mb="xs">
                      <TextInput
                        label="Label"
                        placeholder="Option label"
                        value={option.label}
                        onChange={(e) =>
                          updateFieldOption(index, "label", e.target.value)
                        }
                        style={{ flex: 1 }}
                      />
                      <TextInput
                        label="Value"
                        placeholder="Option value"
                        value={option.value.toString()}
                        onChange={(e) =>
                          updateFieldOption(index, "value", e.target.value)
                        }
                        style={{ flex: 1 }}
                      />
                      <Checkbox
                        label="Disabled"
                        checked={option.disabled || false}
                        onChange={(e) =>
                          updateFieldOption(
                            index,
                            "disabled",
                            e.currentTarget.checked
                          )
                        }
                      />
                      <ActionIcon
                        color="red"
                        variant="outline"
                        onClick={() => removeFieldOption(index)}
                      >
                        <X size={16} />
                      </ActionIcon>
                    </Group>
                  ))}
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={addFieldOption}
                    leftSection={<Plus size={16} />}
                  >
                    Add Option
                  </Button>
                </Grid.Col>
              )}
            </Grid>

            <Group justify="flex-end" mt="xl">
              <Button variant="outline" onClick={cancelEditField}>
                Cancel
              </Button>
              <Button onClick={saveFormField}>
                {formFields.some((f) => f.id === editingField.id)
                  ? "Update"
                  : "Add"}{" "}
                Field
              </Button>
            </Group>
          </>
        )}
      </Modal>
    </Box>
  );
};
