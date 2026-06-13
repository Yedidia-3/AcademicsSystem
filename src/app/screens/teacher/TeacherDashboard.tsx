import { useState, useEffect, useCallback } from "react";
import { BookOpen, Users, Loader2, GraduationCap, ClipboardCheck } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { useAutoRefresh } from "../../../lib/useAutoRefresh";

interface ClassData {
  id: number;
  name: string;
  p_level: { id: number; name: string; };
  student_count?: number;
  students?: any[];
}

export function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get<any>('/api/v1/academics/teacher/classes');
      setClasses(Array.isArray(res) ? res : res.data ?? []);
    } catch {
      // silent — empty state is shown
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load);

  const totalStudents = classes.reduce((sum, c) => sum + (c.student_count ?? c.students?.length ?? 0), 0);
  const firstName = (user?.name ?? "Teacher").split(" ")[0];
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  const stats = [
    { label: "My Classes", value: classes.length, icon: GraduationCap, color: "#001F5B" },
    { label: "Total Students", value: totalStudents, icon: Users, color: "#800020" },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting banner */}
      <div className="rounded-xl p-6 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(120deg, #001F5B 0%, #002a7a 100%)" }}>
        <div className="absolute right-0 top-0 w-40 h-40 rounded-full opacity-10"
          style={{ backgroundColor: "#C9A84C", transform: "translate(30%, -30%)" }} />
        <h2 className="text-2xl font-bold relative z-10">Welcome back, {firstName} 👋</h2>
        <p className="mt-1 relative z-10" style={{ color: "rgba(255,255,255,0.75)" }}>{todayLabel}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} style={{ borderColor: "#E5E5E7" }}>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: "#9A9A9A" }}>{stat.label}</p>
                  <p className="text-3xl font-bold mt-1" style={{ color: "#2C2C2C" }}>
                    {loading ? "—" : stat.value}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}20` }}>
                  <Icon size={24} style={{ color: stat.color }} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <h3 className="text-lg font-semibold" style={{ color: "#2C2C2C" }}>My Classes</h3>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin" size={32} style={{ color: "#001F5B" }} />
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-16 border rounded-lg" style={{ borderColor: "#E5E5E7" }}>
          <BookOpen size={48} className="mx-auto mb-3" style={{ color: "#9A9A9A" }} />
          <p className="text-lg font-semibold" style={{ color: "#2C2C2C" }}>No classes assigned yet</p>
          <p className="text-sm mt-2" style={{ color: "#9A9A9A" }}>
            The Dean will assign you to a class once the class lists are distributed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classes.map(cls => (
            <Card key={cls.id} style={{ borderColor: "#E5E5E7" }}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#80002020" }}>
                    <BookOpen size={24} style={{ color: "#800020" }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold" style={{ color: "#2C2C2C" }}>
                      {cls.p_level?.name}{cls.name}
                    </h3>
                    <span className="inline-block px-2 py-1 rounded text-xs font-semibold mt-1"
                      style={{ backgroundColor: "#C9A84C", color: "#2C2C2C" }}>
                      {cls.p_level?.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#80002020" }}>
                    <Users size={16} style={{ color: "#800020" }} />
                  </div>
                  <p className="text-sm" style={{ color: "#9A9A9A" }}>
                    {cls.student_count ?? cls.students?.length ?? 0} students
                  </p>
                </div>

                {(() => {
                  const label = encodeURIComponent((cls.p_level?.name ?? '') + cls.name);
                  return (
                    <div className="flex gap-2">
                      <Button onClick={() => navigate(`/teacher/class/${cls.id}?name=${label}`)}
                        className="flex-1" variant="outline"
                        style={{ color: "#800020", borderColor: "#800020" }}>
                        View Class
                      </Button>
                      <Button onClick={() => navigate(`/teacher/class/${cls.id}/attendance?name=${label}`)}
                        className="flex-1"
                        style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
                        Attendance
                      </Button>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
