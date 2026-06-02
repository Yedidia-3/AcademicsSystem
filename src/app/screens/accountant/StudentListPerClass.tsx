import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Search, Download, ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { api } from "../../../lib/api";
import { toast } from "sonner";

interface ClassItem {
  id: number;
  name: string;
  p_level_id: number;
}

interface PLevel {
  id: number;
  name: string;
}

interface Student {
  id: number;
  name: string;
  former_class: string | null;
  rank: number | null;
  marks_percentage: number | null;
}

const CLASS_COLORS = ["#800020", "#001F5B", "#C9A84C", "#1A7F4B", "#2563EB", "#6B21A8"];

export function StudentListPerClass() {
  const { pLevelId } = useParams<{ pLevelId: string }>();
  const navigate = useNavigate();

  const [pLevel, setPLevel] = useState<PLevel | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [plRes, clsRes] = await Promise.all([
          api.get<any>(`/api/v1/academics/p-levels/${pLevelId}`),
          api.get<any>(`/api/v1/academics/p-levels/${pLevelId}/classes`),
        ]);
        setPLevel(plRes);
        const cls: ClassItem[] = Array.isArray(clsRes) ? clsRes : clsRes.data ?? [];
        setClasses(cls);
        if (cls.length > 0) setSelectedClassId(String(cls[0].id));
      } catch {
        toast.error('Failed to load class data');
      } finally {
        setLoading(false);
      }
    };
    if (pLevelId) load();
  }, [pLevelId]);

  useEffect(() => {
    if (!selectedClassId) return;
    const loadStudents = async () => {
      setStudentsLoading(true);
      setStudents([]);
      setSearchTerm("");
      try {
        const res = await api.get<any>(`/api/v1/academics/classes/${selectedClassId}/students`);
        setStudents(Array.isArray(res) ? res : res.data ?? []);
      } catch {
        toast.error('Failed to load students');
      } finally {
        setStudentsLoading(false);
      }
    };
    loadStudents();
  }, [selectedClassId]);

  const formerClasses = Array.from(new Set(students.map(s => s.former_class).filter(Boolean))) as string[];
  const colorMap: Record<string, string> = {};
  formerClasses.forEach((c, i) => { colorMap[c] = CLASS_COLORS[i % CLASS_COLORS.length]; });

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedClass = classes.find(c => String(c.id) === selectedClassId);
  const displayName = pLevel ? `${pLevel.name}${selectedClass?.name ?? ''}` : '';

  const handleDownload = () => {
    const header = "No.,Name,Former Class,Rank,Marks %\n";
    const rows = filteredStudents.map((s, i) =>
      `${i + 1},"${s.name}","${s.former_class ?? ''}","${s.rank ?? ''}","${s.marks_percentage ?? ''}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${displayName}-students.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Download started');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin" size={28} style={{ color: "#001F5B" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/accountant/class-lists")}
          style={{ color: "#800020" }}>
          <ArrowLeft size={18} className="mr-2" /> Back to Class Lists
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>
          {pLevel?.name} — Class Lists
        </h1>
        <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>
          Class Lists › {pLevel?.name}
        </p>
      </div>

      <Card style={{ borderColor: "#E5E5E7" }}>
        <CardContent className="p-6">
          {classes.length === 0 ? (
            <div className="text-center py-12">
              <p style={{ color: "#9A9A9A" }}>No classes found for {pLevel?.name}</p>
            </div>
          ) : (
            <Tabs value={selectedClassId} onValueChange={setSelectedClassId}>
              <div className="flex items-center justify-between mb-6">
                <TabsList>
                  {classes.map(cls => (
                    <TabsTrigger key={cls.id} value={String(cls.id)}>
                      {pLevel?.name}{cls.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <Button variant="outline" className="h-11" onClick={handleDownload}
                  style={{ color: "#800020", borderColor: "#800020" }}>
                  <Download size={18} className="mr-2" /> Download CSV
                </Button>
              </div>

              {classes.map(cls => (
                <TabsContent key={cls.id} value={String(cls.id)}>
                  <div className="mb-4 relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: "#9A9A9A" }} />
                    <Input placeholder="Search student name..." value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-11" />
                  </div>

                  {studentsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="animate-spin" size={24} style={{ color: "#001F5B" }} />
                    </div>
                  ) : (
                    <>
                      <div className="border rounded-lg overflow-x-auto" style={{ borderColor: "#E5E5E7" }}>
                        <Table>
                          <TableHeader style={{ backgroundColor: "#001F5B" }}>
                            <TableRow>
                              <TableHead className="text-white w-10">#</TableHead>
                              <TableHead className="text-white">Name</TableHead>
                              <TableHead className="text-white">Former Class</TableHead>
                              <TableHead className="text-white">Rank</TableHead>
                              <TableHead className="text-white">Marks %</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredStudents.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8"
                                  style={{ color: "#9A9A9A" }}>
                                  No students found
                                </TableCell>
                              </TableRow>
                            ) : filteredStudents.map((student, index) => (
                              <TableRow key={student.id}
                                style={{ backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F4F4F6" }}>
                                <TableCell className="text-sm" style={{ color: "#9A9A9A" }}>
                                  {index + 1}
                                </TableCell>
                                <TableCell className="font-medium" style={{ color: "#2C2C2C" }}>
                                  {student.name}
                                </TableCell>
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
                      <p className="text-sm mt-3" style={{ color: "#9A9A9A" }}>
                        {filteredStudents.length} of {students.length} students
                      </p>
                    </>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
