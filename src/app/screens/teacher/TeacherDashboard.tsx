import { useState, useEffect, useCallback } from "react";
import { BookOpen, Users, Loader2 } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2" style={{ color: "#2C2C2C" }}>
          Welcome, {user?.name ?? 'Teacher'}
        </h2>
        <p style={{ color: "#9A9A9A" }}>Your assigned classes:</p>
        {loading ? (
          <div className="flex items-center gap-2 mt-2">
            <Loader2 className="animate-spin" size={16} style={{ color: "#001F5B" }} />
            <span className="text-sm" style={{ color: "#9A9A9A" }}>Loading...</span>
          </div>
        ) : (
          <div className="flex gap-2 mt-2 flex-wrap">
            {classes.length === 0 ? (
              <span className="text-sm" style={{ color: "#9A9A9A" }}>No classes assigned yet</span>
            ) : (
              classes.map(cls => (
                <span key={cls.id} className="px-3 py-1 rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: "#001F5B" }}>
                  {cls.p_level?.name}{cls.name}
                </span>
              ))
            )}
          </div>
        )}
      </div>

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

                <Button onClick={() => navigate(`/teacher/class/${cls.id}?name=${encodeURIComponent((cls.p_level?.name ?? '') + cls.name)}`)} className="w-full"
                  style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
                  View Class
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
