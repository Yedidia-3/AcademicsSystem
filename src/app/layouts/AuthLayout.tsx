import { Outlet, useNavigate, useLocation, Navigate } from "react-router";
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import { api } from "../../lib/api";
import { useAutoRefresh } from "../../lib/useAutoRefresh";
import {
  Bell, User, LogOut, Settings, LayoutDashboard, Users, FileText,
  GraduationCap, ClipboardCheck, BookOpen, DollarSign, Menu, X, Share2,
} from "lucide-react";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

const roleDisplayNames: Record<string, string> = {
  super_admin: "Super Admin",
  dean:        "Dean of Studies",
  principal:   "Principal",
  teacher:     "Teacher",
  accountant:  "Accountant",
};

const navItems = {
  super_admin: [
    { icon: LayoutDashboard, label: "Dashboard",     path: "/admin/dashboard" },
    { icon: Users,           label: "Users",         path: "/admin/users" },
    { icon: FileText,        label: "Audit Log",     path: "/admin/audit-log" },
    { icon: GraduationCap,   label: "Academic Year", path: "/admin/academic-year" },
  ],
  dean: [
    { icon: LayoutDashboard, label: "Dashboard",          path: "/dean/dashboard" },
    { icon: GraduationCap,   label: "P-Levels",           path: "/dean/p-levels" },
    { icon: FileText,        label: "Import Data",         path: "/dean/import" },
    { icon: Share2,          label: "Distribution",        path: "/dean/distribution" },
    { icon: Settings,        label: "Mid-Term Adjustments",path: "/dean/mid-term-adjustment" },
  ],
  principal: [
    { icon: LayoutDashboard, label: "Dashboard",         path: "/principal/dashboard" },
    { icon: ClipboardCheck,  label: "Pending Approvals", path: "/principal/approvals" },
  ],
  teacher: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/teacher/dashboard" },
    { icon: BookOpen,        label: "My Classes", path: "/teacher/dashboard" },
  ],
  accountant: [
    { icon: LayoutDashboard, label: "Dashboard",   path: "/accountant/dashboard" },
    { icon: BookOpen,        label: "Class Lists", path: "/accountant/class-lists" },
    { icon: DollarSign,      label: "Enrollments", path: "/accountant/enrollment" },
    { icon: Settings,        label: "Zones",       path: "/accountant/zones" },
    { icon: FileText,        label: "Communiqué",  path: "/accountant/communique" },
  ],
};

export function AuthLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout, isAuthenticated } = useAuth();

  const loadUnread = useCallback(async () => {
    try {
      const res = await api.get<any>('/api/v1/notifications/unread-count');
      const count = typeof res === 'number' ? res : (res?.count ?? res?.data ?? 0);
      setUnreadCount(Number(count) || 0);
    } catch { /* ignore */ }
  }, []);

  // Initial load + reload whenever the route changes (e.g. leaving the
  // notification center after marking read), plus a poll for live updates.
  useEffect(() => { loadUnread(); }, [loadUnread, location.pathname]);
  useAutoRefresh(loadUnread, 15000);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.must_change_password) return <Navigate to="/change-password" replace />;

  const role = user!.role as keyof typeof navItems;
  const currentNavItems = navItems[role] ?? navItems.dean;
  const initials = user!.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const isActive = (path: string) => location.pathname === path;
  const pageTitle = currentNavItems.find(item => location.pathname.startsWith(item.path))?.label ?? "Dashboard";

  const handleLogout = () => { logout(); navigate("/login"); };

  /* ── Shared sidebar nav list ─────────────────────────────────────────────── */
  function NavList({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {currentNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); onNavigate?.(); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-md transition-colors relative text-left"
              style={{ backgroundColor: active ? "rgba(128,0,32,0.18)" : "transparent" }}
            >
              {active && (
                <div className="absolute left-0 top-1 bottom-1 w-1 rounded-r"
                  style={{ backgroundColor: "#800020" }} />
              )}
              <Icon size={20} style={{ color: active ? "#C9A84C" : "rgba(255,255,255,0.55)" }} />
              <span className="font-medium text-sm"
                style={{ color: active ? "#FFFFFF" : "rgba(255,255,255,0.8)" }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    );
  }

  /* ── Shared sidebar header ───────────────────────────────────────────────── */
  function SidebarBrand() {
    return (
      <div className="flex-shrink-0 h-16 flex items-center justify-center border-b px-4"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <div className="text-center">
          <div className="text-white font-bold text-lg leading-tight">Jericho School</div>
          <div className="text-xs" style={{ color: "#C9A84C" }}>Management System</div>
        </div>
      </div>
    );
  }

  /* ── Shared sidebar footer ───────────────────────────────────────────────── */
  function SidebarUser() {
    return (
      <div className="flex-shrink-0 p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 flex-shrink-0" style={{ backgroundColor: "#800020" }}>
            <AvatarFallback className="text-white text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{user!.name}</div>
            <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.5)" }}>
              {roleDisplayNames[role] ?? role}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: "#F4F4F6" }}>

      {/* ── Desktop sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden md:flex md:flex-col w-60 xl:w-64 flex-shrink-0"
        style={{ backgroundColor: "#001F5B" }}>
        <SidebarBrand />
        <NavList />
        <SidebarUser />
      </aside>

      {/* ── Mobile sidebar drawer ────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          {/* Drawer */}
          <aside className="relative w-72 max-w-[85vw] flex flex-col h-full shadow-2xl"
            style={{ backgroundColor: "#001F5B" }}>
            <div className="flex-shrink-0 h-16 flex items-center justify-between px-4 border-b"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <div>
                <div className="text-white font-bold text-lg">Jericho School</div>
                <div className="text-xs" style={{ color: "#C9A84C" }}>Management System</div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1 rounded text-white/70 hover:text-white">
                <X size={22} />
              </button>
            </div>
            <NavList onNavigate={() => setSidebarOpen(false)} />
            <SidebarUser />
          </aside>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Header */}
        <header className="flex-shrink-0 h-14 md:h-16 border-b flex items-center justify-between px-4 md:px-6"
          style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E5E7" }}>
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger — mobile only */}
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1 rounded"
              style={{ color: "#2C2C2C" }}>
              <Menu size={22} />
            </button>
            <h1 className="text-base md:text-xl font-semibold truncate" style={{ color: "#2C2C2C" }}>
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            {/* Notifications */}
            <button onClick={() => navigate("/notifications")}
              className="relative p-2 rounded-md hover:bg-gray-100 transition-colors"
              title={unreadCount > 0 ? `${unreadCount} unread` : 'Notifications'}>
              <Bell size={20} style={{ color: "#C9A84C" }} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full
                  flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: "#C0392B" }}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-gray-100 rounded-md p-1.5 transition-colors">
                  <Avatar className="h-8 w-8 flex-shrink-0" style={{ backgroundColor: "#001F5B" }}>
                    <AvatarFallback className="text-white text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium leading-tight" style={{ color: "#2C2C2C" }}>
                      {user!.name}
                    </div>
                    <div className="text-xs px-1.5 py-0.5 rounded-full inline-block mt-0.5"
                      style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
                      {roleDisplayNames[role] ?? role}
                    </div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" /> Profile Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content — capped at 2xl for 4K screens, scrollable */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="max-w-screen-2xl mx-auto p-4 md:p-6 xl:p-8 w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
