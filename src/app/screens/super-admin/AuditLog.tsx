import { useState, useEffect } from "react";
import { Search, Download, Loader2 } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { api } from "../../../lib/api";
import { toast } from "sonner";

interface AuditEntry {
  timestamp: string;
  user: string;
  role: string;
  action: string;
  details: string;
  ip_address: string;
}

const getRoleBadgeColor = (role: string) => {
  const lower = role?.toLowerCase() ?? '';
  if (lower.includes('super')) return "#800020";
  if (lower.includes('dean')) return "#001F5B";
  if (lower.includes('principal')) return "#C9A84C";
  if (lower.includes('teacher')) return "#1A7F4B";
  if (lower.includes('accountant')) return "#2563EB";
  return "#9A9A9A";
};

export function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<any>('/api/v1/admin/audit-log');
        setEntries(Array.isArray(res) ? res : res.data ?? []);
      } catch {
        toast.error('Failed to load audit log');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredEntries = entries.filter(e => {
    const matchSearch =
      e.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.details?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchUser = userFilter === "all" || e.user === userFilter;
    const matchAction = actionFilter === "all" || e.action === actionFilter;
    return matchSearch && matchUser && matchAction;
  });

  const uniqueUsers = Array.from(new Set(entries.map(e => e.user)));
  const uniqueActions = Array.from(new Set(entries.map(e => e.action)));

  const handleExport = () => {
    const header = "Timestamp,User,Role,Action,Details,IP\n";
    const rows = filteredEntries.map(e =>
      `"${new Date(e.timestamp).toLocaleString()}","${e.user}","${e.role}","${e.action}","${e.details}","${e.ip_address}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'audit-log.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>Audit Log</h1>
        <Button onClick={handleExport} variant="outline" className="h-11"
          style={{ color: "#800020", borderColor: "#800020" }}>
          <Download size={18} className="mr-2" /> Export CSV
        </Button>
      </div>

      <Card style={{ borderColor: "#E5E5E7" }}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9A9A9A" }} />
              <Input placeholder="Search audit log..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-11" />
            </div>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-full md:w-48 h-11"><SelectValue placeholder="Filter by user" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {uniqueUsers.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full md:w-48 h-11"><SelectValue placeholder="Filter by action" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin" size={28} style={{ color: "#001F5B" }} />
            </div>
          ) : (
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
                  {filteredEntries.map((e, index) => (
                    <TableRow key={index} style={{ backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F4F4F6" }}>
                      <TableCell className="font-mono text-sm" style={{ color: "#2C2C2C" }}>
                        {new Date(e.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium" style={{ color: "#2C2C2C" }}>{e.user}</div>
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-white mt-1"
                          style={{ backgroundColor: getRoleBadgeColor(e.role) }}>
                          {e.role}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium" style={{ color: "#2C2C2C" }}>{e.action}</TableCell>
                      <TableCell style={{ color: "#9A9A9A" }}>{e.details}</TableCell>
                      <TableCell className="font-mono text-sm" style={{ color: "#9A9A9A" }}>{e.ip_address}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredEntries.length === 0 && (
                <div className="text-center py-12">
                  <p style={{ color: "#9A9A9A" }}>No audit log entries found</p>
                </div>
              )}
            </div>
          )}
          {!loading && (
            <p className="text-sm mt-3" style={{ color: "#9A9A9A" }}>
              Showing {filteredEntries.length} of {entries.length} entries
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
