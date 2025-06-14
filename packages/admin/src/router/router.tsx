import { createBrowserRouter, Navigate } from "react-router-dom";
import { ROUTES } from "./routes";
import DashboardLayout from "../components/DashboardLayout/DashboardLayout";
/* Pages */
import AuthPage from "../pages/auth/auth.page";
import UsersPage from "../pages/dashboard/users/users.page";
import UserPage from "../pages/dashboard/users/user.page";
import RolesPage from "../pages/dashboard/roles/roles";
import RolePage from "../pages/dashboard/roles/role";
import GalleryPage from "../pages/dashboard/gallery/gallery.page";

export const router = createBrowserRouter([
  {
    path: ROUTES.AUTH,
    element: <AuthPage />,
  },
  {
    path: ROUTES.DASHBOARD_HOME,
    element: <DashboardLayout />,
    children: [
      {
        path: "",
        element: <Navigate to={ROUTES.DASHBOARD_USERS} />,
      },
      /* Users */
      {
        path: ROUTES.DASHBOARD_USERS,
        element: <UsersPage />,
      },
      {
        path: `${ROUTES.DASHBOARD_USERS_USER}/:id?`,
        element: <UserPage />,
      },
      /* Roles */
      {
        path: ROUTES.DASHBOARD_ROLES,
        element: <RolesPage />,
      },
      {
        path: `${ROUTES.DASHBOARD_ROLES_ROLE}/:id?`,
        element: <RolePage />,
      },

      /* Gallery */
      {
        path: ROUTES.DASHBOARD_GALLERY,
        element: <GalleryPage />,
      },
    ],
  },
  {
    path: "*",
    element: <AuthPage />,
  },
]);
