import { Users, UserCheck, Calendar, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

const stats = [
  { label: "Total Users", value: "24", icon: Users, color: "#001F5B" },
  { label: "Active Users", value: "21", icon: UserCheck, color: "#1A7F4B" },
  { label: "Current Academic Year", value: "2024-2025", icon: Calendar, color: "#800020" },
  { label: "Last Backup", value: "Today, 3:00 AM", icon: Database, color: "#C9A84C" },
];

const recentActivity = [
  { action: "User created", user: "Admin User", timestamp: "2 hours ago" },
  { action: "P1 distributed", user: "Dean of Studies", timestamp: "5 hours ago" },
  { action: "Class list approved", user: "Principal", timestamp: "1 day ago" },
  { action: "Password reset", user: "Admin User", timestamp: "2 days ago" },
  { action: "Academic year archived", user: "System", timestamp: "3 days ago" },
];

export function SuperAdminDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} style={{ borderColor: "#E5E5E7" }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: "#9A9A9A" }}>{stat.label}</p>
                    <p className="text-3xl font-bold mt-2" style={{ color: "#2C2C2C" }}>
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <Icon size={24} style={{ color: stat.color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: "#2C2C2C" }}>Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => navigate("/admin/users")}
            className="h-24 flex flex-col items-center justify-center gap-2 bg-white"
            variant="outline"
            style={{ borderColor: "#E5E5E7" }}
          >
            <Users size={24} style={{ color: "#001F5B" }} />
            <span style={{ color: "#2C2C2C" }}>Manage Users</span>
          </Button>
          <Button
            onClick={() => navigate("/admin/audit-log")}
            className="h-24 flex flex-col items-center justify-center gap-2 bg-white"
            variant="outline"
            style={{ borderColor: "#E5E5E7" }}
          >
            <Database size={24} style={{ color: "#C9A84C" }} />
            <span style={{ color: "#2C2C2C" }}>View Audit Log</span>
          </Button>
          <Button
            onClick={() => navigate("/admin/academic-year")}
            className="h-24 flex flex-col items-center justify-center gap-2 bg-white"
            variant="outline"
            style={{ borderColor: "#E5E5E7" }}
          >
            <Calendar size={24} style={{ color: "#800020" }} />
            <span style={{ color: "#2C2C2C" }}>Archive Academic Year</span>
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: "#2C2C2C" }}>Recent Activity</h3>
        <div className="border rounded-lg overflow-hidden bg-white" style={{ borderColor: "#E5E5E7" }}>
          <Table>
            <TableHeader style={{ backgroundColor: "#001F5B" }}>
              <TableRow>
                <TableHead className="text-white">Action</TableHead>
                <TableHead className="text-white">User</TableHead>
                <TableHead className="text-white">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.map((activity, index) => (
                <TableRow
                  key={index}
                  style={{
                    backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F4F4F6",
                  }}
                >
                  <TableCell style={{ color: "#2C2C2C" }}>{activity.action}</TableCell>
                  <TableCell style={{ color: "#2C2C2C" }}>{activity.user}</TableCell>
                  <TableCell style={{ color: "#9A9A9A" }}>{activity.timestamp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
