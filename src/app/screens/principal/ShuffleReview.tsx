import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Search, AlertTriangle, CheckCircle, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  formerClass: string;
  rank: number;
  marksPercent: number;
  newClass: string;
}

const mockStudents: Student[] = [
  { id: "1", name: "Alice Mukamana", formerClass: "P2A", rank: 1, marksPercent: 95, newClass: "P3A" },
  { id: "2", name: "Bob Nshimiyimana", formerClass: "P2A", rank: 2, marksPercent: 92, newClass: "P3B" },
  { id: "3", name: "Carol Uwase", formerClass: "P2A", rank: 3, marksPercent: 90, newClass: "P3C" },
  { id: "4", name: "David Habimana", formerClass: "P2B", rank: 1, marksPercent: 94, newClass: "P3A" },
  { id: "5", name: "Emma Iradukunda", formerClass: "P2B", rank: 2, marksPercent: 91, newClass: "P3B" },
  { id: "6", name: "Frank Mugisha", formerClass: "P2B", rank: 3, marksPercent: 89, newClass: "P3C" },
  { id: "7", name: "Grace Uwamahoro", formerClass: "P2C", rank: 1, marksPercent: 93, newClass: "P3A" },
  { id: "8", name: "Henry Tuyishime", formerClass: "P2C", rank: 2, marksPercent: 88, newClass: "P3B" },
];

export function ShuffleReview() {
  const { pLevel } = useParams<{ pLevel: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");

  const filteredStudents = mockStudents.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === "all" || student.newClass === classFilter;
    return matchesSearch && matchesClass;
  });

  const classCounts = mockStudents.reduce((acc, student) => {
    acc[student.newClass] = (acc[student.newClass] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleApprove = () => {
    toast.success(`${pLevel} class list approved`);
    setShowApproveDialog(false);
    setTimeout(() => {
      navigate("/principal/approvals");
    }, 1000);
  };

  const handleReject = () => {
    if (!rejectionNote.trim()) {
      toast.error("Please provide a rejection note");
      return;
    }
    toast.success(`${pLevel} class list rejected. Dean will be notified.`);
    setShowRejectDialog(false);
    setRejectionNote("");
    setTimeout(() => {
      navigate("/principal/approvals");
    }, 1000);
  };

  const getClassBadgeColor = (className: string) => {
    const colors: Record<string, string> = {
      P3A: "#800020",
      P3B: "#001F5B",
      P3C: "#C9A84C",
    };
    return colors[className] || "#9A9A9A";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/principal/approvals")}
          style={{ color: "#800020" }}
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Approvals
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>
          Review — {pLevel} Class List
        </h1>
        <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>
          Approvals &gt; {pLevel}
        </p>
      </div>

      {/* Status Banner */}
      <Card style={{ borderColor: "#D97706", backgroundColor: "#FEF3E8" }}>
        <CardContent className="p-4 flex items-center gap-3">
          <AlertTriangle size={24} style={{ color: "#D97706" }} />
          <div>
            <p className="font-semibold" style={{ color: "#D97706" }}>
              Pending your approval
            </p>
            <p className="text-sm" style={{ color: "#B45309" }}>
              Submitted by Dean of Studies on 2024-05-19
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary Bar */}
      <Card style={{ borderColor: "#E5E5E7", backgroundColor: "#F4F4F6" }}>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-6">
            {Object.entries(classCounts).map(([className, count]) => (
              <div key={className} className="flex items-center gap-2">
                <span className="font-semibold" style={{ color: "#2C2C2C" }}>
                  {className}:
                </span>
                <span style={{ color: "#9A9A9A" }}>{count} students</span>
              </div>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <span className="font-semibold" style={{ color: "#2C2C2C" }}>Algorithm used:</span>
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: "#C9A84C", color: "#2C2C2C" }}
              >
                Balanced Bands
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Table */}
      <Card style={{ borderColor: "#E5E5E7" }}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "#9A9A9A" }}
              />
              <Input
                placeholder="Search student name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full md:w-48 h-11">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="P3A">P3A</SelectItem>
                <SelectItem value="P3B">P3B</SelectItem>
                <SelectItem value="P3C">P3C</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg overflow-hidden" style={{ borderColor: "#E5E5E7" }}>
            <Table>
              <TableHeader style={{ backgroundColor: "#001F5B" }}>
                <TableRow>
                  <TableHead className="text-white">Name</TableHead>
                  <TableHead className="text-white">Former Class</TableHead>
                  <TableHead className="text-white">Rank</TableHead>
                  <TableHead className="text-white">Marks %</TableHead>
                  <TableHead className="text-white">New Class</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student, index) => (
                  <TableRow
                    key={student.id}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F4F4F6",
                    }}
                  >
                    <TableCell style={{ color: "#2C2C2C" }} className="font-medium">
                      {student.name}
                    </TableCell>
                    <TableCell>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: getClassBadgeColor(student.formerClass) }}
                      >
                        {student.formerClass}
                      </span>
                    </TableCell>
                    <TableCell style={{ color: "#2C2C2C" }}>{student.rank}</TableCell>
                    <TableCell style={{ color: "#2C2C2C" }}>{student.marksPercent}%</TableCell>
                    <TableCell>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: getClassBadgeColor(student.newClass) }}
                      >
                        {student.newClass}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate("/principal/approvals")}
          className="h-11"
        >
          Back to Approvals
        </Button>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowRejectDialog(true)}
            className="h-11"
            style={{ backgroundColor: "#C0392B", color: "#FFFFFF" }}
          >
            Reject
          </Button>
          <Button
            onClick={() => setShowApproveDialog(true)}
            className="h-11"
            style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
          >
            Approve
          </Button>
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#1A7F4B20" }}
              >
                <CheckCircle size={32} style={{ color: "#1A7F4B" }} />
              </div>
            </div>
            <DialogTitle className="text-center">Approve {pLevel} Class List?</DialogTitle>
            <DialogDescription className="text-center">
              The Dean will be notified and can proceed with distribution.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#C0392B20" }}
              >
                <AlertTriangle size={32} style={{ color: "#C0392B" }} />
              </div>
            </div>
            <DialogTitle className="text-center">Reject {pLevel} Class List?</DialogTitle>
            <DialogDescription className="text-center">
              Provide feedback for the Dean on what needs to be changed
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-note">Rejection Note (Required)</Label>
            <Textarea
              id="rejection-note"
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Explain what needs to be changed..."
              className="mt-2 min-h-32"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              style={{ backgroundColor: "#C0392B", color: "#FFFFFF" }}
            >
              Reject & Notify Dean
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
