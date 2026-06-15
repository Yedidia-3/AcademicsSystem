import { useEffect, useState } from "react";
import { Users, UserCheck, Calendar, Loader2 } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router";
import { api } from "../../../lib/api";

interface UserRow { id: number; name: string; role: string; status: string; last_login: string | null; }
interface AcademicYear { id: number; name: string; status: string; }

function timeAgo(date: string | null) {
  if (!date) return "Never";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<any>('/api/v1/admin/users'),
      api.get<any>('/api/v1/admin/academic-years'),
    ]).then(([u, y]) => {
      setUsers(Array.isArray(u) ? u : u.data ?? []);
      setYears(Array.isArray(y) ? y : y.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const activeYear = years.find(y => y.status === 'active');
  const activeUsers = users.filter(u => u.status === 'active').length;
  const recentLogins = users
    .filter(u => u.last_login)
    .sort((a, b) => new Date(b.last_login!).getTime() - new Date(a.last_login!).getTime())
    .slice(0, 5);

  const stats = [
    { label: "Total Users", value: loading ? "—" : String(users.length), icon: Users, color: "#001F5B" },
    { label: "Active Users", value: loading ? "—" : String(activeUsers), icon: UserCheck, color: "#1A7F4B" },
    { label: "Academic Year", value: loading ? "—" : (activeYear?.name ?? "None set"), icon: Calendar, color: "#800020" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} style={{ borderColor: "#E5E5E7" }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: "#9A9A9A" }}>{stat.label}</p>
                    <p className="text-3xl font-bold mt-2" style={{ color: "#2C2C2C" }}>{stat.value}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}20` }}>
                    <Icon size={24} style={{ color: stat.color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card style={{ borderColor: "#E5E5E7" }}>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4" style={{ color: "#2C2C2C" }}>Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate('/admin/users')} style={{ backgroundColor: "#800020", color: "#fff" }}>
              Manage Users
            </Button>
            <Button onClick={() => navigate('/admin/academic-year')} variant="outline">
              Academic Years
            </Button>
            <Button onClick={() => navigate('/admin/audit-log')} variant="outline">
              Audit Log
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card style={{ borderColor: "#E5E5E7" }}>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4" style={{ color: "#2C2C2C" }}>Recent Logins</h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin" size={28} style={{ color: "#001F5B" }} />
            </div>
          ) : recentLogins.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "#9A9A9A" }}>No login activity yet</p>
          ) : (
            <div className="divide-y" style={{ borderColor: "#E5E5E7" }}>
              {recentLogins.map((u) => (
                <div key={u.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm" style={{ color: "#2C2C2C" }}>{u.name}</p>
                    <p className="text-xs capitalize" style={{ color: "#9A9A9A" }}>{u.role.replace('_', ' ')}</p>
                  </div>
                  <p className="text-xs" style={{ color: "#9A9A9A" }}>{timeAgo(u.last_login)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
