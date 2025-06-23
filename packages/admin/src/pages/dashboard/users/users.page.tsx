import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  Button,
  Box,
  Input,
  Loader,
  Center,
  Pagination,
  Text,
  Flex,
  ScrollArea,
  Container,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { DEFAULT_DATE_FORMAT } from "../../../common/constants";
import { trpc } from "../../../common/trpc";
import PageTitle from "../../../components/PageTitle";
import PermissionVisibility from "../../../components/PermissionVisibility";
import { ROUTES } from "../../../router/routes";

export default function UsersPage() {
  return (
    <PermissionVisibility permissions={["READ_USERS" as any]}>
      <Container size="xl" my="lg">
        <PageTitle
          title="Пользователи"
          right={
            <PermissionVisibility permissions={["CREATE_USER"]}>
              <Link to={ROUTES.DASHBOARD_USERS_USER}>
                <Button leftSection={<Plus size={14} />}>
                  Добавить пользователя
                </Button>
              </Link>
            </PermissionVisibility>
          }
        />
        <UsersTable />
      </Container>
    </PermissionVisibility>
  );
}

export function UsersTable() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [searchValue] = useDebouncedValue(search, 500);
  const { data: myPermissions } = trpc.admin.users.getMyPermissions.useQuery();

  const hasPermission = myPermissions?.includes("READ_USERS");

  const { data, isLoading } = trpc.admin.users.getUsers.useQuery({
    search: searchValue,
    page,
  });

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const rows = data?.users.map((user) => (
    <Table.Tr
      key={user.id}
      onClick={() => {
        if (hasPermission) {
          navigate(`${ROUTES.DASHBOARD_USERS_USER}/${user.id}`);
        }
      }}
      style={{ cursor: hasPermission ? "pointer" : "default" }}
    >
      <Table.Td>
        <Flex align="center" gap="xs">
          {/* <Avatar size="md" /> */}
          <Text>
            {user.firstName || ""} {user.lastName || ""}
          </Text>
        </Flex>
      </Table.Td>
      <Table.Td>{user.phoneNumber || "-"}</Table.Td>
      <Table.Td>{user.email || "-"}</Table.Td>
      <Table.Td>{format(user.createdAt, DEFAULT_DATE_FORMAT) || "-"}</Table.Td>
    </Table.Tr>
  ));

  return (
    <Box>
      <Input mb="md" placeholder="Поиск" onChange={handleSearch} />

      {isLoading && (
        <Center>
          <Loader />
        </Center>
      )}

      {data && (
        <Box>
          <ScrollArea>
            <Table mb="md" withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Имя</Table.Th>
                  <Table.Th>Номер телефона</Table.Th>
                  <Table.Th>Электронная почта</Table.Th>
                  <Table.Th>Дата присоединения</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          </ScrollArea>
          <Flex direction="column" align="center">
            <Text size="xs" mb="xs" c="dimmed">
              Всего пользователей: {data.pagination.totalCount}
            </Text>
            <Pagination
              onChange={(page) => setPage(page)}
              total={data.pagination.totalPages}
            />
          </Flex>
        </Box>
      )}
    </Box>
  );
}
