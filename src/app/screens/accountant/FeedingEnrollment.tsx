import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Download, Loader2, MoreVertical, Utensils } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { api } from "../../../lib/api";
import { toast } from "sonner";

interface Enrollment {
  id: number;
  student_id: number;
  type: string;
  meal_type: 'breakfast' | 'lunch' | 'both' | null;
  payment_date: string;
  duration_days: number;
  expiry_date: string;
  status: string;
  student: {
    id: number;
    name: string;
    current_class: {
      id: number;
      name: string;
      p_level: { id: number; name: string; };
    } | null;
  } | null;
}

interface StudentOption {
  id: number;
  name: string;
  className: string;
}

const MEAL_LABEL: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  both: 'Breakfast & Lunch',
};

const DURATION_OPTIONS = [
  { label: '1 month (30 days)', days: 30 },
  { label: '2 months (60 days)', days: 60 },
  { label: '3 months (90 days)', days: 90 },
  { label: '4 months (120 days)', days: 120 },
];

export function FeedingEnrollment() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [mealFilter, setMealFilter] = useState<string>("all");

  // Add enrollment dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [allStudents, setAllStudents] = useState<StudentOption[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [mealType, setMealType] = useState<string>("both");
  const [paymentDate, setPaymentDate] = useState("");
  const [durationDays, setDurationDays] = useState<string>("30");
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get<any>('/api/v1/accountant/enrollments?type=feeding');
      setEnrollments(Array.isArray(res) ? res : res.data ?? []);
    } catch {
      toast.error('Failed to load feeding enrollments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadAllStudents = async () => {
    setStudentsLoading(true);
    try {
      const years = await api.get<any>('/api/v1/academics/academic-years');
      const yearsList = Array.isArray(years) ? years : (years as any).data ?? [];
      const activeYear = yearsList.find((y: any) => y.status === 'active');
      if (!activeYear) { toast.error('No active academic year'); setStudentsLoading(false); return; }

      const res = await api.get<any>(`/api/v1/academics/all-classes?academic_year_id=${activeYear.id}`);
      const classes = Array.isArray(res) ? res : res.data ?? [];
      const opts: StudentOption[] = [];
      for (const cls of classes) {
        const className = `${cls.p_level?.name ?? ''}${cls.name}`;
        for (const s of (cls.students ?? [])) {
          opts.push({ id: s.id, name: s.name, className });
        }
      }
      opts.sort((a, b) => a.name.localeCompare(b.name));
      setAllStudents(opts);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setStudentsLoading(false);
    }
  };

  const openAddDialog = () => {
    setShowAddDialog(true);
    setSelectedStudentId("");
    setMealType("both");
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setDurationDays("30");
    setStudentSearch("");
    if (allStudents.length === 0) loadAllStudents();
  };

  const handleAdd = async () => {
    if (!selectedStudentId || !mealType || !paymentDate) {
      toast.error('Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/v1/accountant/enrollments', {
        student_id: +selectedStudentId,
        type: 'feeding',
        meal_type: mealType,
        payment_date: paymentDate,
        duration_days: +durationDays,
      });
      const student = allStudents.find(s => String(s.id) === selectedStudentId);
      toast.success(`${student?.name ?? 'Student'} enrolled in feeding`);
      setShowAddDialog(false);
      await load();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to create enrollment');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEnrollment) return;
    setSaving(true);
    try {
      await api.delete(`/api/v1/accountant/enrollments/${selectedEnrollment.id}`);
      toast.success('Enrollment archived');
      setShowDeleteDialog(false);
      setSelectedEnrollment(null);
      await load();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to archive enrollment');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const header = "Name,Class,Meal Type,Payment Date,Expiry Date\n";
    const rows = filteredEnrollments.map(e => {
      const name = e.student?.name ?? '';
      const cls = e.student?.current_class
        ? `${e.student.current_class.p_level?.name ?? ''}${e.student.current_class.name}`
        : '';
      return `"${name}","${cls}","${MEAL_LABEL[e.meal_type ?? ''] ?? ''}","${e.payment_date}","${e.expiry_date}"`;
    }).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'feeding-enrollments.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const isExpiringSoon = (expiry: string) => {
    const today = new Date();
    const exp = new Date(expiry);
    const diff = (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 3 && diff >= 0;
  };

  const isExpired = (expiry: string) => new Date(expiry) < new Date();

  const filteredEnrollments = enrollments.filter(e => {
    const matchSearch = e.student?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchMeal = mealFilter === "all" || e.meal_type === mealFilter;
    return matchSearch && matchMeal;
  });

  const filteredStudents = allStudents.filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.className.toLowerCase().includes(studentSearch.toLowerCase())
  ).slice(0, 50);

  const expiryBadge = (expiry: string) => {
    if (isExpired(expiry)) return { label: 'Expired', color: '#C0392B' };
    if (isExpiringSoon(expiry)) return { label: 'Expiring Soon', color: '#D97706' };
    return { label: 'Active', color: '#1A7F4B' };
  };

  const expiryDate = paymentDate && durationDays
    ? new Date(new Date(paymentDate).getTime() + +durationDays * 86400000).toLocaleDateString()
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>School Feeding</h1>
          <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>Manage breakfast and lunch enrollments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-11" onClick={handleExport}
            style={{ color: "#800020", borderColor: "#800020" }}>
            <Download size={18} className="mr-2" /> Export
          </Button>
          <Button className="h-11" onClick={openAddDialog}
            style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
            <Plus size={18} className="mr-2" /> Add Enrollment
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
            <Select value={mealFilter} onValueChange={setMealFilter}>
              <SelectTrigger className="w-full md:w-48 h-11">
                <SelectValue placeholder="Filter by meal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Meal Types</SelectItem>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin" size={28} style={{ color: "#001F5B" }} />
            </div>
          ) : filteredEnrollments.length === 0 ? (
            <div className="text-center py-12">
              <Utensils size={48} className="mx-auto mb-3" style={{ color: "#9A9A9A" }} />
              <p className="text-lg font-semibold" style={{ color: "#2C2C2C" }}>No feeding enrollments</p>
              <p className="text-sm mt-2 mb-4" style={{ color: "#9A9A9A" }}>
                {searchTerm || mealFilter !== "all"
                  ? "No results match your filters."
                  : "Click 'Add Enrollment' to get started."}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden" style={{ borderColor: "#E5E5E7" }}>
              <Table>
                <TableHeader style={{ backgroundColor: "#001F5B" }}>
                  <TableRow>
                    <TableHead className="text-white">Student</TableHead>
                    <TableHead className="text-white">Class</TableHead>
                    <TableHead className="text-white">Meal Type</TableHead>
                    <TableHead className="text-white">Payment Date</TableHead>
                    <TableHead className="text-white">Expires</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEnrollments.map((e, index) => {
                    const badge = expiryBadge(e.expiry_date);
                    const cls = e.student?.current_class
                      ? `${e.student.current_class.p_level?.name ?? ''}${e.student.current_class.name}`
                      : '—';
                    return (
                      <TableRow key={e.id}
                        style={{ backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F4F4F6" }}>
                        <TableCell className="font-medium" style={{ color: "#2C2C2C" }}>
                          {e.student?.name ?? '—'}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded text-xs font-semibold text-white"
                            style={{ backgroundColor: "#001F5B" }}>
                            {cls}
                          </span>
                        </TableCell>
                        <TableCell style={{ color: "#2C2C2C" }}>
                          {MEAL_LABEL[e.meal_type ?? ''] ?? '—'}
                        </TableCell>
                        <TableCell style={{ color: "#2C2C2C" }}>
                          {new Date(e.payment_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell style={{ color: isExpired(e.expiry_date) ? "#C0392B" : "#2C2C2C" }}>
                          {new Date(e.expiry_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: badge.color }}>
                            {badge.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm"><MoreVertical size={16} /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="text-red-600"
                                onClick={() => { setSelectedEnrollment(e); setShowDeleteDialog(true); }}>
                                Archive Enrollment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && (
            <p className="text-sm mt-3" style={{ color: "#9A9A9A" }}>
              {filteredEnrollments.length} enrollment{filteredEnrollments.length !== 1 ? 's' : ''}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add Enrollment Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Feeding Enrollment</DialogTitle>
            <DialogDescription>Enroll a student in the school feeding program</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Search Student</Label>
              <Input value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                placeholder="Type name or class..." className="mt-2 h-11" />
              {studentsLoading ? (
                <div className="flex items-center gap-2 mt-2">
                  <Loader2 size={14} className="animate-spin" style={{ color: "#9A9A9A" }} />
                  <span className="text-sm" style={{ color: "#9A9A9A" }}>Loading students...</span>
                </div>
              ) : studentSearch && (
                <div className="mt-1 border rounded-lg max-h-48 overflow-y-auto" style={{ borderColor: "#E5E5E7" }}>
                  {filteredStudents.length === 0 ? (
                    <p className="p-3 text-sm" style={{ color: "#9A9A9A" }}>No students found</p>
                  ) : filteredStudents.map(s => (
                    <button key={s.id}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                      onClick={() => {
                        setSelectedStudentId(String(s.id));
                        setStudentSearch(s.name);
                      }}
                      style={{
                        backgroundColor: selectedStudentId === String(s.id) ? '#FFF5F7' : undefined,
                        color: "#2C2C2C",
                      }}>
                      <span>{s.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded text-white"
                        style={{ backgroundColor: "#001F5B" }}>{s.className}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedStudentId && !studentSearch.trim().length && (
                <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>Student selected</p>
              )}
            </div>

            <div>
              <Label>Meal Type</Label>
              <Select value={mealType} onValueChange={setMealType}>
                <SelectTrigger className="w-full h-11 mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast only</SelectItem>
                  <SelectItem value="lunch">Lunch only</SelectItem>
                  <SelectItem value="both">Breakfast & Lunch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Payment Date</Label>
              <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
                className="mt-2 h-11" />
            </div>

            <div>
              <Label>Duration</Label>
              <Select value={durationDays} onValueChange={setDurationDays}>
                <SelectTrigger className="w-full h-11 mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map(o => (
                    <SelectItem key={o.days} value={String(o.days)}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {paymentDate && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#F4F4F6" }}>
                <p className="text-sm" style={{ color: "#9A9A9A" }}>
                  <strong style={{ color: "#2C2C2C" }}>Expires on:</strong> {expiryDate}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving || !selectedStudentId}
              style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Enrollment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Archive Enrollment?</DialogTitle>
            <DialogDescription>
              Archive feeding enrollment for {selectedEnrollment?.student?.name}?
              This will mark it as inactive but preserve the record.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onClick={handleDelete} disabled={saving}
              style={{ backgroundColor: "#C0392B", color: "#FFFFFF" }}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
