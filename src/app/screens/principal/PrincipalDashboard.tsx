import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router";

const stats = [
  { label: "Pending Approvals", value: "2", icon: AlertCircle, color: "#D97706" },
  { label: "Approved This Year", value: "2", icon: CheckCircle, color: "#1A7F4B" },
  { label: "Rejected This Year", value: "1", icon: XCircle, color: "#C0392B" },
];

export function PrincipalDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        <h3 className="text-lg font-semibold mb-4" style={{ color: "#2C2C2C" }}>Pending Approvals</h3>
        <div className="space-y-3">
          {["P3", "P4"].map((pLevel) => (
            <div key={pLevel} className="flex items-center justify-between p-4 rounded-lg border bg-white" style={{ borderColor: "#E5E5E7" }}>
              <div>
                <span className="text-lg font-bold mr-3" style={{ color: "#2C2C2C" }}>{pLevel}</span>
                <span className="text-sm" style={{ color: "#9A9A9A" }}>Submitted by Dean of Studies</span>
              </div>
              <Button
                onClick={() => navigate(`/principal/review/${pLevel}`)}
                style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
              >
                Review
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
