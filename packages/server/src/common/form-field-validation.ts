import { z } from "zod";

// Form field type definitions
export const formFieldTypeEnum = z.enum([
  "text",
  "textarea",
  "number",
  "email",
  "tel",
  "url",
  "password",
  "date",
  "datetime-local",
  "time",
  "select",
  "multiselect",
  "radio",
  "checkbox",
  "file",
  "switch",
  "slider",
  "rating",
]);

// Validation rules schema
export const validationRulesSchema = z
  .object({
    required: z.boolean().optional().default(false),
    minLength: z.number().min(0).optional(),
    maxLength: z.number().min(0).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(), // regex pattern
    customMessage: z.string().optional(),
  })
  .optional();

// Option schema for select, radio, multiselect fields
export const optionSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
  disabled: z.boolean().optional().default(false),
});

// Comprehensive form field schema
export const formFieldSchema = z.object({
  id: z.string().min(1), // unique identifier for the field
  type: formFieldTypeEnum,
  label: z.string().min(1),
  name: z.string().min(1), // form input name
  placeholder: z.string().optional(),
  description: z.string().optional(), // help text
  defaultValue: z
    .union([z.string(), z.number(), z.boolean(), z.array(z.any())])
    .optional(),
  validation: validationRulesSchema,
  options: z.array(optionSchema).optional(), // for select, radio, multiselect
  multiple: z.boolean().optional().default(false), // for file inputs
  accept: z.string().optional(), // file types for file inputs
  step: z.number().optional(), // for number/slider inputs
  rows: z.number().min(1).optional(), // for textarea
  columns: z.number().min(1).max(12).optional().default(12), // grid layout (1-12)
  order: z.number().min(0).optional().default(0), // field order
  conditional: z
    .object({
      dependsOn: z.string(), // field id this depends on
      condition: z.enum([
        "equals",
        "not_equals",
        "contains",
        "not_contains",
        "greater_than",
        "less_than",
      ]),
      value: z.union([z.string(), z.number(), z.boolean()]),
    })
    .optional(), // conditional field display
});

// Export TypeScript types for frontend use
export type FormFieldType = z.infer<typeof formFieldTypeEnum>;
export type ValidationRules = z.infer<typeof validationRulesSchema>;
export type FieldOption = z.infer<typeof optionSchema>;
export type FormField = z.infer<typeof formFieldSchema>;

// Validation helper functions
export function validateFormFields(formFields: FormField[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const fieldIds = new Set<string>();
  const fieldNames = new Set<string>();

  formFields.forEach((field, index) => {
    // Check for duplicate IDs
    if (fieldIds.has(field.id)) {
      errors.push(`Duplicate field ID '${field.id}' at index ${index}`);
    }
    fieldIds.add(field.id);

    // Check for duplicate names
    if (fieldNames.has(field.name)) {
      errors.push(`Duplicate field name '${field.name}' at index ${index}`);
    }
    fieldNames.add(field.name);

    // Validate field-specific requirements
    if (
      ["select", "multiselect", "radio"].includes(field.type) &&
      (!field.options || field.options.length === 0)
    ) {
      errors.push(
        `Field '${field.id}' of type '${field.type}' requires options`
      );
    }

    if (field.type === "file" && field.multiple && field.validation?.required) {
      errors.push(
        `Field '${field.id}' cannot be both multiple file upload and required`
      );
    }

    // Validate conditional dependencies
    if (field.conditional) {
      if (!fieldIds.has(field.conditional.dependsOn)) {
        errors.push(
          `Field '${field.id}' depends on non-existent field '${field.conditional.dependsOn}'`
        );
      }
    }

    // Validate validation rules
    if (field.validation) {
      if (
        field.validation.minLength !== undefined &&
        field.validation.maxLength !== undefined
      ) {
        if (field.validation.minLength > field.validation.maxLength) {
          errors.push(
            `Field '${field.id}' has minLength greater than maxLength`
          );
        }
      }

      if (
        field.validation.min !== undefined &&
        field.validation.max !== undefined
      ) {
        if (field.validation.min > field.validation.max) {
          errors.push(
            `Field '${field.id}' has min value greater than max value`
          );
        }
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Form field type definitions with metadata
export const FORM_FIELD_TYPES = [
  { value: "text", label: "Text Input", requiresOptions: false },
  { value: "textarea", label: "Text Area", requiresOptions: false },
  { value: "number", label: "Number Input", requiresOptions: false },
  { value: "email", label: "Email Input", requiresOptions: false },
  { value: "tel", label: "Phone Input", requiresOptions: false },
  { value: "url", label: "URL Input", requiresOptions: false },
  { value: "password", label: "Password Input", requiresOptions: false },
  { value: "date", label: "Date Picker", requiresOptions: false },
  {
    value: "datetime-local",
    label: "Date & Time Picker",
    requiresOptions: false,
  },
  { value: "time", label: "Time Picker", requiresOptions: false },
  { value: "select", label: "Dropdown Select", requiresOptions: true },
  {
    value: "multiselect",
    label: "Multi-Select Dropdown",
    requiresOptions: true,
  },
  { value: "radio", label: "Radio Buttons", requiresOptions: true },
  { value: "checkbox", label: "Checkbox", requiresOptions: false },
  { value: "file", label: "File Upload", requiresOptions: false },
  { value: "switch", label: "Toggle Switch", requiresOptions: false },
  { value: "slider", label: "Range Slider", requiresOptions: false },
  { value: "rating", label: "Star Rating", requiresOptions: false },
] as const;

// Condition types for conditional fields
export const CONDITION_TYPES = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Does Not Contain" },
  { value: "greater_than", label: "Greater Than" },
  { value: "less_than", label: "Less Than" },
] as const;
