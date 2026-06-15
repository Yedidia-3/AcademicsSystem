import { createBrowserRouter, Navigate } from "react-router";
import { AppError } from "./screens/shared/AppError";
import { LoginScreen } from "./screens/shared/LoginScreen";
import { ChangePasswordScreen } from "./screens/shared/ChangePasswordScreen";
import { AuthLayout } from "./layouts/AuthLayout";
import { NotFoundScreen } from "./screens/shared/NotFoundScreen";
import { UnauthorizedScreen } from "./screens/shared/UnauthorizedScreen";
import { ProfileSettings } from "./screens/shared/ProfileSettings";
import { NotificationCenter } from "./screens/shared/NotificationCenter";

// Super Admin screens
import { SuperAdminDashboard } from "./screens/super-admin/SuperAdminDashboard";
import { UserManagement } from "./screens/super-admin/UserManagement";
import { AuditLog } from "./screens/super-admin/AuditLog";
import { AcademicYearManagement } from "./screens/super-admin/AcademicYearManagement";

// Dean screens
import { DeanDashboard } from "./screens/dean/DeanDashboard";
import { PLevelManagement } from "./screens/dean/PLevelManagement";
import { ClassManagement } from "./screens/dean/ClassManagement";
import { ExcelImport } from "./screens/dean/ExcelImport";
import { AlgorithmSelection } from "./screens/dean/AlgorithmSelection";
import { PreviewTable } from "./screens/dean/PreviewTable";
import { DistributionScreen } from "./screens/dean/DistributionScreen";
import { DistributionList } from "./screens/dean/DistributionList";
import { MidTermAdjustment } from "./screens/dean/MidTermAdjustment";

// Principal screens
import { PrincipalDashboard } from "./screens/principal/PrincipalDashboard";
import { PendingApprovals } from "./screens/principal/PendingApprovals";
import { ShuffleReview } from "./screens/principal/ShuffleReview";

// Teacher screens
import { TeacherDashboard } from "./screens/teacher/TeacherDashboard";
import { MyClasses } from "./screens/teacher/MyClasses";
import { MyClassStudentList } from "./screens/teacher/MyClassStudentList";
import { AttendanceScreen } from "./screens/teacher/AttendanceScreen";
import { AttendanceHistory } from "./screens/teacher/AttendanceHistory";

// Accountant screens
import { AccountantDashboard } from "./screens/accountant/AccountantDashboard";
import { ClassListsSelector } from "./screens/accountant/ClassListsSelector";
import { StudentListPerClass } from "./screens/accountant/StudentListPerClass";
import { EnrollmentServiceSelector } from "./screens/accountant/EnrollmentServiceSelector";
import { FeedingEnrollment } from "./screens/accountant/FeedingEnrollment";
import { TransportEnrollment } from "./screens/accountant/TransportEnrollment";
import { ZoneManagement } from "./screens/accountant/ZoneManagement";
import { CommuniqueGenerator } from "./screens/accountant/CommuniqueGenerator";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginScreen,
    ErrorBoundary: AppError,
  },
  {
    path: "/change-password",
    Component: ChangePasswordScreen,
    ErrorBoundary: AppError,
  },
  {
    path: "/",
    Component: AuthLayout,
    ErrorBoundary: AppError,
    children: [
      {
        index: true,
        element: <Navigate to="/login" replace />,
      },
      // Super Admin routes
      {
        path: "admin/dashboard",
        Component: SuperAdminDashboard,
      },
      {
        path: "admin/users",
        Component: UserManagement,
      },
      {
        path: "admin/audit-log",
        Component: AuditLog,
      },
      {
        path: "admin/academic-year",
        Component: AcademicYearManagement,
      },

      // Dean routes
      {
        path: "dean/dashboard",
        Component: DeanDashboard,
      },
      {
        path: "dean/p-levels",
        Component: PLevelManagement,
      },
      {
        path: "dean/p-levels/:pLevelId/classes",
        Component: ClassManagement,
      },
      {
        path: "dean/import",
        Component: ExcelImport,
      },
      {
        path: "dean/algorithm/:pLevelId",
        Component: AlgorithmSelection,
      },
      {
        path: "dean/preview/:sessionId",
        Component: PreviewTable,
      },
      {
        path: "dean/distribution",
        Component: DistributionList,
      },
      {
        path: "dean/distribute/:sessionId",
        Component: DistributionScreen,
      },
      {
        path: "dean/mid-term-adjustment",
        Component: MidTermAdjustment,
      },

      // Principal routes
      {
        path: "principal/dashboard",
        Component: PrincipalDashboard,
      },
      {
        path: "principal/approvals",
        Component: PendingApprovals,
      },
      {
        path: "principal/review/:sessionId",
        Component: ShuffleReview,
      },

      // Teacher routes
      {
        path: "teacher/dashboard",
        Component: TeacherDashboard,
      },
      {
        path: "teacher/my-classes",
        Component: MyClasses,
      },
      {
        path: "teacher/class/:classId",
        Component: MyClassStudentList,
      },
      {
        path: "teacher/class/:classId/attendance",
        Component: AttendanceScreen,
      },
      {
        path: "teacher/attendance-history",
        Component: AttendanceHistory,
      },

      // Accountant routes
      {
        path: "accountant/dashboard",
        Component: AccountantDashboard,
      },
      {
        path: "accountant/class-lists",
        Component: ClassListsSelector,
      },
      {
        path: "accountant/class-lists/:pLevelId",
        Component: StudentListPerClass,
      },
      {
        path: "accountant/enrollment",
        Component: EnrollmentServiceSelector,
      },
      {
        path: "accountant/enrollment/feeding",
        Component: FeedingEnrollment,
      },
      {
        path: "accountant/enrollment/transport",
        Component: TransportEnrollment,
      },
      {
        path: "accountant/zones",
        Component: ZoneManagement,
      },
      {
        path: "accountant/communique",
        Component: CommuniqueGenerator,
      },

      // Shared routes
      {
        path: "profile",
        Component: ProfileSettings,
      },
      {
        path: "notifications",
        Component: NotificationCenter,
      },
      {
        path: "403",
        Component: UnauthorizedScreen,
      },
      {
        path: "*",
        Component: NotFoundScreen,
      },
    ],
  },
]);
