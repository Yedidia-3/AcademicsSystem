import { GraduationCap, Users, CheckCircle, Share2 } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router";

const stats = [
  { label: "Total P-Levels Active", value: "5", icon: GraduationCap, color: "#001F5B" },
  { label: "Pending Approval", value: "2", icon: CheckCircle, color: "#D97706" },
  { label: "Distributed", value: "2", icon: Share2, color: "#1A7F4B" },
  { label: "Total Students", value: "485", icon: Users, color: "#800020" },
];

const pLevels = [
  { name: "P1", status: "Distributed", color: "#1A7F4B" },
  { name: "P2", status: "Approved", color: "#1A7F4B" },
  { name: "P3", status: "Pending Approval", color: "#D97706" },
  { name: "P4", status: "In Progress", color: "#C9A84C" },
  { name: "P5", status: "In Progress", color: "#C9A84C" },
];

export function DeanDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} style={{ borderColor: "#E5E5E7" }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: "#9A9A9A" }}>{stat.label}</p>
                    <p className="text-3xl font-bold mt-2" style={{ color: "#2C2C2C" }}>
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <Icon size={24} style={{ color: stat.color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: "#2C2C2C" }}>P-Level Status Overview</h3>
        <div className="space-y-3">
          {pLevels.map((pLevel) => (
            <div key={pLevel.name} className="flex items-center justify-between p-4 rounded-lg border bg-white" style={{ borderColor: "#E5E5E7" }}>
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold" style={{ color: "#2C2C2C" }}>{pLevel.name}</span>
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: pLevel.color }}
                >
                  {pLevel.status}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/dean/p-levels")}
                style={{ color: "#800020", borderColor: "#800020" }}
              >
                Manage
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Button
          onClick={() => navigate("/dean/import")}
          className="h-20"
          style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
        >
          Import Excel Data
        </Button>
        <Button
          onClick={() => navigate("/dean/p-levels")}
          className="h-20"
          variant="outline"
          style={{ color: "#001F5B", borderColor: "#001F5B" }}
        >
          View Pending Approvals
        </Button>
      </div>
    </div>
  );
}
