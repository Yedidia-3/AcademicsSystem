import { Outlet, useNavigate, useLocation, Navigate } from "react-router";
import { useState } from "react";
import { useAuth } from "../../lib/auth";
import { Bell, User, LogOut, Settings, LayoutDashboard, Users, FileText, GraduationCap, ClipboardCheck, BookOpen, DollarSign, Menu, X } from "lucide-react";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

const roleNames: Record<string, string> = {
  "Super Admin": "Super Admin",
  Dean: "Dean of Studies",
  Principal: "Principal",
  Teacher: "Teacher",
  Accountant: "Accountant",
};

const navItems = {
  "Super Admin": [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: Users, label: "Users", path: "/admin/users" },
    { icon: FileText, label: "Audit Log", path: "/admin/audit-log" },
    { icon: GraduationCap, label: "Academic Year", path: "/admin/academic-year" },
  ],
  Dean: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dean/dashboard" },
    { icon: GraduationCap, label: "P-Levels", path: "/dean/p-levels" },
    { icon: FileText, label: "Import Data", path: "/dean/import" },
    { icon: Settings, label: "Mid-Term Adjustments", path: "/dean/mid-term-adjustment" },
  ],
  Principal: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/principal/dashboard" },
    { icon: ClipboardCheck, label: "Pending Approvals", path: "/principal/approvals" },
  ],
  Teacher: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/teacher/dashboard" },
    { icon: BookOpen, label: "My Classes", path: "/teacher/dashboard" },
  ],
  Accountant: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/accountant/dashboard" },
    { icon: BookOpen, label: "Class Lists", path: "/accountant/class-lists" },
    { icon: DollarSign, label: "Enrollments", path: "/accountant/enrollment" },
    { icon: Settings, label: "Zones", path: "/accountant/zones" },
    { icon: FileText, label: "Communiqué", path: "/accountant/communique" },
  ],
};

const apiRoleToNavRole: Record<string, keyof typeof navItems> = {
  super_admin: "Super Admin",
  dean: "Dean",
  principal: "Principal",
  teacher: "Teacher",
  accountant: "Accountant",
};

export function AuthLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.must_change_password) {
    return <Navigate to="/change-password" replace />;
  }

  const currentRole = apiRoleToNavRole[user!.role] ?? "Dean";

  const displayUser = {
    name: user!.name,
    email: user!.email,
    role: currentRole,
    initials: user!.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
    unreadNotifications: 0,
  };

  const currentNavItems = navItems[currentRole];
  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: "#F4F4F6" }}>
      {/* Sidebar - Desktop */}
      <aside
        className="hidden md:flex md:flex-col md:w-60 flex-shrink-0"
        style={{ backgroundColor: "#001F5B" }}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-center border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <div className="text-center">
            <div className="text-white font-bold text-xl">Jericho School</div>
            <div className="text-sm" style={{ color: "#C9A84C" }}>Management System</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {currentNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-md transition-colors relative"
                style={{
                  backgroundColor: active ? "rgba(128,0,32,0.15)" : "transparent",
                  color: active ? "#FFFFFF" : "#FFFFFF",
                }}
              >
                {active && (
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
                    style={{ backgroundColor: "#800020" }}
                  />
                )}
                <Icon size={20} style={{ color: active ? "#C9A84C" : "#9A9A9A" }} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User info at bottom */}
        <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10" style={{ backgroundColor: "#800020" }}>
              <AvatarFallback className="text-white">{displayUser.initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{displayUser.name}</div>
              <div className="text-xs" style={{ color: "#9A9A9A" }}>{displayUser.role}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,31,91,0.5)" }}
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className="absolute left-0 top-0 bottom-0 w-60 flex flex-col"
            style={{ backgroundColor: "#001F5B" }}
          >
            {/* Same content as desktop sidebar */}
            <div className="h-16 flex items-center justify-between px-4 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <div>
                <div className="text-white font-bold text-lg">Jericho School</div>
                <div className="text-xs" style={{ color: "#C9A84C" }}>Management System</div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-white">
                <X size={24} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {currentNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setSidebarOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-md transition-colors relative"
                    style={{
                      backgroundColor: active ? "rgba(128,0,32,0.15)" : "transparent",
                      color: "#FFFFFF",
                    }}
                  >
                    {active && (
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
                        style={{ backgroundColor: "#800020" }}
                      />
                    )}
                    <Icon size={20} style={{ color: active ? "#C9A84C" : "#9A9A9A" }} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className="h-16 flex-shrink-0 border-b flex items-center justify-between px-6"
          style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E5E7" }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden"
              style={{ color: "#2C2C2C" }}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold" style={{ color: "#2C2C2C" }}>
              {currentNavItems.find(item => isActive(item.path))?.label || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <button
              onClick={() => navigate("/notifications")}
              className="relative p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Bell size={20} style={{ color: "#C9A84C" }} />
              {displayUser.unreadNotifications > 0 && (
                <span
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-white text-xs flex items-center justify-center"
                  style={{ backgroundColor: "#800020" }}
                >
                  {displayUser.unreadNotifications}
                </span>
              )}
            </button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 hover:bg-gray-100 rounded-md p-2 transition-colors">
                  <Avatar className="h-8 w-8" style={{ backgroundColor: "#001F5B" }}>
                    <AvatarFallback className="text-white text-sm">{displayUser.initials}</AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium" style={{ color: "#2C2C2C" }}>{displayUser.name}</div>
                    <div
                      className="text-xs px-2 py-0.5 rounded-full inline-block"
                      style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
                    >
                      {roleNames[displayUser.role] || displayUser.role}
                    </div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
