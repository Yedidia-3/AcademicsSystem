import { useNavigate } from "react-router";
import { Utensils, Bus } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

export function EnrollmentServiceSelector() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>
          Enrollment Management
        </h1>
        <p className="text-sm mt-2" style={{ color: "#9A9A9A" }}>
          Select a service to manage student enrollments
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* School Feeding Card */}
        <Card style={{ borderColor: "#E5E5E7" }} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-8 text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: "#C9A84C20" }}
            >
              <Utensils size={40} style={{ color: "#C9A84C" }} />
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: "#2C2C2C" }}>
              School Feeding
            </h2>
            <p className="text-sm mb-6" style={{ color: "#9A9A9A" }}>
              Manage breakfast and lunch subscriptions
            </p>
            <Button
              onClick={() => navigate("/accountant/enrollment/feeding")}
              className="w-full h-11"
              style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
            >
              View Feeding
            </Button>
          </CardContent>
        </Card>

        {/* Transport Card */}
        <Card style={{ borderColor: "#E5E5E7" }} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-8 text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: "#C9A84C20" }}
            >
              <Bus size={40} style={{ color: "#C9A84C" }} />
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: "#2C2C2C" }}>
              Transport
            </h2>
            <p className="text-sm mb-6" style={{ color: "#9A9A9A" }}>
              Manage transport zone subscriptions
            </p>
            <Button
              onClick={() => navigate("/accountant/enrollment/transport")}
              className="w-full h-11"
              style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
            >
              View Transport
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
