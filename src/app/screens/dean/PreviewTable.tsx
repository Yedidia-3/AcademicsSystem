import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { Search, MoreVertical, RotateCcw, ArrowRight, RefreshCw, Loader2 } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";
import { api } from "../../../lib/api";

interface StudentResult {
  result_id: number;
  student_id: number;
  name: string;
  former_class: string | null;
  rank: number;
  marks_percentage: number | null;
  new_class: string;
  new_class_id: number;
  is_manual_override: boolean;
}

interface ClassInfo { id: number; name: string; }

interface PreviewData {
  session: { id: number; p_level: { id: number; name: string }; algorithm: string; status: string; };
  grouped: Record<string, StudentResult[]>;
  summary: { class: string; count: number }[];
  classes?: ClassInfo[];
}

interface StaffUser { id: number; name: string; role: string; }

const CLASS_COLORS = ["#800020", "#001F5B", "#C9A84C", "#1A7F4B", "#2563EB", "#6B21A8"];

export function PreviewTable() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [allStudents, setAllStudents] = useState<StudentResult[]>([]);
  const [principals, setPrincipals] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedPrincipalId, setSelectedPrincipalId] = useState<string>("");

  const loadPreview = useCallback(async () => {
    if (!sessionId) return;
    try {
      const [data, staff] = await Promise.all([
        api.get<any>(`/api/v1/academics/shuffle/${sessionId}/preview`),
        api.get<any>('/api/v1/admin/staff?role=principal'),
      ]);
      setPreview(data);
      const students = Object.values(data.grouped as Record<string, StudentResult[]>).flat();
      setAllStudents(students);
      const staffList: StaffUser[] = Array.isArray(staff) ? staff : staff.data ?? [];
      setPrincipals(staffList);
      if (staffList.length === 1) setSelectedPrincipalId(staffList[0].id.toString());
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { loadPreview(); }, [loadPreview]);

  // Use the backend-provided class list for reliable id lookups; fall back to grouped keys
  const classIdMap: Record<string, number> = {};
  (preview?.classes ?? []).forEach(c => { classIdMap[c.name] = c.id; });

  // Filter out any empty-string keys (safety net for corrupt data)
  const classNames = preview
    ? Object.keys(preview.grouped).filter(cn => cn.trim().length > 0)
    : [];
  const classColorMap: Record<string, string> = {};
  classNames.forEach((cn, i) => { classColorMap[cn] = CLASS_COLORS[i % CLASS_COLORS.length]; });

  const filteredStudents = allStudents.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = classFilter === "all" || s.new_class === classFilter;
    return matchSearch && matchClass;
  });

  const manualCount = allStudents.filter(s => s.is_manual_override).length;

  const handleMoveStudent = async (resultId: number, newClassId: number, newClassName: string) => {
    if (!sessionId) return;
    try {
      const data = await api.put<any>(`/api/v1/academics/shuffle/${sessionId}/adjust/${resultId}`, { new_class_id: newClassId });
      setPreview(data);
      setAllStudents(Object.values(data.grouped as Record<string, StudentResult[]>).flat());
      toast.success(`Student moved to ${newClassName}`);
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to move student');
    }
  };

  const handleSubmit = async () => {
    if (!sessionId || !selectedPrincipalId) return;
    setSaving(true);
    try {
      await api.post(`/api/v1/academics/shuffle/${sessionId}/submit`, { principal_id: +selectedPrincipalId });
      toast.success('Class list submitted for Principal approval');
      setShowSubmitDialog(false);
      setTimeout(() => navigate('/dean/dashboard'), 800);
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to submit');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="animate-spin" size={36} style={{ color: "#001F5B" }} />
    </div>
  );

  if (!preview) return (
    <div className="text-center py-20">
      <p style={{ color: "#9A9A9A" }}>Shuffle session not found.</p>
      <Button onClick={() => navigate('/dean/p-levels')} className="mt-4" variant="outline">Back to P-Levels</Button>
    </div>
  );

  const pLevelName = preview.session.p_level?.name ?? '';
  const algoLabel = preview.session.algorithm?.replace(/_/g, ' ') ?? '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>
          Preview — {pLevelName} New Classes
        </h1>
        <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>
          Algorithm: <strong>{algoLabel}</strong> · {allStudents.length} students total
        </p>
      </div>

      {/* Summary Bar */}
      <Card style={{ borderColor: "#E5E5E7", backgroundColor: "#F4F4F6" }}>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {preview.summary.map(s => (
              <div key={s.class} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: classColorMap[s.class] ?? "#9A9A9A" }} />
                <span className="font-semibold" style={{ color: "#2C2C2C" }}>{s.class}:</span>
                <span style={{ color: "#9A9A9A" }}>{s.count} students</span>
              </div>
            ))}
            {manualCount > 0 && (
              <span className="ml-auto px-3 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: "#C9A84C", color: "#2C2C2C" }}>
                {manualCount} manual change{manualCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Controls + Table */}
      <Card style={{ borderColor: "#E5E5E7" }}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9A9A9A" }} />
              <Input placeholder="Search student name..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-11" />
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full md:w-48 h-11">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classNames.map(cn => <SelectItem key={cn} value={cn}>{cn}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => navigate(`/dean/algorithm/${preview.session.p_level?.id}`)}
              variant="ghost" className="h-11" style={{ color: "#800020" }}>
              <RefreshCw size={18} className="mr-2" /> Re-run Algorithm
            </Button>
          </div>

          <div className="border rounded-lg overflow-x-auto" style={{ borderColor: "#E5E5E7" }}>
            <Table>
              <TableHeader style={{ backgroundColor: "#001F5B" }}>
                <TableRow>
                  <TableHead className="text-white">Name</TableHead>
                  <TableHead className="text-white">Former Class</TableHead>
                  <TableHead className="text-white">Rank</TableHead>
                  <TableHead className="text-white">Marks %</TableHead>
                  <TableHead className="text-white">New Class</TableHead>
                  <TableHead className="text-white text-right">Move</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((s, index) => (
                  <TableRow key={s.result_id}
                    style={{
                      backgroundColor: s.is_manual_override ? "#FFFBF0" : index % 2 === 0 ? "#FFFFFF" : "#F4F4F6",
                      borderLeft: s.is_manual_override ? "3px solid #C9A84C" : "none",
                    }}>
                    <TableCell style={{ color: "#2C2C2C" }} className="font-medium">{s.name}</TableCell>
                    <TableCell>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: "#9A9A9A" }}>
                        {s.former_class ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell style={{ color: "#2C2C2C" }}>{s.rank ?? '—'}</TableCell>
                    <TableCell style={{ color: "#2C2C2C" }}>{s.marks_percentage != null ? `${s.marks_percentage}%` : '—'}</TableCell>
                    <TableCell>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: classColorMap[s.new_class] ?? "#9A9A9A" }}>
                        {s.new_class}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"><MoreVertical size={16} /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {classNames.filter(cn => cn !== s.new_class).map(cn => (
                            <DropdownMenuItem key={cn}
                              onClick={() => handleMoveStudent(s.result_id, classIdMap[cn] ?? 0, cn)}>
                              Move to {cn}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-sm mt-3" style={{ color: "#9A9A9A" }}>
            {filteredStudents.length} of {allStudents.length} students
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => navigate(`/dean/algorithm/${preview.session.p_level?.id}`)} className="h-11">
          Back to Algorithm Selection
        </Button>
        <Button onClick={() => setShowSubmitDialog(true)} className="h-11"
          style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
          Submit for Approval <ArrowRight size={18} className="ml-2" />
        </Button>
      </div>

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit {pLevelName} class list for approval?</DialogTitle>
            <DialogDescription>Once submitted, you cannot make changes until the Principal reviews.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Select Principal to notify</Label>
            <Select value={selectedPrincipalId} onValueChange={setSelectedPrincipalId}>
              <SelectTrigger className="w-full h-11 mt-2">
                <SelectValue placeholder="Select principal..." />
              </SelectTrigger>
              <SelectContent>
                {principals.length === 0 ? (
                  <SelectItem value="__none" disabled>No principals found</SelectItem>
                ) : (
                  principals.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving || !selectedPrincipalId}
              style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
