import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Plus, MoreVertical, Users, Upload, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";

interface ClassData {
  id: string;
  name: string;
  teacher: string | null;
  studentCount: number;
  status: string;
  statusColor: string;
}

const mockClasses: Record<string, ClassData[]> = {
  P1: [
    { id: "P1A", name: "P1A", teacher: "John Smith", studentCount: 32, status: "Distributed", statusColor: "#1A7F4B" },
    { id: "P1B", name: "P1B", teacher: "Mary Johnson", studentCount: 31, status: "Distributed", statusColor: "#1A7F4B" },
    { id: "P1C", name: "P1C", teacher: "David Lee", studentCount: 32, status: "Distributed", statusColor: "#1A7F4B" },
  ],
  P2: [
    { id: "P2A", name: "P2A", teacher: "Sarah Williams", studentCount: 30, status: "Active", statusColor: "#1A7F4B" },
    { id: "P2B", name: "P2B", teacher: "Mike Brown", studentCount: 31, status: "Active", statusColor: "#1A7F4B" },
    { id: "P2C", name: "P2C", teacher: null, studentCount: 31, status: "Pending", statusColor: "#D97706" },
  ],
};

export function ClassManagement() {
  const { pLevel } = useParams<{ pLevel: string }>();
  const navigate = useNavigate();
  const [classes] = useState<ClassData[]>(mockClasses[pLevel || "P1"] || []);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [newClassName, setNewClassName] = useState("");

  const handleAddClass = () => {
    if (newClassName.trim()) {
      toast.success(`Class ${newClassName} created successfully`);
      setShowAddDialog(false);
      setNewClassName("");
    }
  };

  const handleAssignTeacher = () => {
    if (selectedClass) {
      toast.success(`Teacher assigned to ${selectedClass.name} successfully`);
      setShowAssignDialog(false);
      setSelectedClass(null);
    }
  };

  const handleDelete = (classItem: ClassData) => {
    if (classItem.studentCount > 0) {
      toast.error("Cannot delete class with students. Redistribute students first.");
    } else {
      toast.success(`Class ${classItem.name} deleted successfully`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dean/p-levels")}
          style={{ color: "#800020" }}
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to P-Levels
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>
            {pLevel} — Classes
          </h1>
          <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>
            Manage classes for {pLevel}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate("/dean/import")}
            variant="outline"
            className="h-11"
            style={{ color: "#800020", borderColor: "#800020" }}
          >
            <Upload size={18} className="mr-2" />
            Import Excel
          </Button>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="h-11"
            style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
          >
            <Plus size={18} className="mr-2" />
            Add Class
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classItem) => (
          <Card key={classItem.id} style={{ borderColor: "#E5E5E7" }}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold" style={{ color: "#2C2C2C" }}>
                    {classItem.name}
                  </h3>
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white mt-2"
                    style={{ backgroundColor: classItem.statusColor }}
                  >
                    {classItem.status}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical size={18} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Students</DropdownMenuItem>
                    <DropdownMenuItem>Edit Class</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(classItem)} className="text-red-600">
                      Delete Class
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm mb-1" style={{ color: "#9A9A9A" }}>
                    Assigned Teacher
                  </p>
                  {classItem.teacher ? (
                    <p className="font-medium" style={{ color: "#2C2C2C" }}>
                      {classItem.teacher}
                    </p>
                  ) : (
                    <p className="italic" style={{ color: "#9A9A9A" }}>
                      Unassigned
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#80002020" }}
                  >
                    <Users size={20} style={{ color: "#800020" }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: "#9A9A9A" }}>
                      Students
                    </p>
                    <p className="text-xl font-bold" style={{ color: "#2C2C2C" }}>
                      {classItem.studentCount}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  onClick={() => {
                    setSelectedClass(classItem);
                    setShowAssignDialog(true);
                  }}
                  className="w-full"
                  variant="outline"
                  style={{ color: "#800020", borderColor: "#800020" }}
                >
                  {classItem.teacher ? "Change Teacher" : "Assign Teacher"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Class Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
            <DialogDescription>Create a new class for {pLevel}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="class-name">Class Name</Label>
              <Input
                id="class-name"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder={`e.g., ${pLevel}D`}
                className="mt-2 h-11"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddClass}
              style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
            >
              Add Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Teacher Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Teacher to {selectedClass?.name}</DialogTitle>
            <DialogDescription>Select a teacher for this class</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="teacher">Teacher</Label>
              <Input
                id="teacher"
                placeholder="Search teachers..."
                className="mt-2 h-11"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignTeacher}
              style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
