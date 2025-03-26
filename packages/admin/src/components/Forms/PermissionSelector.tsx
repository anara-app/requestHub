import { Box, Table, Checkbox } from "@mantine/core";
import { Prisma } from "server/src/common/database-types";

const PERMISSION_TYPES = ["СОЗДАТЬ", "ЧИТАТЬ", "ИЗМЕНИТЬ", "УДАЛИТЬ"];

const PERMISSION_GROUPS: {
  label: string;
  operations: Prisma.PermissionOperation[];
}[] = [
  {
    label: "Пользователи",
    operations: ["CREATE_USER", "READ_USERS", "UPDATE_USER", "DELETE_USER"],
  },

  {
    label: "Роли",
    operations: ["CREATE_ROLE", "READ_ROLES", "UPDATE_ROLE", "DELETE_ROLE"],
  },

  {
    label: "Галерея",
    operations: ["READ_GALLERY", "UPDATE_GALLERY", "DELETE_GALLERY"],
  },
];

interface PermissionSelectProps {
  selectedOperations: Prisma.PermissionOperation[];
  setSelectedOperations: (operations: Prisma.PermissionOperation[]) => void;
}

export default function PermissionSelect({
  selectedOperations,
  setSelectedOperations,
}: PermissionSelectProps) {
  const handleCheckboxChange = (operation: Prisma.PermissionOperation) => {
    const updatedOperations = [...selectedOperations];
    const index = updatedOperations.indexOf(operation);
    if (index === -1) {
      updatedOperations.push(operation);
    } else {
      updatedOperations.splice(index, 1);
    }
    setSelectedOperations(updatedOperations);
  };

  return (
    <Box>
      <Table withTableBorder verticalSpacing={10}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Ресурс</Table.Th>
            {PERMISSION_TYPES.map((type) => (
              <Table.Th key={type}>{type}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {PERMISSION_GROUPS.map((group) => (
            <Table.Tr key={group.label}>
              <Table.Td>{group.label}</Table.Td>
              {group.operations.map((operation) => (
                <Table.Td key={operation}>
                  <Checkbox
                    value={operation}
                    checked={selectedOperations.includes(operation)}
                    onChange={() => handleCheckboxChange(operation)}
                  />
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Box>
  );
}
