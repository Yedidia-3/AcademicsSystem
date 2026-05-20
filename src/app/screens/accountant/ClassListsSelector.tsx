import { useNavigate } from "react-router";
import { GraduationCap, Users } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

const pLevels = [
  { id: "P1", name: "P1", classCount: 3, studentCount: 95, distributionDate: "2024-05-10", status: "Distributed" },
  { id: "P2", name: "P2", classCount: 3, studentCount: 92, distributionDate: "2024-05-12", status: "Distributed" },
  { id: "P3", name: "P3", classCount: 3, studentCount: 98, distributionDate: "2024-05-15", status: "Distributed" },
  { id: "P4", name: "P4", classCount: 3, studentCount: 100, distributionDate: "Pending", status: "Pending" },
  { id: "P5", name: "P5", classCount: 3, studentCount: 100, distributionDate: "Pending", status: "Pending" },
];

export function ClassListsSelector() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>
          Class Lists
        </h1>
        <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>
          View student lists by P-Level
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pLevels.map((pLevel) => (
          <Card key={pLevel.id} style={{ borderColor: "#E5E5E7" }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#00 1F5B20" }}
                >
                  <GraduationCap size={28} style={{ color: "#001F5B" }} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold" style={{ color: "#2C2C2C" }}>
                    {pLevel.name}
                  </h3>
                  <span
                    className="inline-block px-2 py-1 rounded text-xs font-semibold text-white mt-1"
                    style={{ backgroundColor: pLevel.status === "Distributed" ? "#1A7F4B" : "#D97706" }}
                  >
                    {pLevel.status}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: "#9A9A9A" }}>Classes:</span>
                  <span className="font-semibold" style={{ color: "#2C2C2C" }}>{pLevel.classCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: "#9A9A9A" }}>Students:</span>
                  <span className="font-semibold" style={{ color: "#2C2C2C" }}>{pLevel.studentCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: "#9A9A9A" }}>Distributed:</span>
                  <span className="font-semibold" style={{ color: "#2C2C2C" }}>{pLevel.distributionDate}</span>
                </div>
              </div>

              <Button
                onClick={() => navigate(`/accountant/class-lists/${pLevel.id}`)}
                disabled={pLevel.status === "Pending"}
                className="w-full"
                style={{ backgroundColor: pLevel.status === "Distributed" ? "#800020" : "#9A9A9A", color: "#FFFFFF" }}
              >
                View Classes
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
