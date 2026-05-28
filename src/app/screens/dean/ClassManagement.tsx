import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { Plus, MoreVertical, Users, Upload, ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { toast } from "sonner";
import { api } from "../../../lib/api";

interface ClassData {
  id: number;
  name: string;
  teacher_id: number | null;
  teacher: { id: number; name: string } | null;
  students: any[];
  status: string;
}

interface PLevel {
  id: number;
  name: string;
  academic_year_id: number;
}

interface StaffUser {
  id: number;
  name: string;
  role: string;
}

export function ClassManagement() {
  const { pLevelId } = useParams<{ pLevelId: string }>();
  const navigate = useNavigate();

  const [pLevel, setPLevel] = useState<PLevel | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [teachers, setTeachers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [newClassName, setNewClassName] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");

  const load = useCallback(async () => {
    if (!pLevelId) return;
    try {
      const [pl, cls, staff] = await Promise.all([
        api.get<any>(`/api/v1/academics/p-levels/${pLevelId}`),
        api.get<any>(`/api/v1/academics/p-levels/${pLevelId}/classes`),
        api.get<any>('/api/v1/admin/staff?role=teacher'),
      ]);
      setPLevel(pl);
      setClasses(Array.isArray(cls) ? cls : cls.data ?? []);
      setTeachers(Array.isArray(staff) ? staff : staff.data ?? []);
    } catch {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, [pLevelId]);

  useEffect(() => { load(); }, [load]);

  const handleAddClass = async () => {
    if (!newClassName.trim() || !pLevelId) return;
    setSaving(true);
    try {
      await api.post('/api/v1/academics/classes', { name: newClassName.trim(), p_level_id: +pLevelId });
      toast.success(`Class ${newClassName} created`);
      setShowAddDialog(false);
      setNewClassName("");
      await load();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to create class');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) return;
    setSaving(true);
    try {
      await api.delete(`/api/v1/academics/classes/${selectedClass.id}`);
      toast.success(`Class ${selectedClass.name} removed`);
      setShowDeleteDialog(false);
      setSelectedClass(null);
      await load();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to delete class');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignTeacher = async () => {
    if (!selectedClass || !selectedTeacherId) return;
    setSaving(true);
    try {
      await api.put(`/api/v1/academics/classes/${selectedClass.id}/assign-teacher`, { teacher_id: +selectedTeacherId });
      toast.success(`Teacher assigned to ${selectedClass.name}`);
      setShowAssignDialog(false);
      setSelectedClass(null);
      setSelectedTeacherId("");
      await load();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to assign teacher');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="animate-spin" size={36} style={{ color: "#001F5B" }} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dean/p-levels")} style={{ color: "#800020" }}>
          <ArrowLeft size={18} className="mr-2" /> Back to P-Levels
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>
            {pLevel?.name ?? `P-Level ${pLevelId}`} — Classes
          </h1>
          <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>
            {classes.length} class{classes.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/dean/import`)} variant="outline" className="h-11"
            style={{ color: "#800020", borderColor: "#800020" }}>
            <Upload size={18} className="mr-2" /> Import Excel
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="h-11"
            style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
            <Plus size={18} className="mr-2" /> Add Class
          </Button>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg font-semibold" style={{ color: "#2C2C2C" }}>No classes yet</p>
          <p className="text-sm mt-2 mb-4" style={{ color: "#9A9A9A" }}>Add the first class for {pLevel?.name}.</p>
          <Button onClick={() => setShowAddDialog(true)} style={{ backgroundColor: "#800020", color: "#fff" }}>
            <Plus size={18} className="mr-2" /> Add Class
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem) => {
            const studentCount = classItem.students?.length ?? 0;
            return (
              <Card key={classItem.id} style={{ borderColor: "#E5E5E7" }}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold" style={{ color: "#2C2C2C" }}>{pLevel?.name}{classItem.name}</h3>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm"><MoreVertical size={18} /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelectedClass(classItem); setSelectedTeacherId(classItem.teacher_id?.toString() ?? ""); setShowAssignDialog(true); }}>
                          {classItem.teacher ? 'Change Teacher' : 'Assign Teacher'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600"
                          onClick={() => { setSelectedClass(classItem); setShowDeleteDialog(true); }}>
                          Delete Class
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm mb-1" style={{ color: "#9A9A9A" }}>Assigned Teacher</p>
                      {classItem.teacher ? (
                        <p className="font-medium" style={{ color: "#2C2C2C" }}>{classItem.teacher.name}</p>
                      ) : (
                        <p className="italic" style={{ color: "#9A9A9A" }}>Unassigned</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#80002020" }}>
                        <Users size={20} style={{ color: "#800020" }} />
                      </div>
                      <div>
                        <p className="text-sm" style={{ color: "#9A9A9A" }}>Students</p>
                        <p className="text-xl font-bold" style={{ color: "#2C2C2C" }}>{studentCount}</p>
                      </div>
                    </div>
                  </div>

                  <Button onClick={() => { setSelectedClass(classItem); setSelectedTeacherId(classItem.teacher_id?.toString() ?? ""); setShowAssignDialog(true); }}
                    className="w-full mt-6" variant="outline"
                    style={{ color: "#800020", borderColor: "#800020" }}>
                    {classItem.teacher ? 'Change Teacher' : 'Assign Teacher'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Class Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
            <DialogDescription>Create a new class for {pLevel?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Class Letter</Label>
              <Input className="mt-2 h-11" placeholder={`e.g., A`} value={newClassName}
                onChange={e => setNewClassName(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleAddClass()} />
              {newClassName && <p className="text-xs mt-1" style={{ color: "#9A9A9A" }}>Will be named: {pLevel?.name}{newClassName}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowAddDialog(false); setNewClassName(""); }}>Cancel</Button>
            <Button onClick={handleAddClass} disabled={saving || !newClassName.trim()}
              style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Add Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Teacher Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Teacher to {pLevel?.name}{selectedClass?.name}</DialogTitle>
            <DialogDescription>Select a teacher for this class</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label>Teacher</Label>
            <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
              <SelectTrigger className="w-full h-11 mt-2">
                <SelectValue placeholder="Select teacher..." />
              </SelectTrigger>
              <SelectContent>
                {teachers.length === 0 ? (
                  <SelectItem value="__none" disabled>No teachers available</SelectItem>
                ) : (
                  teachers.map(t => (
                    <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowAssignDialog(false); setSelectedTeacherId(""); }}>Cancel</Button>
            <Button onClick={handleAssignTeacher} disabled={saving || !selectedTeacherId}
              style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {pLevel?.name}{selectedClass?.name}?</DialogTitle>
            <DialogDescription>This cannot be undone. Classes with students cannot be deleted.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onClick={handleDeleteClass} disabled={saving} style={{ backgroundColor: "#C0392B", color: "#fff" }}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
