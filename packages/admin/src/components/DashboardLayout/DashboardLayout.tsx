import { useState } from "react";
import {
  AppShell,
  Center,
  Stack,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "../../router/routes";
import ProtectedRoute from "../ProtectedRoute";
import { ImagesIcon, LogOutIcon, UserCog, Users } from "lucide-react";
import logo from "../../assets/logo.png";
import ThemeSwitch from "../ThemeSwith";
import { $Enums } from "../../common/database.types";
import { trpc } from "../../common/trpc";
import { useDashboardLayout } from "../../store/useDashboardLayout";
import classes from "./NavbarMinimal.module.css";
import { authClient } from "../../common/auth";

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
}

function NavbarLink({ icon: Icon, label, active, onClick }: NavbarLinkProps) {
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

const NavItems: NavItemType[] = [
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
  const [opened] = useDisclosure();
  const [_, setActive] = useState(0);

  const { isEnabled } = useDashboardLayout();

  const isMobile = useMediaQuery("(max-width: 767px)");

  const { data } = trpc.admin.users.getMyPermissions.useQuery();

  const handleLogout = () => {
    authClient.signOut();
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
          width: 80,
          breakpoint: "sm",
          collapsed: { mobile: !opened },
        }}
      >
        <AppShell.Navbar className="flex flex-col bg-blue-600 p-4">
          <Center>
            <img className="h-8 w-auto" src={logo} alt="24.kg" />
          </Center>

          <div className="mt-[50px] flex-1">
            <Stack justify="center" gap={8}>
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
                      onClick={() => setActive(index)}
                    />
                  </Link>
                );
              })}
            </Stack>
          </div>

          <Stack justify="center" gap={0}>
            <NavbarLink icon={ThemeSwitch} label="Change theme" />
            <NavbarLink
              icon={LogOutIcon}
              label="Logout"
              onClick={handleLogout}
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
