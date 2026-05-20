import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
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

interface ClassAssignment {
  className: string;
  studentCount: number;
  assignedTeacher: string | null;
}

const mockClasses: ClassAssignment[] = [
  { className: "P2A", studentCount: 32, assignedTeacher: null },
  { className: "P2B", studentCount: 31, assignedTeacher: null },
  { className: "P2C", studentCount: 32, assignedTeacher: null },
];

const mockTeachers = [
  "John Smith",
  "Mary Johnson",
  "David Lee",
  "Sarah Williams",
  "Mike Brown",
  "Emma Davis",
];

export function DistributionScreen() {
  const { pLevel } = useParams<{ pLevel: string }>();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassAssignment[]>(mockClasses);
  const [showDistributeDialog, setShowDistributeDialog] = useState(false);

  const allTeachersAssigned = classes.every((c) => c.assignedTeacher !== null);

  const handleAssignTeacher = (className: string, teacher: string) => {
    setClasses(classes.map(c =>
      c.className === className
        ? { ...c, assignedTeacher: teacher }
        : c
    ));
    toast.success(`Teacher assigned to ${className}`);
  };

  const handleDistribute = () => {
    toast.success(`${pLevel} distributed successfully`);
    setShowDistributeDialog(false);
    setTimeout(() => {
      navigate("/dean/dashboard");
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dean/dashboard")}
          style={{ color: "#800020" }}
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>
          Distribute — {pLevel} Classes
        </h1>
      </div>

      {/* Status Banner */}
      <Card style={{ borderColor: "#1A7F4B", backgroundColor: "#F0FDF4" }}>
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle size={24} style={{ color: "#1A7F4B" }} />
          <div>
            <p className="font-semibold" style={{ color: "#1A7F4B" }}>
              {pLevel} has been approved by the Principal
            </p>
            <p className="text-sm" style={{ color: "#15803D" }}>
              Ready to distribute to teachers and accountant
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Teacher Assignment Section */}
      <Card style={{ borderColor: "#E5E5E7" }}>
        <CardHeader>
          <CardTitle>Assign Teachers Before Distributing</CardTitle>
        </CardHeader>
        <CardContent>
          {!allTeachersAssigned && (
            <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: "#FEF3E8", borderColor: "#D97706" }}>
              <p className="text-sm" style={{ color: "#D97706" }}>
                <strong>Warning:</strong> All classes must have a teacher before distributing
              </p>
            </div>
          )}

          <div className="border rounded-lg overflow-hidden" style={{ borderColor: "#E5E5E7" }}>
            <Table>
              <TableHeader style={{ backgroundColor: "#001F5B" }}>
                <TableRow>
                  <TableHead className="text-white">Class</TableHead>
                  <TableHead className="text-white">Students</TableHead>
                  <TableHead className="text-white">Assigned Teacher</TableHead>
                  <TableHead className="text-white">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((classItem, index) => (
                  <TableRow
                    key={classItem.className}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F4F4F6",
                    }}
                  >
                    <TableCell style={{ color: "#2C2C2C" }} className="font-semibold">
                      {classItem.className}
                    </TableCell>
                    <TableCell style={{ color: "#2C2C2C" }}>{classItem.studentCount}</TableCell>
                    <TableCell>
                      {classItem.assignedTeacher ? (
                        <span className="font-medium" style={{ color: "#1A7F4B" }}>
                          {classItem.assignedTeacher}
                        </span>
                      ) : (
                        <span className="italic" style={{ color: "#9A9A9A" }}>
                          Unassigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={classItem.assignedTeacher || ""}
                        onValueChange={(teacher) => handleAssignTeacher(classItem.className, teacher)}
                      >
                        <SelectTrigger className="w-48 h-9">
                          <SelectValue placeholder="Select teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockTeachers.map((teacher) => (
                            <SelectItem key={teacher} value={teacher}>
                              {teacher}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate("/dean/dashboard")}
          className="h-11"
        >
          Back
        </Button>
        <Button
          onClick={() => setShowDistributeDialog(true)}
          disabled={!allTeachersAssigned}
          className="h-11"
          style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
        >
          Distribute Classes
        </Button>
      </div>

      {/* Distribution Confirmation Dialog */}
      <Dialog open={showDistributeDialog} onOpenChange={setShowDistributeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Distribute {pLevel} class list?</DialogTitle>
            <DialogDescription>
              This will send class lists to assigned teachers and the accountant. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDistributeDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDistribute}
              style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
            >
              Distribute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
