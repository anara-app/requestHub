import { Table, Button, Box, Center, Loader, ScrollArea } from "@mantine/core";
import { Eye, Plus } from "lucide-react";
import Container from "../../../components/Container";
import PageTitle from "../../../components/PageTitle";
import { trpc } from "../../../common/trpc";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "../../../router/routes";
import EmptyPlaceholder from "../../../components/EmptyPlaceholder";
import PermissionVisibility from "../../../components/PermissionVisibility";

export default function RolesPage() {
  return (
    <PermissionVisibility permissions={["READ_ROLES" as any]}>
      <Container>
        <PageTitle
          title="Роли"
          right={
            <PermissionVisibility permissions={["CREATE_ROLE"]}>
              <Link to={ROUTES.DASHBOARD_ROLES_ROLE}>
                <Button leftSection={<Plus size={14} />}>Добавить роль</Button>
              </Link>
            </PermissionVisibility>
          }
        />
        <RolesTable />
      </Container>
    </PermissionVisibility>
  );
}

export function RolesTable() {
  const navigate = useNavigate();
  const { data, isLoading } = trpc.admin.roles.getRoles.useQuery();

  const rows = data?.map((role) => (
    <Table.Tr key={role.id}>
      <Table.Td w="100%">{role.name}</Table.Td>
      <Table.Td>
        <PermissionVisibility permissions={["READ_ROLES"]}>
          <Button
            leftSection={<Eye size={14} />}
            variant="light"
            onClick={() =>
              navigate(`${ROUTES.DASHBOARD_ROLES_ROLE}/${role.id}`)
            }
          >
            Просмотр
          </Button>
        </PermissionVisibility>
      </Table.Td>
    </Table.Tr>
  ));

  if (isLoading) {
    return (
      <Center>
        <Loader />
      </Center>
    );
  }

  if (!data?.length) {
    return (
      <Center>
        <Box>
          <EmptyPlaceholder
            title="Нет доступных ролей"
            subtitle="Создайте новую роль, чтобы начать работу"
            buttonText="Добавить роль"
            onClick={() => navigate(ROUTES.DASHBOARD_ROLES_ROLE)}
          />
        </Box>
      </Center>
    );
  }

  return (
    <Box>
      <ScrollArea>
        <Table mb="md" withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Название</Table.Th>
              <Table.Th>Действие</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </ScrollArea>
    </Box>
  );
}
