import { useState } from "react";
import { useLingui } from "@lingui/react/macro";
import {
  AppShell,
  Center,
  Stack,
  Tooltip,
  UnstyledButton,
  Group,
  Text,
  Burger,
} from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import {
  ImagesIcon,
  LogOutIcon,
  UserCog,
  Users,
  Workflow,
  FileText,
  Plus,
  Clock,
  FileCheck,
  Network,
  BarChart3,
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { authClient } from "../../common/auth";
import { $Enums } from "../../common/database.types";
import { trpc } from "../../common/trpc";
import { ROUTES } from "../../router/routes";
import { useDashboardLayout } from "../../store/useDashboardLayout";
import LanguageSwitcher from "../LanguageSwitcher";
import ProtectedRoute from "../ProtectedRoute";
import ThemeSwitch from "../ThemeSwith";
import UserProfile from "../UserProfile";
import classes from "./NavbarMinimal.module.css";

type WebAppRoutesTypes = keyof typeof ROUTES;

interface NavItemType {
  icon: any;
  label: string;
  path: WebAppRoutesTypes | string;
  activePaths: (WebAppRoutesTypes | string)[];
  permissionRequired?: $Enums.PermissionOperation;
}

interface NavbarLinkProps {
  icon: any;
  label: string;
  active?: boolean;
  onClick?: () => void;
  isMobile?: boolean;
}

function NavbarLink({
  icon: Icon,
  label,
  active,
  onClick,
  isMobile,
}: NavbarLinkProps) {
  if (isMobile) {
    // Mobile layout with icon + text horizontal
    return (
      <UnstyledButton
        onClick={onClick}
        className={`flex w-full items-center gap-3 rounded-lg p-3 transition-colors duration-200 ${
          active
            ? "bg-blue-700 text-white"
            : "text-blue-100 hover:bg-blue-700 hover:text-white"
        }`}
        style={{ minHeight: 48 }} // Touch-friendly height
      >
        <Icon size={20} strokeWidth={1.5} />
        <span className="text-sm font-medium">{label}</span>
      </UnstyledButton>
    );
  }

  // Desktop layout (icon only with tooltip)
  return (
    <Tooltip label={label} position="right" transitionProps={{ duration: 0 }}>
      <UnstyledButton
        onClick={onClick}
        className={classes.link}
        data-active={active || undefined}
      >
        <Icon size={20} strokeWidth={1.5} />
      </UnstyledButton>
    </Tooltip>
  );
}

export default function DashboardLayout() {
  const { t } = useLingui();
  const location = useLocation();
  const navigate = useNavigate();
  const [opened, { toggle }] = useDisclosure();
  const [_, setActive] = useState(0);

  const { isEnabled } = useDashboardLayout();

  const isMobile = useMediaQuery("(max-width: 767px)");

  const { data } = trpc.admin.users.getMyPermissions.useQuery();

  const NavItems: NavItemType[] = [
    {
      icon: BarChart3,
      label: t`Analytics`,
      path: ROUTES.DASHBOARD_ANALYTICS,
      activePaths: [ROUTES.DASHBOARD_ANALYTICS],
      permissionRequired: "READ_ANALYTICS" as any, // Analytics should be available to users with READ_ANALYTICS permission
    },
    {
      icon: FileCheck,
      label: t`My Requests`,
      path: ROUTES.DASHBOARD_MY_REQUESTS,
      activePaths: [ROUTES.DASHBOARD_MY_REQUESTS],
      permissionRequired: "CREATE_WORKFLOW_REQUEST" as any,
    },
    {
      icon: Clock,
      label: t`Pending Approvals`,
      path: ROUTES.DASHBOARD_PENDING_APPROVALS,
      activePaths: [ROUTES.DASHBOARD_PENDING_APPROVALS],
      permissionRequired: "APPROVE_WORKFLOW_REQUEST" as any,
    },
    {
      icon: FileText,
      label: t`Workflow Templates`,
      path: ROUTES.DASHBOARD_WORKFLOW_TEMPLATES,
      activePaths: [ROUTES.DASHBOARD_WORKFLOW_TEMPLATES],
      permissionRequired: "MANAGE_WORKFLOW_TEMPLATES" as any,
    },
    {
      icon: Workflow,
      label: t`All Requests`,
      path: ROUTES.DASHBOARD_ALL_REQUESTS,
      activePaths: [ROUTES.DASHBOARD_ALL_REQUESTS],
      permissionRequired: "MANAGE_WORKFLOW_TEMPLATES" as any, // Only admins can see all requests
    },
    {
      icon: Users,
      label: t`Users`,
      path: ROUTES.DASHBOARD_USERS,
      activePaths: [ROUTES.DASHBOARD_USERS, ROUTES.DASHBOARD_USERS_USER],
      permissionRequired: "READ_USERS",
    },
    {
      icon: Network,
      label: t`Organization Hierarchy`,
      path: ROUTES.DASHBOARD_ORGANIZATION_HIERARCHY,
      activePaths: [ROUTES.DASHBOARD_ORGANIZATION_HIERARCHY],
      permissionRequired: "READ_USERS",
    },
    {
      icon: UserCog,
      label: t`Roles`,
      path: ROUTES.DASHBOARD_ROLES,
      activePaths: [ROUTES.DASHBOARD_ROLES, ROUTES.DASHBOARD_ROLES_ROLE],
      permissionRequired: "READ_ROLES",
    },
  ];

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      // Clear any cached data
      window.location.href = ROUTES.AUTH;
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even if server request fails
      window.location.href = ROUTES.AUTH;
    }
  };

  const currentPath = location.pathname.split("/")?.[1]
    ? `/${location.pathname.split("/")?.[1]}`
    : "";

  return (
    <ProtectedRoute>
      <AppShell
        header={{ height: 60 }}
        disabled={isEnabled}
        navbar={{
          width: isMobile ? 250 : 80,
          breakpoint: "sm",
          collapsed: { mobile: !opened },
        }}
      >
        <AppShell.Header className="flex items-center justify-between border-b border-gray-200 px-6">
          <Group gap="md">
            {isMobile && (
              <Burger
                opened={opened}
                onClick={toggle}
                size="sm"
                color="#2563eb"
              />
            )}
            <img className="h-8 w-auto" src={logo} alt="24.kg" />
            {!isMobile && (
              <Text size="lg" fw={600}>
                {t`Partner Neft`}
              </Text>
            )}
          </Group>
          <Group gap="sm">
            <LanguageSwitcher />
            <UserProfile isMobile={isMobile} />
          </Group>
        </AppShell.Header>

        <AppShell.Navbar
          className={
            isMobile
              ? "flex flex-col bg-blue-600 p-4"
              : "flex flex-col bg-blue-600 p-4"
          }
        >
          <div className="mt-2 flex-1">
            <Stack justify="center" gap={isMobile ? 12 : 8}>
              {NavItems.map((item, index) => {
                if (
                  !item?.permissionRequired ||
                  !data?.includes(item?.permissionRequired)
                )
                  return null;
                return (
                  <Link to={item.path} key={item.path}>
                    <NavbarLink
                      icon={item.icon}
                      label={item.label}
                      active={item?.activePaths?.includes(currentPath)}
                      onClick={() => {
                        setActive(index);
                        if (isMobile) {
                          toggle(); // Close mobile nav when item is clicked
                        }
                      }}
                      isMobile={isMobile}
                    />
                  </Link>
                );
              })}
            </Stack>
          </div>

          <Stack justify="center" gap={isMobile ? 12 : 0}>
            <NavbarLink
              icon={ThemeSwitch}
              label={t`Change theme`}
              isMobile={isMobile}
            />
            <NavbarLink
              icon={LogOutIcon}
              label={t`Logout`}
              onClick={handleLogout}
              isMobile={isMobile}
            />
          </Stack>
        </AppShell.Navbar>
        <AppShell.Main>
          <Outlet />
        </AppShell.Main>
      </AppShell>
    </ProtectedRoute>
  );
}
