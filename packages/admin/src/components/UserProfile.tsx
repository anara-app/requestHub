import { Group, Text, Avatar, Menu, UnstyledButton, rem } from "@mantine/core";
import { User, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authClient } from "../common/auth";
import { trpc } from "../common/trpc";
import { ROUTES } from "../router/routes";

interface UserProfileProps {
  isMobile?: boolean;
}

export default function UserProfile({ isMobile = false }: UserProfileProps) {
  const navigate = useNavigate();
  const { data: currentUser, isLoading } = trpc.admin.users.getMe.useQuery();

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      window.location.href = ROUTES.AUTH;
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = ROUTES.AUTH;
    }
  };

  if (isLoading || !currentUser) {
    return (
      <Group gap="sm">
        <Avatar size="sm" />
        {!isMobile && (
          <Text size="sm" c="dimmed">
            Loading...
          </Text>
        )}
      </Group>
    );
  }

  const displayName =
    currentUser.firstName && currentUser.lastName
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : currentUser.email;

  const initials =
    currentUser.firstName && currentUser.lastName
      ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`
      : currentUser.email?.[0]?.toUpperCase() || "U";

  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <UnstyledButton
          style={{
            padding: rem(8),
            borderRadius: rem(8),
            transition: "background-color 0.2s",
          }}
          className="hover:bg-gray-100"
        >
          <Group gap="sm">
            <Avatar size="sm" radius="xl" color="blue">
              {initials}
            </Avatar>
            {!isMobile && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm" fw={500} truncate>
                  {displayName}
                </Text>
                <Text size="xs" c="dimmed" truncate>
                  {currentUser.role?.name || "No role assigned"}
                </Text>
              </div>
            )}
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Account</Menu.Label>
        <Menu.Item leftSection={<User size={14} />} disabled>
          <div>
            <Text size="sm" fw={500}>
              {displayName}
            </Text>
            <Text size="xs" c="dimmed">
              {currentUser.email}
            </Text>
            {currentUser.role && (
              <Text size="xs" c="dimmed">
                Role: {currentUser.role.name}
              </Text>
            )}
          </div>
        </Menu.Item>

        <Menu.Divider />

        <Menu.Item
          leftSection={<LogOut size={14} />}
          color="red"
          onClick={handleLogout}
        >
          Logout
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
