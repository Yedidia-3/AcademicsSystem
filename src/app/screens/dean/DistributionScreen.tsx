import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";
import { api } from "../../../lib/api";

interface StudentResult {
  result_id: number;
  name: string;
  new_class: string;
  new_class_id: number;
}

interface PreviewData {
  session: { id: number; p_level: { name: string }; status: string; };
  grouped: Record<string, StudentResult[]>;
  summary: { class: string; count: number; }[];
}

interface StaffUser { id: number; name: string; role: string; }

export function DistributionScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [teachers, setTeachers] = useState<StaffUser[]>([]);
  const [accountants, setAccountants] = useState<StaffUser[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<Record<string, string>>({});
  const [selectedAccountantId, setSelectedAccountantId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const load = useCallback(async () => {
    if (!sessionId) return;
    try {
      const [data, staff] = await Promise.all([
        api.get<any>(`/api/v1/academics/shuffle/${sessionId}/preview`),
        api.get<any>('/api/v1/admin/staff'),
      ]);
      setPreview(data);
      const staffList: StaffUser[] = Array.isArray(staff) ? staff : staff.data ?? [];
      setTeachers(staffList.filter(s => s.role === 'teacher'));
      const acts = staffList.filter(s => s.role === 'accountant');
      setAccountants(acts);
      if (acts.length === 1) setSelectedAccountantId(acts[0].id.toString());
    } catch {
      toast.error('Failed to load distribution data');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { load(); }, [load]);

  // Get unique classes from summary
  const classes = preview?.summary ?? [];
  const classIds: Record<string, number> = {};
  if (preview) {
    for (const [className, students] of Object.entries(preview.grouped)) {
      if (students.length > 0) classIds[className] = students[0].new_class_id;
    }
  }

  const allAssigned = classes.every(c => !!teacherAssignments[c.class]);

  const handleDistribute = async () => {
    if (!sessionId) return;
    setSaving(true);
    try {
      const teacherAssignmentsPayload = Object.entries(teacherAssignments).map(([className, teacherId]) => ({
        class_id: classIds[className],
        teacher_id: +teacherId,
      }));
      await api.post(`/api/v1/academics/shuffle/${sessionId}/distribute`, {
        accountant_id: selectedAccountantId ? +selectedAccountantId : undefined,
        teacher_assignments: teacherAssignmentsPayload,
      });
      toast.success('Class list distributed successfully');
      setShowDialog(false);
      setTimeout(() => navigate('/dean/dashboard'), 800);
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to distribute');
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
      <p style={{ color: "#9A9A9A" }}>Session not found.</p>
    </div>
  );

  const pLevelName = preview.session.p_level?.name ?? '';
  const isApproved = preview.session.status === 'approved';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dean/dashboard")} style={{ color: "#800020" }}>
          <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
        </Button>
      </div>

      <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>
        Distribute — {pLevelName} Classes
      </h1>

      {isApproved ? (
        <Card style={{ borderColor: "#1A7F4B", backgroundColor: "#F0FDF4" }}>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle size={24} style={{ color: "#1A7F4B" }} />
            <div>
              <p className="font-semibold" style={{ color: "#1A7F4B" }}>{pLevelName} has been approved by the Principal</p>
              <p className="text-sm" style={{ color: "#15803D" }}>Ready to distribute to teachers and accountant</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card style={{ borderColor: "#D97706", backgroundColor: "#FEF3E8" }}>
          <CardContent className="p-4">
            <p className="text-sm font-semibold" style={{ color: "#D97706" }}>
              Status: {preview.session.status?.replace(/_/g, ' ')} — Distribution is only allowed after Principal approval.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Accountant selector */}
      {accountants.length > 1 && (
        <Card style={{ borderColor: "#E5E5E7" }}>
          <CardContent className="p-6">
            <Label>Notify Accountant</Label>
            <Select value={selectedAccountantId} onValueChange={setSelectedAccountantId}>
              <SelectTrigger className="w-full h-11 mt-2">
                <SelectValue placeholder="Select accountant..." />
              </SelectTrigger>
              <SelectContent>
                {accountants.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Teacher Assignment */}
      <Card style={{ borderColor: "#E5E5E7" }}>
        <CardHeader><CardTitle>Assign Teachers Before Distributing</CardTitle></CardHeader>
        <CardContent>
          {!allAssigned && (
            <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: "#FEF3E8" }}>
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
                {classes.map((c, index) => (
                  <TableRow key={c.class} style={{ backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F4F4F6" }}>
                    <TableCell className="font-semibold" style={{ color: "#2C2C2C" }}>{c.class}</TableCell>
                    <TableCell style={{ color: "#2C2C2C" }}>{c.count}</TableCell>
                    <TableCell>
                      {teacherAssignments[c.class] ? (
                        <span className="font-medium" style={{ color: "#1A7F4B" }}>
                          {teachers.find(t => t.id.toString() === teacherAssignments[c.class])?.name ?? 'Assigned'}
                        </span>
                      ) : (
                        <span className="italic" style={{ color: "#9A9A9A" }}>Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select value={teacherAssignments[c.class] ?? ""}
                        onValueChange={(teacherId) => setTeacherAssignments(prev => ({ ...prev, [c.class]: teacherId }))}>
                        <SelectTrigger className="w-48 h-9">
                          <SelectValue placeholder="Select teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.length === 0 ? (
                            <SelectItem value="__none" disabled>No teachers available</SelectItem>
                          ) : (
                            teachers.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)
                          )}
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

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => navigate("/dean/dashboard")} className="h-11">Back</Button>
        <Button onClick={() => setShowDialog(true)} disabled={!allAssigned || !isApproved} className="h-11"
          style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
          Distribute Classes
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Distribute {pLevelName} class list?</DialogTitle>
            <DialogDescription>
              This will send class lists to assigned teachers and the accountant. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleDistribute} disabled={saving}
              style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Distribute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
