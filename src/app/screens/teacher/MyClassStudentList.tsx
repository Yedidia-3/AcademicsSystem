import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Search, Download, ArrowLeft } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  formerClass: string;
  rank: number;
  marksPercent: number;
  currentClass: string;
}

const mockP2AStudents: Student[] = [
  { id: "1", name: "Alice Mukamana", formerClass: "P1A", rank: 1, marksPercent: 95, currentClass: "P2A" },
  { id: "2", name: "Bob Nshimiyimana", formerClass: "P1B", rank: 2, marksPercent: 94, currentClass: "P2A" },
  { id: "3", name: "Carol Uwase", formerClass: "P1C", rank: 1, marksPercent: 93, currentClass: "P2A" },
  { id: "4", name: "David Habimana", formerClass: "P1A", rank: 4, marksPercent: 91, currentClass: "P2A" },
  { id: "5", name: "Emma Iradukunda", formerClass: "P1B", rank: 3, marksPercent: 90, currentClass: "P2A" },
  { id: "6", name: "Frank Mugisha", formerClass: "P1C", rank: 2, marksPercent: 89, currentClass: "P2A" },
  { id: "7", name: "Grace Uwamahoro", formerClass: "P1A", rank: 5, marksPercent: 88, currentClass: "P2A" },
  { id: "8", name: "Henry Tuyishime", formerClass: "P1B", rank: 6, marksPercent: 87, currentClass: "P2A" },
];

export function MyClassStudentList() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [students] = useState<Student[]>(mockP2AStudents);
  const [searchTerm, setSearchTerm] = useState("");
  const [formerClassFilter, setFormerClassFilter] = useState<string>("all");
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<"excel" | "pdf">("excel");

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFormerClass = formerClassFilter === "all" || student.formerClass === formerClassFilter;
    return matchesSearch && matchesFormerClass;
  });

  const handleDownload = () => {
    toast.success(`Downloading ${classId} class list as ${downloadFormat.toUpperCase()}`);
    setShowDownloadDialog(false);
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
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/teacher/dashboard")}
          style={{ color: "#800020" }}
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>
            {classId} — Student List
          </h1>
          <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>
            My Classes &gt; {classId}
          </p>
        </div>
        <Button
          onClick={() => setShowDownloadDialog(true)}
          variant="outline"
          className="h-11"
          style={{ color: "#800020", borderColor: "#800020" }}
        >
          <Download size={18} className="mr-2" />
          Download
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
                placeholder="Search student name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Select value={formerClassFilter} onValueChange={setFormerClassFilter}>
              <SelectTrigger className="w-full md:w-48 h-11">
                <SelectValue placeholder="Filter by former class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Former Classes</SelectItem>
                <SelectItem value="P1A">P1A</SelectItem>
                <SelectItem value="P1B">P1B</SelectItem>
                <SelectItem value="P1C">P1C</SelectItem>
              </SelectContent>
            </Select>
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
                  <TableHead className="text-white">Current Class</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student, index) => (
                  <TableRow
                    key={student.id}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F4F4F6",
                    }}
                    className="hover:bg-[#FFF5F7]"
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
                        style={{ backgroundColor: "#800020" }}
                      >
                        {student.currentClass}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 text-sm" style={{ color: "#9A9A9A" }}>
            Showing {filteredStudents.length} of {students.length} students
          </div>
        </CardContent>
      </Card>

      {/* Download Dialog */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Download {classId} Class List</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup value={downloadFormat} onValueChange={(value) => setDownloadFormat(value as "excel" | "pdf")}>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50" style={{ borderColor: downloadFormat === "excel" ? "#800020" : "#E5E5E7" }}>
                  <RadioGroupItem value="excel" id="excel" />
                  <Label htmlFor="excel" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded flex items-center justify-center"
                        style={{ backgroundColor: "#1A7F4B20" }}
                      >
                        <svg viewBox="0 0 24 24" className="w-6 h-6" style={{ color: "#1A7F4B" }} fill="currentColor">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: "#2C2C2C" }}>Excel (.xlsx)</p>
                        <p className="text-sm" style={{ color: "#9A9A9A" }}>Spreadsheet format</p>
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50" style={{ borderColor: downloadFormat === "pdf" ? "#800020" : "#E5E5E7" }}>
                  <RadioGroupItem value="pdf" id="pdf" />
                  <Label htmlFor="pdf" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded flex items-center justify-center"
                        style={{ backgroundColor: "#C0392B20" }}
                      >
                        <svg viewBox="0 0 24 24" className="w-6 h-6" style={{ color: "#C0392B" }} fill="currentColor">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: "#2C2C2C" }}>PDF</p>
                        <p className="text-sm" style={{ color: "#9A9A9A" }}>Document format</p>
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDownloadDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDownload}
              style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
            >
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
