import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { GraduationCap, Loader2 } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { api } from "../../../lib/api";
import { toast } from "sonner";

interface ClassItem {
  id: number;
  name: string;
  p_level_id: number;
  p_level: { id: number; name: string; };
  students: { id: number; }[];
}

interface PLevelSummary {
  id: number;
  name: string;
  classCount: number;
  studentCount: number;
}

export function ClassListsSelector() {
  const navigate = useNavigate();
  const [pLevels, setPLevels] = useState<PLevelSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const years = await api.get<any>('/api/v1/academics/academic-years');
        const yearsList = Array.isArray(years) ? years : (years as any).data ?? [];
        const activeYear = yearsList.find((y: any) => y.status === 'active');
        if (!activeYear) {
          toast.error('No active academic year');
          setLoading(false);
          return;
        }

        const res = await api.get<any>(`/api/v1/academics/all-classes?academic_year_id=${activeYear.id}`);
        const classes: ClassItem[] = Array.isArray(res) ? res : res.data ?? [];

        // Group classes by p_level
        const map = new Map<number, PLevelSummary>();
        for (const cls of classes) {
          if (!cls.p_level) continue;
          const plId = cls.p_level.id;
          const existing = map.get(plId);
          const studentCount = cls.students?.length ?? 0;
          if (existing) {
            existing.classCount += 1;
            existing.studentCount += studentCount;
          } else {
            map.set(plId, {
              id: plId,
              name: cls.p_level.name,
              classCount: 1,
              studentCount,
            });
          }
        }

        // Sort by p-level name
        const sorted = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
        setPLevels(sorted);
      } catch {
        toast.error('Failed to load class lists');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>Class Lists</h1>
        <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>View student lists by P-Level</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin" size={28} style={{ color: "#001F5B" }} />
        </div>
      ) : pLevels.length === 0 ? (
        <div className="text-center py-16 border rounded-lg" style={{ borderColor: "#E5E5E7" }}>
          <GraduationCap size={48} className="mx-auto mb-3" style={{ color: "#9A9A9A" }} />
          <p className="text-lg font-semibold" style={{ color: "#2C2C2C" }}>No Class Lists Available</p>
          <p className="text-sm mt-2" style={{ color: "#9A9A9A" }}>
            Class lists become available after the Dean distributes the shuffle results.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pLevels.map((pl) => (
            <Card key={pl.id} style={{ borderColor: "#E5E5E7" }}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#001F5B20" }}>
                    <GraduationCap size={28} style={{ color: "#001F5B" }} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold" style={{ color: "#2C2C2C" }}>{pl.name}</h3>
                    <span className="inline-block px-2 py-1 rounded text-xs font-semibold text-white mt-1"
                      style={{ backgroundColor: "#1A7F4B" }}>
                      Active
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: "#9A9A9A" }}>Classes:</span>
                    <span className="font-semibold" style={{ color: "#2C2C2C" }}>{pl.classCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: "#9A9A9A" }}>Students:</span>
                    <span className="font-semibold" style={{ color: "#2C2C2C" }}>{pl.studentCount}</span>
                  </div>
                </div>

                <Button onClick={() => navigate(`/accountant/class-lists/${pl.id}`)}
                  className="w-full" style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
                  View Classes
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
