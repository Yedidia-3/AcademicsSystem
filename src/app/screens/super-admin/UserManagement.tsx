import { useState } from "react";
import { Search, Plus, MoreVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

const mockUsers = [
  { id: 1, name: "John Doe", email: "john.doe@jericho.rw", role: "Dean", status: "Active", lastLogin: "2 hours ago" },
  { id: 2, name: "Jane Smith", email: "jane.smith@jericho.rw", role: "Principal", status: "Active", lastLogin: "1 day ago" },
  { id: 3, name: "Mike Johnson", email: "mike.j@jericho.rw", role: "Teacher", status: "Active", lastLogin: "3 hours ago" },
  { id: 4, name: "Sarah Williams", email: "sarah.w@jericho.rw", role: "Accountant", status: "Active", lastLogin: "5 hours ago" },
  { id: 5, name: "David Brown", email: "david.b@jericho.rw", role: "Teacher", status: "Inactive", lastLogin: "1 week ago" },
];

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      "Super Admin": "#800020",
      "Dean": "#001F5B",
      "Principal": "#C9A84C",
      "Teacher": "#1A7F4B",
      "Accountant": "#2563EB",
    };
    return colors[role] || "#9A9A9A";
  };

  const getStatusBadgeColor = (status: string) => {
    return status === "Active" ? "#1A7F4B" : "#9A9A9A";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>Users</h1>
        </div>
        <Button
          className="h-11"
          style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
        >
          <Plus size={18} className="mr-2" />
          Add User
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
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48 h-11">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="Dean">Dean</SelectItem>
                <SelectItem value="Principal">Principal</SelectItem>
                <SelectItem value="Teacher">Teacher</SelectItem>
                <SelectItem value="Accountant">Accountant</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 h-11">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden" style={{ borderColor: "#E5E5E7" }}>
            <Table>
              <TableHeader style={{ backgroundColor: "#001F5B" }}>
                <TableRow>
                  <TableHead className="text-white">Name</TableHead>
                  <TableHead className="text-white">Email</TableHead>
                  <TableHead className="text-white">Role</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Last Login</TableHead>
                  <TableHead className="text-white text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user, index) => (
                  <TableRow
                    key={user.id}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F4F4F6",
                    }}
                    className="hover:bg-[#FFF5F7]"
                  >
                    <TableCell style={{ color: "#2C2C2C" }} className="font-medium">
                      {user.name}
                    </TableCell>
                    <TableCell style={{ color: "#2C2C2C" }}>{user.email}</TableCell>
                    <TableCell>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: getRoleBadgeColor(user.role) }}
                      >
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: getStatusBadgeColor(user.status) }}
                      >
                        {user.status}
                      </span>
                    </TableCell>
                    <TableCell style={{ color: "#9A9A9A" }}>{user.lastLogin}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit user</DropdownMenuItem>
                          <DropdownMenuItem>Reset password</DropdownMenuItem>
                          <DropdownMenuItem>
                            {user.status === "Active" ? "Deactivate" : "Reactivate"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
