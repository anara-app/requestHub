import { Box, Table, Checkbox, Text } from "@mantine/core";
import { Prisma } from "server/src/common/database-types";

const PERMISSION_GROUPS: {
  label: string;
  operations: {
    operation: Prisma.PermissionOperation;
    description: string;
  }[];
}[] = [
  {
    label: "Пользователи",
    operations: [
      { operation: "CREATE_USER", description: "Создание новых пользователей" },
      { operation: "READ_USERS", description: "Просмотр списка пользователей" },
      {
        operation: "UPDATE_USER",
        description: "Редактирование данных пользователей",
      },
      { operation: "DELETE_USER", description: "Удаление пользователей" },
    ],
  },
  {
    label: "Роли",
    operations: [
      { operation: "CREATE_ROLE", description: "Создание новых ролей" },
      { operation: "READ_ROLES", description: "Просмотр ролей" },
      { operation: "UPDATE_ROLE", description: "Редактирование ролей" },
      { operation: "DELETE_ROLE", description: "Удаление ролей" },
    ],
  },
  {
    label: "Галерея",
    operations: [
      { operation: "READ_GALLERY", description: "Просмотр галереи" },
      { operation: "UPDATE_GALLERY", description: "Редактирование галереи" },
      { operation: "DELETE_GALLERY", description: "Удаление из галереи" },
    ],
  },
  {
    label: "Workflow Requests",
    operations: [
      { operation: "CREATE_WORKFLOW_REQUEST", description: "Создание новых запросов" },
      { operation: "READ_WORKFLOW_REQUESTS", description: "Просмотр запросов" },
      { operation: "UPDATE_WORKFLOW_REQUEST", description: "Редактирование запросов" },
      { operation: "DELETE_WORKFLOW_REQUEST", description: "Удаление запросов" },
      { operation: "APPROVE_WORKFLOW_REQUEST", description: "Одобрение запросов" },
      { operation: "REJECT_WORKFLOW_REQUEST", description: "Отклонение запросов" },
    ],
  },
  {
    label: "Workflow Templates",
    operations: [
      { operation: "MANAGE_WORKFLOW_TEMPLATES", description: "Управление шаблонами workflow" },
    ],
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
            <Table.Th>Разрешения</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {PERMISSION_GROUPS.map((group) => (
            <Table.Tr key={group.label}>
              <Table.Td>
                <Text fw={500}>{group.label}</Text>
              </Table.Td>
              <Table.Td>
                <Box
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexDirection: "column",
                  }}
                >
                  {group.operations.map(({ operation, description }) => (
                    <Checkbox
                      key={operation}
                      value={operation}
                      checked={selectedOperations.includes(operation)}
                      onChange={() => handleCheckboxChange(operation)}
                      label={description}
                      size="sm"
                    />
                  ))}
                </Box>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Box>
  );
}
