import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { Search, MoreVertical, RotateCcw, ArrowRight, RefreshCw } from "lucide-react";
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
  manuallyChanged: boolean;
}

const mockStudents: Student[] = [
  { id: "1", name: "Alice Mukamana", formerClass: "P1A", rank: 1, marksPercent: 95, newClass: "P2A", manuallyChanged: false },
  { id: "2", name: "Bob Nshimiyimana", formerClass: "P1A", rank: 2, marksPercent: 92, newClass: "P2B", manuallyChanged: false },
  { id: "3", name: "Carol Uwase", formerClass: "P1A", rank: 3, marksPercent: 90, newClass: "P2C", manuallyChanged: false },
  { id: "4", name: "David Habimana", formerClass: "P1B", rank: 1, marksPercent: 94, newClass: "P2A", manuallyChanged: false },
  { id: "5", name: "Emma Iradukunda", formerClass: "P1B", rank: 2, marksPercent: 91, newClass: "P2B", manuallyChanged: false },
  { id: "6", name: "Frank Mugisha", formerClass: "P1B", rank: 3, marksPercent: 89, newClass: "P2C", manuallyChanged: false },
  { id: "7", name: "Grace Uwamahoro", formerClass: "P1C", rank: 1, marksPercent: 93, newClass: "P2A", manuallyChanged: false },
  { id: "8", name: "Henry Tuyishime", formerClass: "P1C", rank: 2, marksPercent: 88, newClass: "P2B", manuallyChanged: false },
  { id: "9", name: "Irene Mutoni", formerClass: "P1C", rank: 3, marksPercent: 87, newClass: "P2C", manuallyChanged: false },
  { id: "10", name: "John Bizimana", formerClass: "P1A", rank: 4, marksPercent: 85, newClass: "P2A", manuallyChanged: false },
];

export function PreviewTable() {
  const { pLevel } = useParams<{ pLevel: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const algorithm = searchParams.get("algorithm") || "balanced-bands";

  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === "all" || student.newClass === classFilter;
    return matchesSearch && matchesClass;
  });

  const manualChangesCount = students.filter((s) => s.manuallyChanged).length;
  const classCounts = students.reduce((acc, student) => {
    acc[student.newClass] = (acc[student.newClass] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleMoveStudent = (studentId: string, newClass: string) => {
    setStudents(students.map(s =>
      s.id === studentId
        ? { ...s, newClass, manuallyChanged: true }
        : s
    ));
    toast.success(`Student moved to ${newClass}`);
  };

  const handleResetChanges = () => {
    setStudents(mockStudents);
    toast.success("All manual changes have been reset");
  };

  const handleRerunAlgorithm = () => {
    navigate(`/dean/algorithm/${pLevel}`);
  };

  const handleSubmit = () => {
    toast.success(`${pLevel} class list submitted for Principal approval`);
    setShowSubmitDialog(false);
    setTimeout(() => {
      navigate("/dean/dashboard");
    }, 1000);
  };

  const getClassBadgeColor = (className: string) => {
    const colors: Record<string, string> = {
      P2A: "#800020",
      P2B: "#001F5B",
      P2C: "#C9A84C",
    };
    return colors[className] || "#9A9A9A";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>
          Preview — {pLevel} New Classes
        </h1>
        <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>
          P-Levels &gt; {pLevel} &gt; Preview
        </p>
      </div>

      {/* Summary Bar */}
      <Card style={{ borderColor: "#E5E5E7", backgroundColor: "#F4F4F6" }}>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {Object.entries(classCounts).map(([className, count]) => (
              <div key={className} className="flex items-center gap-2">
                <span className="font-semibold" style={{ color: "#2C2C2C" }}>
                  {className}:
                </span>
                <span style={{ color: "#9A9A9A" }}>{count} students</span>
              </div>
            ))}
            {manualChangesCount > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: "#C9A84C", color: "#2C2C2C" }}
                >
                  {manualChangesCount} manual changes
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
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
                <SelectItem value="P2A">P2A</SelectItem>
                <SelectItem value="P2B">P2B</SelectItem>
                <SelectItem value="P2C">P2C</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleRerunAlgorithm}
              variant="ghost"
              className="h-11"
              style={{ color: "#800020" }}
            >
              <RefreshCw size={18} className="mr-2" />
              Re-run Algorithm
            </Button>
            {manualChangesCount > 0 && (
              <Button
                onClick={handleResetChanges}
                variant="ghost"
                className="h-11"
                style={{ color: "#C0392B" }}
              >
                <RotateCcw size={18} className="mr-2" />
                Reset All Changes
              </Button>
            )}
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden" style={{ borderColor: "#E5E5E7" }}>
            <Table>
              <TableHeader style={{ backgroundColor: "#001F5B" }}>
                <TableRow>
                  <TableHead className="text-white">Name</TableHead>
                  <TableHead className="text-white">Former Class</TableHead>
                  <TableHead className="text-white">Rank</TableHead>
                  <TableHead className="text-white">Marks %</TableHead>
                  <TableHead className="text-white">New Class</TableHead>
                  <TableHead className="text-white text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student, index) => (
                  <TableRow
                    key={student.id}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F4F4F6",
                      borderLeft: student.manuallyChanged ? "3px solid #C9A84C" : "none",
                    }}
                    className={student.manuallyChanged ? "bg-amber-50" : ""}
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
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleMoveStudent(student.id, "P2A")}>
                            Move to P2A
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleMoveStudent(student.id, "P2B")}>
                            Move to P2B
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleMoveStudent(student.id, "P2C")}>
                            Move to P2C
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

      {/* Footer Actions */}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate(`/dean/algorithm/${pLevel}`)}
          className="h-11"
        >
          Back to Algorithm Selection
        </Button>
        <Button
          onClick={() => setShowSubmitDialog(true)}
          className="h-11"
          style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
        >
          Submit for Approval
          <ArrowRight size={18} className="ml-2" />
        </Button>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit {pLevel} class list for Principal approval?</DialogTitle>
            <DialogDescription>
              Once submitted, you cannot make changes until the Principal reviews.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSubmitDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
