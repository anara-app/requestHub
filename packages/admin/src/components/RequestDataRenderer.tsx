import React from "react";
import { Stack, Group, Text, Box, Badge, SimpleGrid } from "@mantine/core";
import { FormField } from "./Forms/FormBuilder";

interface RequestDataRendererProps {
  requestData: Record<string, any>;
  formFields: FormField[];
}

export const RequestDataRenderer: React.FC<RequestDataRendererProps> = ({
  requestData,
  formFields,
}) => {
  if (!requestData || Object.keys(requestData).length === 0) {
    return (
      <Text c="dimmed" ta="center" py="md">
        No request data available
      </Text>
    );
  }

  const renderFieldValue = (field: FormField, value: any) => {
    if (value === null || value === undefined || value === "") {
      return (
        <Text size="sm" c="dimmed">
          No value provided
        </Text>
      );
    }

    // Handle file fields with preview
    if (field.type === "file" && typeof value === "object" && value.url) {
      return (
        <Stack gap="sm">
          <Group gap="xs">
            <Text size="sm" fw={500}>
              {value.originalFileName || value.filename}
            </Text>
          </Group>
          {value.type === "IMAGE" && value.url && (
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
                src={value.url}
                alt={value.originalFileName || value.filename}
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  borderRadius: "2px",
                }}
              />
            </Box>
          )}
        </Stack>
      );
    }

    // Handle multi-select arrays
    if (Array.isArray(value)) {
      return (
        <Group gap="xs">
          {value.map((item, index) => (
            <Badge key={index} variant="outline" size="sm">
              {String(item)}
            </Badge>
          ))}
        </Group>
      );
    }

    // Handle boolean values
    if (typeof value === "boolean") {
      return (
        <Badge color={value ? "green" : "red"} variant="light" size="sm">
          {value ? "Yes" : "No"}
        </Badge>
      );
    }

    // Handle objects (non-file)
    if (typeof value === "object") {
      return (
        <Text
          size="sm"
          style={{
            wordBreak: "break-word",
            fontFamily: "monospace",
            backgroundColor: "#f8f9fa",
            padding: "8px",
            borderRadius: "4px",
          }}
        >
          {JSON.stringify(value, null, 2)}
        </Text>
      );
    }

    // Handle regular text/number values
    return (
      <Text size="sm" style={{ wordBreak: "break-word" }}>
        {String(value)}
      </Text>
    );
  };

  // Sort fields by order and filter only those that have data
  const fieldsWithData = formFields
    .filter((field) => requestData.hasOwnProperty(field.name))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (fieldsWithData.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="md">
        No matching form data found
      </Text>
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
      {fieldsWithData.map((field) => {
        const value = requestData[field.name];

        return (
          <Box
            key={field.id}
            p="md"
            style={{
              backgroundColor: "#fafafa",
              borderRadius: "8px",
              border: "1px solid #e9ecef",
              minHeight: "80px",
            }}
          >
            <Box mb="sm">
              <Text fw={600} size="sm" mb={4} c="dark.7">
                {field.label}
              </Text>
              {field.description && (
                <Text size="xs" c="dimmed" mb="sm">
                  {field.description}
                </Text>
              )}
            </Box>

            <Box>{renderFieldValue(field, value)}</Box>
          </Box>
        );
      })}
    </SimpleGrid>
  );
};
