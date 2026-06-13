import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, Loader2, Check, X, Clock, Save, Users } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { api } from "../../../lib/api";
import { toast } from "sonner";

type Status = "present" | "absent" | "late";

interface AttendanceRow {
  student_id: number;
  name: string;
  rank: number | null;
  status: Status;
}

const STATUS_META: Record<Status, { label: string; color: string; bg: string; Icon: any }> = {
  present: { label: "Present", color: "#1A7F4B", bg: "#1A7F4B", Icon: Check },
  absent:  { label: "Absent",  color: "#C0392B", bg: "#C0392B", Icon: X },
  late:    { label: "Late",    color: "#D97706", bg: "#D97706", Icon: Clock },
};

export function AttendanceScreen() {
  const { classId } = useParams<{ classId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const className = searchParams.get("name") ?? `Class ${classId}`;

  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alreadyMarked, setAlreadyMarked] = useState(false);

  const load = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await api.get<any>(`/api/v1/academics/classes/${classId}/attendance?date=${date}`);
      setRows(res.records ?? []);
      setAlreadyMarked(!!res.already_marked);
    } catch {
      toast.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }, [classId, date]);

  useEffect(() => { load(); }, [load]);

  const setStatus = (studentId: number, status: Status) =>
    setRows(rs => rs.map(r => r.student_id === studentId ? { ...r, status } : r));

  const markAll = (status: Status) =>
    setRows(rs => rs.map(r => ({ ...r, status })));

  const counts = {
    present: rows.filter(r => r.status === "present").length,
    absent: rows.filter(r => r.status === "absent").length,
    late: rows.filter(r => r.status === "late").length,
  };

  const handleSave = async () => {
    if (!classId) return;
    setSaving(true);
    try {
      await api.post(`/api/v1/academics/classes/${classId}/attendance`, {
        date,
        records: rows.map(r => ({ student_id: r.student_id, status: r.status })),
      });
      toast.success(`Attendance saved · ${counts.present} present, ${counts.absent} absent, ${counts.late} late`);
      setAlreadyMarked(true);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const fmtDate = (d: string) => {
    const [y, m, day] = d.split("-").map(Number);
    return new Date(y, m - 1, day).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/teacher/dashboard")}
          style={{ color: "#800020" }}>
          <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
        </Button>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>
            {className} — Attendance
          </h1>
          <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>
            {fmtDate(date)}{alreadyMarked && " · already recorded (you can update it)"}
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label className="text-xs block mb-1" style={{ color: "#9A9A9A" }}>Date</label>
            <Input type="date" value={date} max={today}
              onChange={e => setDate(e.target.value)} className="h-11 w-44" />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {(["present", "absent", "late"] as Status[]).map(s => {
          const meta = STATUS_META[s];
          return (
            <Card key={s} style={{ borderColor: "#E5E5E7" }}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: "#9A9A9A" }}>{meta.label}</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: "#2C2C2C" }}>
                    {loading ? "—" : counts[s]}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${meta.color}20` }}>
                  <meta.Icon size={20} style={{ color: meta.color }} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card style={{ borderColor: "#E5E5E7" }}>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin" size={28} style={{ color: "#001F5B" }} />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12">
              <Users size={44} className="mx-auto mb-3" style={{ color: "#9A9A9A" }} />
              <p className="font-semibold" style={{ color: "#2C2C2C" }}>No students in this class</p>
            </div>
          ) : (
            <>
              {/* quick actions */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <span className="text-sm" style={{ color: "#9A9A9A" }}>{rows.length} students</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => markAll("present")}
                    style={{ color: "#1A7F4B", borderColor: "#1A7F4B" }}>
                    Mark all present
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => markAll("absent")}
                    style={{ color: "#C0392B", borderColor: "#C0392B" }}>
                    Mark all absent
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {rows.map((r, index) => (
                  <div key={r.student_id}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                    style={{ borderColor: "#E5E5E7", backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#FAFAFA" }}>
                    <span className="text-sm w-6 flex-shrink-0" style={{ color: "#9A9A9A" }}>{index + 1}</span>
                    <span className="flex-1 font-medium min-w-0 truncate" style={{ color: "#2C2C2C" }}>
                      {r.name}
                    </span>
                    {/* segmented status control */}
                    <div className="inline-flex rounded-lg border overflow-hidden flex-shrink-0"
                      style={{ borderColor: "#E5E5E7" }}>
                      {(["present", "absent", "late"] as Status[]).map(s => {
                        const meta = STATUS_META[s];
                        const active = r.status === s;
                        return (
                          <button key={s} onClick={() => setStatus(r.student_id, s)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium transition-colors"
                            style={{
                              backgroundColor: active ? meta.bg : "#FFFFFF",
                              color: active ? "#FFFFFF" : "#9A9A9A",
                            }}>
                            <meta.Icon size={14} />
                            <span className="hidden sm:inline">{meta.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {rows.length > 0 && !loading && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="h-11"
            style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={18} className="mr-2" />}
            Save Attendance
          </Button>
        </div>
      )}
    </div>
  );
}
