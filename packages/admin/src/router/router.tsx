import { createBrowserRouter, Navigate } from "react-router-dom";
import { Prisma } from "server/src/common/database-types";
import { trpc } from "../common/trpc";
import DashboardLayout from "../components/DashboardLayout/DashboardLayout";
import ProtectedRoute from "../components/ProtectedRoute";
/* Pages */
import AuthPage from "../pages/auth/auth.page";
import AnalyticsPage from "../pages/dashboard/analytics/analytics.page";
import GalleryPage from "../pages/dashboard/gallery/gallery.page";
import RolePage from "../pages/dashboard/roles/role";
import RolesPage from "../pages/dashboard/roles/roles";
import OrganizationHierarchyPage from "../pages/dashboard/users/organization-hierarchy.page";
import UserPage from "../pages/dashboard/users/user.page";
import UsersPage from "../pages/dashboard/users/users.page";
import AllRequestsPage from "../pages/dashboard/workflows/all-requests.page";
import MyRequestsPage from "../pages/dashboard/workflows/my-requests.page";
import NewRequestPage from "../pages/dashboard/workflows/new-request.page";
import { NewWorkflowTemplatePage } from "../pages/dashboard/workflows/new-workflow-template.page";
import PendingApprovalsPage from "../pages/dashboard/workflows/pending-approvals.page";
import RaiseRequestPage from "../pages/dashboard/workflows/raise-request.page";
import WorkflowRequestPage from "../pages/dashboard/workflows/workflow-request.page";
import WorkflowTemplatePage from "../pages/dashboard/workflows/workflow-template.page";
import WorkflowTemplatesPage from "../pages/dashboard/workflows/workflow-templates.page";
import { ROUTES } from "./routes";

// Component to handle conditional default redirect based on user permissions
function DefaultRedirect() {
  const { data: permissions, isLoading } =
    trpc.admin.users.getMyPermissions.useQuery();

  if (isLoading) {
    return null; // Show nothing while loading
  }

  // If user has READ_ANALYTICS permission, redirect to analytics (admin user)
  if (permissions?.includes("READ_ANALYTICS" as Prisma.PermissionOperation)) {
    return <Navigate to={ROUTES.DASHBOARD_ANALYTICS} replace />;
  }

  // Otherwise redirect to my-requests (regular user)
  return <Navigate to={ROUTES.DASHBOARD_MY_REQUESTS} replace />;
}

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
        path: ROUTES.DASHBOARD_ANALYTICS,
        element: <AnalyticsPage />,
      },
      {
        path: "",
        element: <DefaultRedirect />,
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
      {
        path: ROUTES.DASHBOARD_ORGANIZATION_HIERARCHY,
        element: <OrganizationHierarchyPage />,
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
        path: ROUTES.NEW_WORKFLOW_TEMPLATE,
        element: <NewWorkflowTemplatePage />,
      },
      {
        path: `${ROUTES.DASHBOARD_WORKFLOW_TEMPLATE}/:id`,
        element: <WorkflowTemplatePage />,
      },
      {
        path: ROUTES.DASHBOARD_ALL_REQUESTS,
        element: <AllRequestsPage />,
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
        path: `${ROUTES.DASHBOARD_NEW_REQUEST}/:templateId`,
        element: <NewRequestPage />,
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
