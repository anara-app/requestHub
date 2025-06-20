import { useState } from "react";
import {
  Container,
  Paper,
  Text,
  Group,
  Avatar,
  Box,
  Loader,
  Center,
  TextInput,
  Badge,
  Stack,
  Divider,
  Card,
  Table,
} from "@mantine/core";
import { 
  Users, 
  Search, 
  User,
  Building,
  Mail,
  Phone,
  Briefcase,
} from "lucide-react";
import { trpc } from "../../../common/trpc";
import PageTitle from "../../../components/PageTitle";
import { useDebouncedValue } from "@mantine/hooks";

export default function OrganizationHierarchyPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchTerm, 300);
  
  const { data, isLoading, error } = trpc.admin.users.getUsers.useQuery({
    search: debouncedSearch,
    limit: 1000, // Get all users for hierarchy
  });
  
  if (isLoading) {
    return (
      <Container>
        <PageTitle title="Organization Hierarchy" />
        <Center>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container>
        <PageTitle title="Organization Hierarchy" />
        <Paper p="md" withBorder>
          <Text c="red">Error loading users: {error.message}</Text>
        </Paper>
      </Container>
    );
  }
  
  const users = data?.users || [];
  
  return (
    <Container size="xl">
      <PageTitle 
        title="Organization Hierarchy" 
        right={
          <Group>
            <TextInput
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftSection={<Search size={16} />}
              style={{ minWidth: 250 }}
            />
          </Group>
        }
      />
      
      {/* Statistics Cards */}
      <Group mb="lg">
        <Card withBorder p="md" style={{ flex: 1 }}>
          <Group>
            <Avatar color="blue" radius="xl">
              <Users size={20} />
            </Avatar>
            <div>
              <Text size="sm" c="dimmed">Total Users</Text>
              <Text fw={700} size="lg">{users.length}</Text>
            </div>
          </Group>
        </Card>
        
        <Card withBorder p="md" style={{ flex: 1 }}>
          <Group>
            <Avatar color="green" radius="xl">
              <Briefcase size={20} />
            </Avatar>
            <div>
              <Text size="sm" c="dimmed">Active Users</Text>
              <Text fw={700} size="lg">{users.length}</Text>
            </div>
          </Group>
        </Card>
        
        <Card withBorder p="md" style={{ flex: 1 }}>
          <Group>
            <Avatar color="orange" radius="xl">
              <Building size={20} />
            </Avatar>
            <div>
              <Text size="sm" c="dimmed">Departments</Text>
              <Text fw={700} size="lg">-</Text>
            </div>
          </Group>
        </Card>
      </Group>
      
      <Paper withBorder p="md">
        <Group mb="md">
          <Building size={20} />
          <Text fw={600} size="lg">User List</Text>
        </Group>
        
        <Divider mb="md" />
        
        <Text size="sm" c="orange" mb="md">
          📝 Note: Full hierarchy view with manager relationships is coming soon! 
          For now, here's a list of all users in the system.
        </Text>
        
        {users.length === 0 ? (
          <Center py="xl">
            <Stack align="center">
              <Users size={48} color="gray" />
              <Text size="lg" c="dimmed">No users found</Text>
              <Text size="sm" c="dimmed">
                {searchTerm ? "Try adjusting your search terms" : "No users in the system"}
              </Text>
            </Stack>
          </Center>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>User</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Phone</Table.Th>
                <Table.Th>Created</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {users.map((user) => {
                const userDisplayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unnamed User';
                
                return (
                  <Table.Tr key={user.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar size="sm" radius="xl">
                          <User size={16} />
                        </Avatar>
                        <div>
                          <Text fw={500} size="sm">
                            {userDisplayName}
                          </Text>
                        </div>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <Mail size={12} />
                        <Text size="sm">
                          {user.email}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      {user.phoneNumber ? (
                        <Group gap={4}>
                          <Phone size={12} />
                          <Text size="sm">
                            {user.phoneNumber}
                          </Text>
                        </Group>
                      ) : (
                        <Text size="sm" c="dimmed">-</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
        
        {searchTerm && (
          <Box mt="md" p="sm" style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: 4 }}>
            <Text size="sm" c="dimmed">
              Showing results for "{searchTerm}" - {users.filter(user => {
                const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       user.email.toLowerCase().includes(searchTerm.toLowerCase());
              }).length} matches found
            </Text>
          </Box>
        )}
      </Paper>
    </Container>
  );
} 