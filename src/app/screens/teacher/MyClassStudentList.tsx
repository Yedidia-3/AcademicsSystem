import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { Search, Download, ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Label } from "../../components/ui/label";
import { api } from "../../../lib/api";
import { toast } from "sonner";

interface Student {
  id: number;
  name: string;
  former_class: string | null;
  rank: number | null;
  marks_percentage: number | null;
  current_class_id: number;
}

const CLASS_COLORS = ["#800020", "#001F5B", "#C9A84C", "#1A7F4B", "#2563EB", "#6B21A8"];

export function MyClassStudentList() {
  const { classId } = useParams<{ classId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const className = searchParams.get('name') ?? `Class ${classId}`;

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [formerClassFilter, setFormerClassFilter] = useState<string>("all");
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<"csv" | "pdf">("csv");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<any>(`/api/v1/academics/classes/${classId}/students`);
        setStudents(Array.isArray(res) ? res : res.data ?? []);
      } catch {
        toast.error('Failed to load students');
      } finally {
        setLoading(false);
      }
    };
    if (classId) load();
  }, [classId]);

  const formerClasses = Array.from(new Set(students.map(s => s.former_class).filter(Boolean))) as string[];
  const colorMap: Record<string, string> = {};
  formerClasses.forEach((c, i) => { colorMap[c] = CLASS_COLORS[i % CLASS_COLORS.length]; });

  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFormer = formerClassFilter === "all" || s.former_class === formerClassFilter;
    return matchesSearch && matchesFormer;
  });

  const handleDownload = () => {
    if (downloadFormat === "csv") {
      const header = "No.,Name,Former Class,Rank,Marks %\n";
      const rows = filteredStudents.map((s, i) =>
        `${i + 1},"${s.name}","${s.former_class ?? ''}","${s.rank ?? ''}","${s.marks_percentage ?? ''}"`
      ).join("\n");
      const blob = new Blob([header + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${className}-students.csv`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } else {
      toast.info("PDF download coming soon");
    }
    setShowDownloadDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/teacher/dashboard")}
          style={{ color: "#800020" }}>
          <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>
            {className} — Student List
          </h1>
          <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>
            My Classes › {className}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/teacher/class/${classId}/attendance?name=${encodeURIComponent(className)}`)}
            className="h-11" style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
            Take Attendance
          </Button>
          <Button onClick={() => setShowDownloadDialog(true)} variant="outline" className="h-11"
            style={{ color: "#800020", borderColor: "#800020" }}>
            <Download size={18} className="mr-2" /> Download
          </Button>
        </div>
      </div>

      <Card style={{ borderColor: "#E5E5E7" }}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9A9A9A" }} />
              <Input placeholder="Search student name..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-11" />
            </div>
            <Select value={formerClassFilter} onValueChange={setFormerClassFilter}>
              <SelectTrigger className="w-full md:w-52 h-11">
                <SelectValue placeholder="Filter by former class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Former Classes</SelectItem>
                {formerClasses.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin" size={28} style={{ color: "#001F5B" }} />
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto" style={{ borderColor: "#E5E5E7" }}>
              <Table>
                <TableHeader style={{ backgroundColor: "#001F5B" }}>
                  <TableRow>
                    <TableHead className="text-white w-12">#</TableHead>
                    <TableHead className="text-white">Name</TableHead>
                    <TableHead className="text-white">Former Class</TableHead>
                    <TableHead className="text-white">Rank</TableHead>
                    <TableHead className="text-white">Marks %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8" style={{ color: "#9A9A9A" }}>
                        No students found
                      </TableCell>
                    </TableRow>
                  ) : filteredStudents.map((student, index) => (
                    <TableRow key={student.id}
                      style={{ backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F4F4F6" }}>
                      <TableCell className="text-sm" style={{ color: "#9A9A9A" }}>{index + 1}</TableCell>
                      <TableCell className="font-medium" style={{ color: "#2C2C2C" }}>{student.name}</TableCell>
                      <TableCell>
                        {student.former_class ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: colorMap[student.former_class] ?? "#9A9A9A" }}>
                            {student.former_class}
                          </span>
                        ) : <span style={{ color: "#9A9A9A" }}>—</span>}
                      </TableCell>
                      <TableCell style={{ color: "#2C2C2C" }}>{student.rank ?? '—'}</TableCell>
                      <TableCell style={{ color: "#2C2C2C" }}>
                        {student.marks_percentage != null ? `${student.marks_percentage}%` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && (
            <p className="text-sm mt-3" style={{ color: "#9A9A9A" }}>
              Showing {filteredStudents.length} of {students.length} students
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Download {className} Class List</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup value={downloadFormat} onValueChange={(v) => setDownloadFormat(v as "csv" | "pdf")}>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer"
                  style={{ borderColor: downloadFormat === "csv" ? "#800020" : "#E5E5E7" }}>
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv" className="flex-1 cursor-pointer">
                    <p className="font-medium" style={{ color: "#2C2C2C" }}>CSV / Excel (.csv)</p>
                    <p className="text-sm" style={{ color: "#9A9A9A" }}>Spreadsheet format, opens in Excel</p>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer"
                  style={{ borderColor: downloadFormat === "pdf" ? "#800020" : "#E5E5E7" }}>
                  <RadioGroupItem value="pdf" id="pdf" />
                  <Label htmlFor="pdf" className="flex-1 cursor-pointer">
                    <p className="font-medium" style={{ color: "#2C2C2C" }}>PDF</p>
                    <p className="text-sm" style={{ color: "#9A9A9A" }}>Document format (coming soon)</p>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDownloadDialog(false)}>Cancel</Button>
            <Button onClick={handleDownload} style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
