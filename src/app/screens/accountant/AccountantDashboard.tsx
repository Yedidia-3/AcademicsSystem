import { Users, Utensils, Bus, AlertCircle } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router";

const stats = [
  { label: "Total Feeding Enrollments", value: "320", icon: Utensils, color: "#001F5B" },
  { label: "Total Transport Enrollments", value: "245", icon: Bus, color: "#800020" },
  { label: "Expiring Today", value: "5", icon: AlertCircle, color: "#C0392B" },
  { label: "Expiring in 3 Days", value: "12", icon: AlertCircle, color: "#D97706" },
];

export function AccountantDashboard() {
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
        <h3 className="text-lg font-semibold mb-4" style={{ color: "#2C2C2C" }}>Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            onClick={() => navigate("/accountant/enrollment/feeding")}
            className="h-20 flex flex-col items-center justify-center gap-2 bg-white"
            variant="outline"
            style={{ borderColor: "#E5E5E7" }}
          >
            <Utensils size={24} style={{ color: "#C9A84C" }} />
            <span style={{ color: "#2C2C2C" }}>Feeding Enrollments</span>
          </Button>
          <Button
            onClick={() => navigate("/accountant/enrollment/transport")}
            className="h-20 flex flex-col items-center justify-center gap-2 bg-white"
            variant="outline"
            style={{ borderColor: "#E5E5E7" }}
          >
            <Bus size={24} style={{ color: "#C9A84C" }} />
            <span style={{ color: "#2C2C2C" }}>Transport Enrollments</span>
          </Button>
          <Button
            onClick={() => navigate("/accountant/zones")}
            className="h-20 flex flex-col items-center justify-center gap-2 bg-white"
            variant="outline"
            style={{ borderColor: "#E5E5E7" }}
          >
            <Users size={24} style={{ color: "#C9A84C" }} />
            <span style={{ color: "#2C2C2C" }}>Manage Zones</span>
          </Button>
          <Button
            onClick={() => navigate("/accountant/communique")}
            className="h-20 flex flex-col items-center justify-center gap-2 bg-white"
            variant="outline"
            style={{ borderColor: "#E5E5E7" }}
          >
            <AlertCircle size={24} style={{ color: "#C9A84C" }} />
            <span style={{ color: "#2C2C2C" }}>Generate Communiqué</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
