import { useState } from "react";
import { Search, CheckCircle } from "lucide-react";
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
import { useNavigate } from "react-router";

interface Approval {
  id: string;
  pLevel: string;
  submittedBy: string;
  submittedDate: string;
  status: string;
  statusColor: string;
}

const mockApprovals: Approval[] = [
  { id: "1", pLevel: "P3", submittedBy: "John Doe", submittedDate: "2024-05-19", status: "Pending", statusColor: "#D97706" },
  { id: "2", pLevel: "P4", submittedBy: "John Doe", submittedDate: "2024-05-18", status: "Pending", statusColor: "#D97706" },
  { id: "3", pLevel: "P1", submittedBy: "John Doe", submittedDate: "2024-05-15", status: "Approved", statusColor: "#1A7F4B" },
  { id: "4", pLevel: "P2", submittedBy: "John Doe", submittedDate: "2024-05-14", status: "Approved", statusColor: "#1A7F4B" },
  { id: "5", pLevel: "P5", submittedBy: "John Doe", submittedDate: "2024-05-10", status: "Rejected", statusColor: "#C0392B" },
];

export function PendingApprovals() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredApprovals = mockApprovals.filter((approval) => {
    const matchesSearch = approval.pLevel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || approval.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = mockApprovals.filter(a => a.status === "Pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>
          Pending Approvals
        </h1>
        <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>
          {pendingCount} approval{pendingCount !== 1 ? "s" : ""} pending review
        </p>
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
                placeholder="Search P-Level..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 h-11">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden" style={{ borderColor: "#E5E5E7" }}>
            <Table>
              <TableHeader style={{ backgroundColor: "#001F5B" }}>
                <TableRow>
                  <TableHead className="text-white">P-Level</TableHead>
                  <TableHead className="text-white">Submitted By</TableHead>
                  <TableHead className="text-white">Submitted Date</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApprovals.map((approval, index) => (
                  <TableRow
                    key={approval.id}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F4F4F6",
                    }}
                  >
                    <TableCell style={{ color: "#2C2C2C" }} className="font-bold text-lg">
                      {approval.pLevel}
                    </TableCell>
                    <TableCell style={{ color: "#2C2C2C" }}>
                      <div>
                        <p className="font-medium">{approval.submittedBy}</p>
                        <p className="text-sm" style={{ color: "#9A9A9A" }}>Dean of Studies</p>
                      </div>
                    </TableCell>
                    <TableCell style={{ color: "#9A9A9A" }}>{approval.submittedDate}</TableCell>
                    <TableCell>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: approval.statusColor }}
                      >
                        {approval.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {approval.status === "Pending" ? (
                        <Button
                          onClick={() => navigate(`/principal/review/${approval.pLevel}`)}
                          size="sm"
                          style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
                        >
                          Review
                        </Button>
                      ) : (
                        <Button
                          onClick={() => navigate(`/principal/review/${approval.pLevel}`)}
                          variant="ghost"
                          size="sm"
                          style={{ color: "#800020" }}
                        >
                          View
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredApprovals.length === 0 && (
            <div className="text-center py-16">
              <CheckCircle size={64} className="mx-auto mb-4" style={{ color: "#1A7F4B" }} />
              <h3 className="text-xl font-semibold mb-2" style={{ color: "#2C2C2C" }}>
                No pending approvals
              </h3>
              <p style={{ color: "#9A9A9A" }}>All caught up!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
