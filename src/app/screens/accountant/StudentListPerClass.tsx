import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Search, ArrowLeft, Loader2, Plus, Trash2, Utensils, Bus,
  CheckCircle2, Users,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { api } from "../../../lib/api";
import { toast } from "sonner";
import { useAutoRefresh } from "../../../lib/useAutoRefresh";

type EnrollType = "feeding" | "transport";

interface StudentRow {
  id: number;
  name: string;
  rank: number | null;
  marks_percentage: number | null;
  former_class: string | null;
  classId: number;
  className: string;
}

interface ClassData {
  id: number;
  name: string;
  p_level: { id: number; name: string };
  students: any[];
}

interface Zone { id: number; name: string; price: number; }

interface EnrollmentInfo { id: number; expiry_date: string; zone_id: number | null; meal_type: string | null; }

const DURATION_OPTIONS = [
  { label: "1 month (30 days)", days: 30 },
  { label: "2 months (60 days)", days: 60 },
  { label: "3 months (90 days)", days: 90 },
  { label: "4 months (120 days)", days: 120 },
];

export function StudentListPerClass() {
  const { pLevelId } = useParams<{ pLevelId: string }>();
  const navigate = useNavigate();

  const [pLevelName, setPLevelName] = useState("");
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [enrollType, setEnrollType] = useState<EnrollType>("feeding");
  const [classFilter, setClassFilter] = useState<string>("all");   // "all" or classId
  const [searchTerm, setSearchTerm] = useState("");

  // Enrollment map for the current type: student_id -> info
  const [enrolled, setEnrolled] = useState<Record<number, EnrollmentInfo>>({});

  // Enroll dialog
  const [showEnroll, setShowEnroll] = useState(false);
  const [mealType, setMealType] = useState<string>("both");
  const [zoneId, setZoneId] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState("");
  const [durationDays, setDurationDays] = useState<string>("30");
  const [saving, setSaving] = useState(false);

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadBase = useCallback(async () => {
    try {
      const years = await api.get<any>('/api/v1/academics/academic-years');
      const yearList = Array.isArray(years) ? years : years.data ?? [];
      const active = yearList.find((y: any) => y.status === 'active');
      if (!active) { toast.error('No active academic year'); setLoading(false); return; }

      const [allClasses, zoneRes] = await Promise.all([
        api.get<any>(`/api/v1/academics/all-classes?academic_year_id=${active.id}`),
        api.get<any>('/api/v1/accountant/zones').catch(() => []),
      ]);
      const clsList: ClassData[] = Array.isArray(allClasses) ? allClasses : allClasses.data ?? [];
      const mine = clsList.filter(c => String(c.p_level?.id) === String(pLevelId));
      setClasses(mine);
      setPLevelName(mine[0]?.p_level?.name ?? '');
      setZones(Array.isArray(zoneRes) ? zoneRes : zoneRes.data ?? []);
    } catch {
      toast.error('Failed to load class lists');
    } finally {
      setLoading(false);
    }
  }, [pLevelId]);

  const loadEnrollments = useCallback(async () => {
    try {
      const res = await api.get<any>(`/api/v1/accountant/enrollments?type=${enrollType}`);
      const list = Array.isArray(res) ? res : res.data ?? [];
      const map: Record<number, EnrollmentInfo> = {};
      for (const e of list) {
        if (e.student_id) map[e.student_id] = { id: e.id, expiry_date: e.expiry_date, zone_id: e.zone_id, meal_type: e.meal_type };
      }
      setEnrolled(map);
    } catch {
      // silent
    }
  }, [enrollType]);

  useEffect(() => { loadBase(); }, [loadBase]);
  useEffect(() => { loadEnrollments(); }, [loadEnrollments]);
  useAutoRefresh(loadEnrollments);

  // ── Derived rows ──────────────────────────────────────────────────────────
  const allRows: StudentRow[] = classes.flatMap(c =>
    (c.students ?? []).map((s: any) => ({
      id: s.id, name: s.name, rank: s.rank, marks_percentage: s.marks_percentage,
      former_class: s.former_class, classId: c.id, className: `${c.p_level?.name ?? ''}${c.name}`,
    }))
  );

  const visibleRows = allRows
    .filter(r => classFilter === "all" || String(r.classId) === classFilter)
    .filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999) || a.name.localeCompare(b.name));

  const enrolledCount = visibleRows.filter(r => enrolled[r.id]).length;
  const notEnrolledIds = visibleRows.filter(r => !enrolled[r.id]).map(r => r.id);

  // ── Actions ───────────────────────────────────────────────────────────────
  const openEnroll = () => {
    setMealType("both");
    setZoneId(zones[0] ? String(zones[0].id) : "");
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setDurationDays("30");
    setShowEnroll(true);
  };

  const handleBulkEnroll = async () => {
    if (notEnrolledIds.length === 0) { toast.info('All visible students are already enrolled'); return; }
    if (enrollType === 'transport' && !zoneId) { toast.error('Please select a zone'); return; }
    setSaving(true);
    try {
      const res = await api.post<any>('/api/v1/accountant/enrollments/bulk', {
        student_ids: notEnrolledIds,
        type: enrollType,
        meal_type: enrollType === 'feeding' ? mealType : undefined,
        zone_id: enrollType === 'transport' ? +zoneId : undefined,
        payment_date: paymentDate,
        duration_days: +durationDays,
      });
      const created = res?.created ?? notEnrolledIds.length;
      toast.success(`${created} student${created !== 1 ? 's' : ''} enrolled into ${enrollType}`);
      setShowEnroll(false);
      await loadEnrollments();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to enroll');
    } finally {
      setSaving(false);
    }
  };

  const handleWaive = async (studentId: number, name: string) => {
    try {
      await api.delete(`/api/v1/accountant/enrollments/by-student/${studentId}?type=${enrollType}`);
      toast.success(`${name} waived from ${enrollType}`);
      await loadEnrollments();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to waive');
    }
  };

  const TypeIcon = enrollType === 'feeding' ? Utensils : Bus;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin" size={32} style={{ color: "#001F5B" }} />
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

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>
            {pLevelName} — Class List
          </h1>
          <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>
            Enroll distributed students into a service, then waive anyone who opts out.
          </p>
        </div>
        <Button onClick={openEnroll} className="h-11"
          style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
          <Plus size={18} className="mr-2" />
          Enroll Into {enrollType === 'feeding' ? 'Feeding' : 'Transport'}
        </Button>
      </div>

      {/* Filter / context bar */}
      <Card style={{ borderColor: "#E5E5E7" }}>
        <CardContent className="p-4 space-y-4">
          {/* Service toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: "#2C2C2C" }}>Service:</span>
            <div className="inline-flex rounded-lg border overflow-hidden" style={{ borderColor: "#E5E5E7" }}>
              {(["feeding", "transport"] as EnrollType[]).map(t => {
                const Icon = t === 'feeding' ? Utensils : Bus;
                const active = enrollType === t;
                return (
                  <button key={t} onClick={() => setEnrollType(t)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: active ? "#800020" : "#FFFFFF",
                      color: active ? "#FFFFFF" : "#9A9A9A",
                    }}>
                    <Icon size={16} /> {t === 'feeding' ? 'Feeding' : 'Transport'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Class filter + search */}
          <div className="flex flex-col md:flex-row gap-3">
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full md:w-56 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{pLevelName} — All Classes (overview)</SelectItem>
                {classes.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.p_level?.name}{c.name} (detail)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9A9A9A" }} />
              <Input placeholder="Search student name..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-11" />
            </div>
          </div>

          {/* Summary line */}
          <div className="flex items-center gap-4 text-sm flex-wrap" style={{ color: "#9A9A9A" }}>
            <span className="flex items-center gap-1"><Users size={14} /> {visibleRows.length} students</span>
            <span className="flex items-center gap-1" style={{ color: "#1A7F4B" }}>
              <CheckCircle2 size={14} /> {enrolledCount} enrolled in {enrollType}
            </span>
            <span style={{ color: "#D97706" }}>{visibleRows.length - enrolledCount} not enrolled</span>
          </div>
        </CardContent>
      </Card>

      {/* Student list — slide-to-reveal waive */}
      <Card style={{ borderColor: "#E5E5E7" }}>
        <CardContent className="p-0">
          {/* header row */}
          <div className="flex items-center gap-3 px-4 py-3 text-white text-sm font-semibold rounded-t-lg"
            style={{ backgroundColor: "#001F5B" }}>
            <span className="w-8">#</span>
            <span className="flex-1">Name</span>
            <span className="w-20 hidden sm:block">Class</span>
            <span className="w-16 text-center hidden sm:block">Rank</span>
            <span className="w-40 text-right">Status</span>
          </div>

          {visibleRows.length === 0 ? (
            <div className="text-center py-12">
              <TypeIcon size={40} className="mx-auto mb-3" style={{ color: "#9A9A9A" }} />
              <p style={{ color: "#9A9A9A" }}>No students found.</p>
            </div>
          ) : (
            visibleRows.map((r, index) => {
              const info = enrolled[r.id];
              const isEnrolled = !!info;
              return (
                <div key={r.id} className="group/row relative overflow-hidden border-b last:border-b-0"
                  style={{ borderColor: "#E5E5E7" }}>
                  {/* sliding content */}
                  <div className="flex items-center gap-3 px-4 py-3 transition-transform duration-200 group-hover/row:-translate-x-16"
                    style={{ backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F9F9FB" }}>
                    <span className="w-8 text-sm" style={{ color: "#9A9A9A" }}>{index + 1}</span>
                    <span className="flex-1 font-medium" style={{ color: "#2C2C2C" }}>{r.name}</span>
                    <span className="w-20 hidden sm:block">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold text-white"
                        style={{ backgroundColor: "#001F5B" }}>{r.className}</span>
                    </span>
                    <span className="w-16 text-center text-sm hidden sm:block" style={{ color: "#2C2C2C" }}>
                      {r.rank ?? '—'}
                    </span>
                    <span className="w-40 text-right">
                      {isEnrolled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: "#1A7F4B20", color: "#1A7F4B" }}>
                          <CheckCircle2 size={12} /> Enrolled · exp {new Date(info.expiry_date).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: "#F4F4F6", color: "#9A9A9A" }}>
                          Not enrolled
                        </span>
                      )}
                    </span>
                  </div>

                  {/* revealed trash (waive) — only meaningful when enrolled */}
                  <button
                    onClick={() => isEnrolled ? handleWaive(r.id, r.name) : undefined}
                    disabled={!isEnrolled}
                    title={isEnrolled ? `Waive ${r.name} from ${enrollType}` : 'Not enrolled'}
                    className="absolute top-0 right-0 h-full w-16 flex items-center justify-center translate-x-full transition-transform duration-200 group-hover/row:translate-x-0"
                    style={{ backgroundColor: isEnrolled ? "#C0392B" : "#9A9A9A", color: "#FFFFFF" }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-center" style={{ color: "#9A9A9A" }}>
        Tip: hover a student row to reveal the waive (remove) action.
      </p>

      {/* Enroll dialog */}
      <Dialog open={showEnroll} onOpenChange={setShowEnroll}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Enroll into {enrollType === 'feeding' ? 'Feeding' : 'Transport'}
            </DialogTitle>
            <DialogDescription>
              {notEnrolledIds.length} student{notEnrolledIds.length !== 1 ? 's' : ''} in the current view
              {classFilter === 'all' ? ` (${pLevelName} — all classes)` : ' (selected class)'} will be enrolled.
              Already-enrolled students are skipped.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {enrollType === 'feeding' ? (
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
            ) : (
              <div>
                <Label>Transport Zone</Label>
                <Select value={zoneId} onValueChange={setZoneId}>
                  <SelectTrigger className="w-full h-11 mt-2">
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map(z => (
                      <SelectItem key={z.id} value={String(z.id)}>
                        {z.name} — {z.price.toLocaleString()} RWF
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {zones.length === 0 && (
                  <p className="text-sm mt-1" style={{ color: "#D97706" }}>
                    No zones yet — create zones first.
                  </p>
                )}
              </div>
            )}

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
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEnroll(false)}>Cancel</Button>
            <Button onClick={handleBulkEnroll}
              disabled={saving || notEnrolledIds.length === 0 || (enrollType === 'transport' && !zoneId)}
              style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enroll {notEnrolledIds.length} Student{notEnrolledIds.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
