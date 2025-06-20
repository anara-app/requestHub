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
import WorkflowTemplatesPage from "../pages/dashboard/workflows/workflow-templates.page";
import WorkflowRequestsPage from "../pages/dashboard/workflows/workflow-requests.page";
import WorkflowRequestPage from "../pages/dashboard/workflows/workflow-request.page";
import RaiseRequestPage from "../pages/dashboard/workflows/raise-request.page";
import MyRequestsPage from "../pages/dashboard/workflows/my-requests.page";
import PendingApprovalsPage from "../pages/dashboard/workflows/pending-approvals.page";

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
        element: <Navigate to={ROUTES.DASHBOARD_MY_REQUESTS} />,
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

      /* Workflows */
      {
        path: ROUTES.DASHBOARD_WORKFLOW_TEMPLATES,
        element: <WorkflowTemplatesPage />,
      },
      {
        path: ROUTES.DASHBOARD_WORKFLOW_REQUESTS,
        element: <WorkflowRequestsPage />,
      },
      {
        path: `${ROUTES.DASHBOARD_WORKFLOW_REQUEST}/:id`,
        element: <WorkflowRequestPage />,
      },
      {
        path: ROUTES.DASHBOARD_RAISE_REQUEST,
        element: <RaiseRequestPage />,
      },
      {
        path: ROUTES.DASHBOARD_MY_REQUESTS,
        element: <MyRequestsPage />,
      },
      {
        path: ROUTES.DASHBOARD_PENDING_APPROVALS,
        element: <PendingApprovalsPage />,
      },
    ],
  },
  {
    path: "*",
    element: <AuthPage />,
  },
]);
