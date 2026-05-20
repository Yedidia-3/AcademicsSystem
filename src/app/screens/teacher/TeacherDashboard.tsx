import { BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router";

const assignedClasses = [
  { id: "P2A", name: "P2A", pLevel: "P2", studentCount: 32 },
  { id: "P3B", name: "P3B", pLevel: "P3", studentCount: 30 },
];

export function TeacherDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2" style={{ color: "#2C2C2C" }}>Welcome, Teacher</h2>
        <p style={{ color: "#9A9A9A" }}>Your assigned classes:</p>
        <div className="flex gap-2 mt-2">
          {assignedClasses.map((cls) => (
            <span
              key={cls.id}
              className="px-3 py-1 rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: "#001F5B" }}
            >
              {cls.name}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assignedClasses.map((cls) => (
          <Card key={cls.id} style={{ borderColor: "#E5E5E7" }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#80002020" }}
                >
                  <BookOpen size={24} style={{ color: "#800020" }} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold" style={{ color: "#2C2C2C" }}>{cls.name}</h3>
                  <span
                    className="inline-block px-2 py-1 rounded text-xs font-semibold mt-1"
                    style={{ backgroundColor: "#C9A84C", color: "#2C2C2C" }}
                  >
                    {cls.pLevel}
                  </span>
                </div>
              </div>
              <p className="text-sm mb-4" style={{ color: "#9A9A9A" }}>
                {cls.studentCount} students
              </p>
              <Button
                onClick={() => navigate(`/teacher/class/${cls.id}`)}
                className="w-full"
                style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
              >
                View Class
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
