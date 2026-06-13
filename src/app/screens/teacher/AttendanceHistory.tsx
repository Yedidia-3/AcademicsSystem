import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { History, Loader2, Check, X, Clock } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { api } from "../../../lib/api";
import { toast } from "sonner";
import { useAutoRefresh } from "../../../lib/useAutoRefresh";

interface HistoryRow {
  id: number;
  class_id: number;
  class_label: string;
  date: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  submitted_at: string;
}

function fmtDate(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export function AttendanceHistory() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get<any>('/api/v1/academics/teacher/attendance-history');
      setRows(Array.isArray(res) ? res : res.data ?? []);
    } catch {
      toast.error('Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>Attendance History</h1>
        <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>
          Every attendance you have submitted, archived by day
        </p>
      </div>

      <Card style={{ borderColor: "#E5E5E7" }}>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin" size={28} style={{ color: "#001F5B" }} />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12">
              <History size={44} className="mx-auto mb-3" style={{ color: "#9A9A9A" }} />
              <p className="font-semibold" style={{ color: "#2C2C2C" }}>No attendance recorded yet</p>
              <p className="text-sm mt-2" style={{ color: "#9A9A9A" }}>
                Submitted attendance will be archived here automatically.
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto" style={{ borderColor: "#E5E5E7" }}>
              <Table>
                <TableHeader style={{ backgroundColor: "#001F5B" }}>
                  <TableRow>
                    <TableHead className="text-white">Date</TableHead>
                    <TableHead className="text-white">Class</TableHead>
                    <TableHead className="text-white text-center">Present</TableHead>
                    <TableHead className="text-white text-center">Absent</TableHead>
                    <TableHead className="text-white text-center">Late</TableHead>
                    <TableHead className="text-white text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, index) => (
                    <TableRow key={r.id} style={{ backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F4F4F6" }}>
                      <TableCell className="font-medium" style={{ color: "#2C2C2C" }}>{fmtDate(r.date)}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded text-xs font-semibold text-white"
                          style={{ backgroundColor: "#001F5B" }}>{r.class_label}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 font-semibold" style={{ color: "#1A7F4B" }}>
                          <Check size={14} /> {r.present}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 font-semibold" style={{ color: "#C0392B" }}>
                          <X size={14} /> {r.absent}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 font-semibold" style={{ color: "#D97706" }}>
                          <Clock size={14} /> {r.late}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm"
                          onClick={() => navigate(`/teacher/class/${r.class_id}/attendance?name=${encodeURIComponent(r.class_label)}&date=${r.date}`)}
                          style={{ color: "#800020" }}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && rows.length > 0 && (
            <p className="text-sm mt-3" style={{ color: "#9A9A9A" }}>
              {rows.length} record{rows.length !== 1 ? 's' : ''} archived
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
