import {
  AppShell,
  Burger,
  Flex,
  NavLink,
  Group,
  ActionIcon,
} from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "../router/routes";
import ProtectedRoute from "./ProtectedRoute";
import { ImagesIcon, LogOutIcon, UserCog, Users } from "lucide-react";
import { TokenManager } from "../common/tokens";
import { useAuthStore } from "../store/useAuth";
import logo from "../assets/logo.png";
import ThemeSwitch from "./ThemeSwith";
import { $Enums } from "../common/database.types";
import { trpc } from "../common/trpc";
import { useDashboardLayout } from "../store/useDashboardLayout";

type WebAppRoutesTypes = keyof typeof ROUTES;

interface NavItemType {
  icon?: any;
  label: string;
  path: WebAppRoutesTypes | string;
  activePaths: (WebAppRoutesTypes | string)[];
  permissionRequired?: $Enums.PermissionOperation;
}

const SecondaryNavItems: NavItemType[] = [
  {
    icon: ImagesIcon,
    label: "Галерея",
    path: ROUTES.DASHBOARD_GALLERY,
    activePaths: [ROUTES.DASHBOARD_GALLERY],
    permissionRequired: "READ_GALLERY",
  },
  {
    icon: Users,
    label: "Пользователи",
    path: ROUTES.DASHBOARD_USERS,
    activePaths: [ROUTES.DASHBOARD_USERS, ROUTES.DASHBOARD_USERS_USER],
    permissionRequired: "READ_USERS",
  },
  {
    icon: UserCog,
    label: "Роли",
    path: ROUTES.DASHBOARD_ROLES,
    activePaths: [ROUTES.DASHBOARD_ROLES, ROUTES.DASHBOARD_ROLES_ROLE],
    permissionRequired: "READ_ROLES",
  },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [opened, { toggle }] = useDisclosure();

  const { logout } = useAuthStore();
  const { isEnabled } = useDashboardLayout();

  const isMobile = useMediaQuery("(max-width: 767px)");

  const { data } = trpc.admin.users.getMyPermissions.useQuery();

  const handleLogout = () => {
    TokenManager.removeToken();
    logout();
    navigate(ROUTES.AUTH);
  };

  const currentPath = location.pathname.split("/")?.[1]
    ? `/${location.pathname.split("/")?.[1]}`
    : "";

  return (
    <ProtectedRoute>
      <AppShell
        header={{ height: 60, collapsed: !isMobile }}
        disabled={isEnabled}
        navbar={{
          width: 230,
          breakpoint: "sm",
          collapsed: { mobile: !opened },
        }}
      >
        <AppShell.Header
          hiddenFrom="md"
          className="flex items-center justify-between px-4"
        >
          <Flex align="center" gap={10}>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <img className="h-6 w-auto" src={logo} alt="24.kg" />
          </Flex>
        </AppShell.Header>
        <AppShell.Navbar>
          <AppShell.Section px="sm" py="md">
            <Group justify="space-between">
              <img className="h-6 w-auto" src={logo} alt="24.kg" />
              <Group>
                <ThemeSwitch />
                <ActionIcon onClick={handleLogout} variant="transparent">
                  <LogOutIcon size={16} />
                </ActionIcon>
              </Group>
            </Group>
          </AppShell.Section>
          {SecondaryNavItems.map((item) => {
            if (
              !item?.permissionRequired ||
              !data?.includes(item?.permissionRequired)
            )
              return;
            return (
              <Link onClick={toggle} to={item.path} key={item.path}>
                <NavLink
                  h={50}
                  leftSection={<item.icon size={16} />}
                  label={item.label}
                  className={`${
                    item?.activePaths?.includes(currentPath)
                      ? "!bg-blue-500 !text-white"
                      : ""
                  }`}
                />
              </Link>
            );
          })}
        </AppShell.Navbar>
        <AppShell.Main>
          <Outlet />
        </AppShell.Main>
      </AppShell>
    </ProtectedRoute>
  );
}
