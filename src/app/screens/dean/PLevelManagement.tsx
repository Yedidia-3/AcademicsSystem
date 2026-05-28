import { useState, useEffect, useCallback } from "react";
import { Plus, MoreVertical, Users, BookOpen, Loader2 } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useNavigate } from "react-router";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { toast } from "sonner";
import { api } from "../../../lib/api";

interface AcademicYear { id: number; name: string; status: string; }
interface PLevel { id: number; name: string; academic_year_id: number; classes: { id: number; students: any[] }[]; }

export function PLevelManagement() {
  const navigate = useNavigate();
  const [activeYear, setActiveYear] = useState<AcademicYear | null>(null);
  const [pLevels, setPLevels] = useState<PLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPLevel, setSelectedPLevel] = useState<PLevel | null>(null);
  const [newPLevelName, setNewPLevelName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const years = await api.get<any>('/api/v1/academics/academic-years');
      const yearList: AcademicYear[] = Array.isArray(years) ? years : years.data ?? [];
      const active = yearList.find(y => y.status === 'active') ?? null;
      setActiveYear(active);
      if (active) {
        const pl = await api.get<any>(`/api/v1/academics/p-levels?academic_year_id=${active.id}`);
        setPLevels(Array.isArray(pl) ? pl : pl.data ?? []);
      }
    } catch {
      toast.error('Failed to load P-Levels');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!newPLevelName.trim() || !activeYear) return;
    setSaving(true);
    try {
      await api.post('/api/v1/academics/p-levels', { name: newPLevelName.trim(), academic_year_id: activeYear.id });
      toast.success(`${newPLevelName} created`);
      setShowAddDialog(false);
      setNewPLevelName("");
      await load();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPLevel) return;
    setSaving(true);
    try {
      await api.delete(`/api/v1/academics/p-levels/${selectedPLevel.id}`);
      toast.success(`${selectedPLevel.name} removed`);
      setShowDeleteDialog(false);
      setSelectedPLevel(null);
      await load();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="animate-spin" size={36} style={{ color: "#001F5B" }} />
    </div>
  );

  if (!activeYear) return (
    <div className="text-center py-20">
      <p className="text-lg font-semibold" style={{ color: "#2C2C2C" }}>No active academic year</p>
      <p className="text-sm mt-2" style={{ color: "#9A9A9A" }}>
        Ask the Super Admin to create an academic year first.
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>P-Levels</h1>
          <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>Academic year: {activeYear.name}</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="h-11"
          style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
          <Plus size={18} className="mr-2" /> Add P-Level
        </Button>
      </div>

      {pLevels.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg font-semibold" style={{ color: "#2C2C2C" }}>No P-Levels yet</p>
          <p className="text-sm mt-2 mb-4" style={{ color: "#9A9A9A" }}>Create the first P-Level to get started.</p>
          <Button onClick={() => setShowAddDialog(true)} style={{ backgroundColor: "#800020", color: "#fff" }}>
            <Plus size={18} className="mr-2" /> Add P-Level
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pLevels.map((pl) => {
            const classCount = pl.classes?.length ?? 0;
            const studentCount = pl.classes?.reduce((sum, c) => sum + (c.students?.length ?? 0), 0) ?? 0;
            return (
              <Card key={pl.id} style={{ borderColor: "#E5E5E7" }}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-2xl font-bold" style={{ color: "#2C2C2C" }}>{pl.name}</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm"><MoreVertical size={18} /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/dean/p-levels/${pl.id}/classes`)}>
                          Manage Classes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/dean/import?pLevel=${pl.id}`)}>
                          Import Students
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600"
                          onClick={() => { setSelectedPLevel(pl); setShowDeleteDialog(true); }}>
                          Delete P-Level
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#001F5B20" }}>
                        <BookOpen size={20} style={{ color: "#001F5B" }} />
                      </div>
                      <div>
                        <p className="text-sm" style={{ color: "#9A9A9A" }}>Classes</p>
                        <p className="text-xl font-bold" style={{ color: "#2C2C2C" }}>{classCount}</p>
                      </div>
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

                  <Button onClick={() => navigate(`/dean/p-levels/${pl.id}/classes`)}
                    className="w-full mt-6" variant="outline"
                    style={{ color: "#800020", borderColor: "#800020" }}>
                    Manage Classes
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New P-Level</DialogTitle>
            <DialogDescription>For academic year {activeYear.name}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>P-Level Name</Label>
            <Input className="mt-2 h-11" placeholder="e.g. P6" value={newPLevelName}
              onChange={e => setNewPLevelName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving || !newPLevelName.trim()}
              style={{ backgroundColor: "#800020", color: "#fff" }}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {selectedPLevel?.name}?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onClick={handleDelete} disabled={saving} style={{ backgroundColor: "#C0392B", color: "#fff" }}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
