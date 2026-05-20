import { useState } from "react";
import { Plus, Search, MoreVertical } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  formerClass: string;
  rank: number;
  marksPercent: number;
  currentClass: string;
}

const mockP1Students: Record<string, Student[]> = {
  P1A: [
    { id: "1", name: "Alice Mukamana", formerClass: "P1A", rank: 1, marksPercent: 95, currentClass: "P1A" },
    { id: "2", name: "Bob Nshimiyimana", formerClass: "P1A", rank: 4, marksPercent: 85, currentClass: "P1A" },
  ],
  P1B: [
    { id: "4", name: "David Habimana", formerClass: "P1B", rank: 1, marksPercent: 94, currentClass: "P1B" },
    { id: "5", name: "Emma Iradukunda", formerClass: "P1B", rank: 2, marksPercent: 91, currentClass: "P1B" },
  ],
  P1C: [
    { id: "7", name: "Grace Uwamahoro", formerClass: "P1C", rank: 1, marksPercent: 93, currentClass: "P1C" },
    { id: "8", name: "Henry Tuyishime", formerClass: "P1C", rank: 2, marksPercent: 88, currentClass: "P1C" },
  ],
};

export function MidTermAdjustment() {
  const [selectedPLevel, setSelectedPLevel] = useState("P1");
  const [selectedClass, setSelectedClass] = useState("P1A");
  const [students] = useState<Record<string, Student[]>>(mockP1Students);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentFormerClass, setNewStudentFormerClass] = useState("");
  const [newStudentRank, setNewStudentRank] = useState("");
  const [newStudentMarks, setNewStudentMarks] = useState("");

  const currentStudents = students[selectedClass] || [];
  const filteredStudents = currentStudents.filter((student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMoveStudent = (studentId: string, newClass: string) => {
    toast.success(`Student moved to ${newClass}`);
  };

  const handleAddStudent = () => {
    if (newStudentName && newStudentFormerClass && newStudentRank && newStudentMarks) {
      toast.success(`Student ${newStudentName} added to ${selectedClass}`);
      setShowAddDialog(false);
      setNewStudentName("");
      setNewStudentFormerClass("");
      setNewStudentRank("");
      setNewStudentMarks("");
    } else {
      toast.error("Please fill all fields");
    }
  };

  const getClassBadgeColor = (className: string) => {
    const colors: Record<string, string> = {
      P1A: "#800020",
      P1B: "#001F5B",
      P1C: "#C9A84C",
    };
    return colors[className] || "#9A9A9A";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>
            Mid-Term Class Adjustments
          </h1>
          <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>
            Move students between classes or add new students
          </p>
        </div>
      </div>

      {/* P-Level Selector */}
      <Tabs value={selectedPLevel} onValueChange={setSelectedPLevel}>
        <TabsList>
          <TabsTrigger value="P1">P1</TabsTrigger>
          <TabsTrigger value="P2">P2</TabsTrigger>
          <TabsTrigger value="P3">P3</TabsTrigger>
          <TabsTrigger value="P4">P4</TabsTrigger>
          <TabsTrigger value="P5">P5</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedPLevel}>
          {/* Class Selector */}
          <Card style={{ borderColor: "#E5E5E7" }}>
            <CardContent className="p-6">
              <Tabs value={selectedClass} onValueChange={setSelectedClass}>
                <div className="flex items-center justify-between mb-6">
                  <TabsList>
                    <TabsTrigger value={`${selectedPLevel}A`}>{selectedPLevel}A</TabsTrigger>
                    <TabsTrigger value={`${selectedPLevel}B`}>{selectedPLevel}B</TabsTrigger>
                    <TabsTrigger value={`${selectedPLevel}C`}>{selectedPLevel}C</TabsTrigger>
                  </TabsList>
                  <Button
                    onClick={() => setShowAddDialog(true)}
                    className="h-11"
                    style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
                  >
                    <Plus size={18} className="mr-2" />
                    Add Student to This Class
                  </Button>
                </div>

                <TabsContent value={selectedClass}>
                  {/* Search */}
                  <div className="mb-4 relative">
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

                  {/* Student Table */}
                  <div className="border rounded-lg overflow-hidden" style={{ borderColor: "#E5E5E7" }}>
                    <Table>
                      <TableHeader style={{ backgroundColor: "#001F5B" }}>
                        <TableRow>
                          <TableHead className="text-white">Name</TableHead>
                          <TableHead className="text-white">Former Class</TableHead>
                          <TableHead className="text-white">Rank</TableHead>
                          <TableHead className="text-white">Marks %</TableHead>
                          <TableHead className="text-white">Current Class</TableHead>
                          <TableHead className="text-white text-right">Actions</TableHead>
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
                                style={{ backgroundColor: getClassBadgeColor(student.currentClass) }}
                              >
                                {student.currentClass}
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
                                  <DropdownMenuItem onClick={() => handleMoveStudent(student.id, `${selectedPLevel}A`)}>
                                    Move to {selectedPLevel}A
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleMoveStudent(student.id, `${selectedPLevel}B`)}>
                                    Move to {selectedPLevel}B
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleMoveStudent(student.id, `${selectedPLevel}C`)}>
                                    Move to {selectedPLevel}C
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Student Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Student to {selectedClass}</DialogTitle>
            <DialogDescription>Enter student information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="student-name">Student Name</Label>
              <Input
                id="student-name"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="Full name"
                className="mt-2 h-11"
              />
            </div>
            <div>
              <Label htmlFor="former-class">Former Class</Label>
              <Input
                id="former-class"
                value={newStudentFormerClass}
                onChange={(e) => setNewStudentFormerClass(e.target.value)}
                placeholder="e.g., P1A"
                className="mt-2 h-11"
              />
            </div>
            <div>
              <Label htmlFor="rank">Rank</Label>
              <Input
                id="rank"
                type="number"
                value={newStudentRank}
                onChange={(e) => setNewStudentRank(e.target.value)}
                placeholder="Student rank"
                className="mt-2 h-11"
              />
            </div>
            <div>
              <Label htmlFor="marks">Marks %</Label>
              <Input
                id="marks"
                type="number"
                value={newStudentMarks}
                onChange={(e) => setNewStudentMarks(e.target.value)}
                placeholder="Percentage"
                className="mt-2 h-11"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddStudent}
              style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
            >
              Add Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
