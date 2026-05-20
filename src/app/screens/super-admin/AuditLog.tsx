import { useState } from "react";
import { Search, Download } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

const auditLogData = [
  {
    timestamp: "2024-05-19 14:32:15",
    user: "John Doe",
    role: "Dean",
    action: "P1 distributed",
    details: "Distributed P1 class list to 3 teachers",
    ipAddress: "192.168.1.45",
  },
  {
    timestamp: "2024-05-19 13:15:42",
    user: "Jane Smith",
    role: "Principal",
    action: "Class list approved",
    details: "Approved P1 class list submitted by Dean",
    ipAddress: "192.168.1.32",
  },
  {
    timestamp: "2024-05-19 11:20:08",
    user: "Admin User",
    role: "Super Admin",
    action: "User created",
    details: "Created new teacher account: Mike Johnson",
    ipAddress: "192.168.1.10",
  },
  {
    timestamp: "2024-05-18 16:45:22",
    user: "John Doe",
    role: "Dean",
    action: "Class list submitted",
    details: "Submitted P1 class list for approval",
    ipAddress: "192.168.1.45",
  },
  {
    timestamp: "2024-05-18 14:12:33",
    user: "Sarah Williams",
    role: "Accountant",
    action: "Enrollment updated",
    details: "Updated feeding enrollment for student ID 12345",
    ipAddress: "192.168.1.67",
  },
  {
    timestamp: "2024-05-18 10:05:18",
    user: "Admin User",
    role: "Super Admin",
    action: "Password reset",
    details: "Reset password for user: david.b@jericho.rw",
    ipAddress: "192.168.1.10",
  },
  {
    timestamp: "2024-05-17 09:30:45",
    user: "John Doe",
    role: "Dean",
    action: "Excel imported",
    details: "Imported P2 student data (95 students)",
    ipAddress: "192.168.1.45",
  },
  {
    timestamp: "2024-05-16 15:22:11",
    user: "Admin User",
    role: "Super Admin",
    action: "Academic year archived",
    details: "Archived academic year 2023-2024",
    ipAddress: "192.168.1.10",
  },
];

export function AuditLog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const filteredLogs = auditLogData.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUser = userFilter === "all" || log.user === userFilter;
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    return matchesSearch && matchesUser && matchesAction;
  });

  const uniqueUsers = Array.from(new Set(auditLogData.map((log) => log.user)));
  const uniqueActions = Array.from(new Set(auditLogData.map((log) => log.action)));

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      "Super Admin": "#800020",
      Dean: "#001F5B",
      Principal: "#C9A84C",
      Teacher: "#1A7F4B",
      Accountant: "#2563EB",
    };
    return colors[role] || "#9A9A9A";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>
            Audit Log
          </h1>
        </div>
        <Button
          variant="outline"
          className="h-11"
          style={{ color: "#800020", borderColor: "#800020" }}
        >
          <Download size={18} className="mr-2" />
          Export CSV
        </Button>
      </div>

      <Card style={{ borderColor: "#E5E5E7" }}>
        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "#9A9A9A" }}
              />
              <Input
                placeholder="Search audit log..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-full md:w-48 h-11">
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {uniqueUsers.map((user) => (
                  <SelectItem key={user} value={user}>
                    {user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full md:w-48 h-11">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden" style={{ borderColor: "#E5E5E7" }}>
            <Table>
              <TableHeader style={{ backgroundColor: "#001F5B" }}>
                <TableRow>
                  <TableHead className="text-white">Timestamp</TableHead>
                  <TableHead className="text-white">User</TableHead>
                  <TableHead className="text-white">Action</TableHead>
                  <TableHead className="text-white">Details</TableHead>
                  <TableHead className="text-white">IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log, index) => (
                  <TableRow
                    key={index}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F4F4F6",
                    }}
                  >
                    <TableCell style={{ color: "#2C2C2C" }} className="font-mono text-sm">
                      {log.timestamp}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div style={{ color: "#2C2C2C" }} className="font-medium">
                          {log.user}
                        </div>
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-white mt-1"
                          style={{ backgroundColor: getRoleBadgeColor(log.role) }}
                        >
                          {log.role}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell style={{ color: "#2C2C2C" }} className="font-medium">
                      {log.action}
                    </TableCell>
                    <TableCell style={{ color: "#9A9A9A" }}>{log.details}</TableCell>
                    <TableCell style={{ color: "#9A9A9A" }} className="font-mono text-sm">
                      {log.ipAddress}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <p style={{ color: "#9A9A9A" }}>No audit log entries found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
