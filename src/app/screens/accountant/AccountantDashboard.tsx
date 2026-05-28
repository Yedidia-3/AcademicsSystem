import { useState, useEffect } from "react";
import { Users, Utensils, Bus, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router";
import { api } from "../../../lib/api";

interface Enrollment {
  id: number;
  type: 'feeding' | 'transport';
  expiry_date: string;
  student: { id: number; name: string; } | null;
}

export function AccountantDashboard() {
  const navigate = useNavigate();
  const [feedingCount, setFeedingCount] = useState<number | null>(null);
  const [transportCount, setTransportCount] = useState<number | null>(null);
  const [expiringToday, setExpiringToday] = useState<number>(0);
  const [expiringIn3, setExpiringIn3] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [feeding, transport, expiring] = await Promise.all([
          api.get<any>('/api/v1/accountant/enrollments?type=feeding').catch(() => []),
          api.get<any>('/api/v1/accountant/enrollments?type=transport').catch(() => []),
          api.get<any>('/api/v1/accountant/enrollments/expiring?days=3').catch(() => []),
        ]);
        const feedingList: Enrollment[] = Array.isArray(feeding) ? feeding : feeding.data ?? [];
        const transportList: Enrollment[] = Array.isArray(transport) ? transport : transport.data ?? [];
        const expiringList: Enrollment[] = Array.isArray(expiring) ? expiring : expiring.data ?? [];

        setFeedingCount(feedingList.length);
        setTransportCount(transportList.length);

        const today = new Date().toISOString().split('T')[0];
        setExpiringToday(expiringList.filter(e => e.expiry_date === today).length);
        setExpiringIn3(expiringList.length);
      } catch {
        // silently fail, show zeros
        setFeedingCount(0); setTransportCount(0);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = [
    { label: "Feeding Enrollments", value: loading ? "—" : String(feedingCount ?? 0), icon: Utensils, color: "#001F5B" },
    { label: "Transport Enrollments", value: loading ? "—" : String(transportCount ?? 0), icon: Bus, color: "#800020" },
    { label: "Expiring Today", value: loading ? "—" : String(expiringToday), icon: AlertCircle, color: "#C0392B" },
    { label: "Expiring in 3 Days", value: loading ? "—" : String(expiringIn3), icon: AlertCircle, color: "#D97706" },
  ];

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
                    <p className="text-3xl font-bold mt-2" style={{ color: "#2C2C2C" }}>{stat.value}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}20` }}>
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
          {[
            { label: "Feeding Enrollments", icon: Utensils, path: "/accountant/enrollment/feeding" },
            { label: "Transport Enrollments", icon: Bus, path: "/accountant/enrollment/transport" },
            { label: "Manage Zones", icon: Users, path: "/accountant/zones" },
            { label: "Class Lists", icon: AlertCircle, path: "/accountant/class-lists" },
          ].map(({ label, icon: Icon, path }) => (
            <Button key={label} onClick={() => navigate(path)}
              className="h-20 flex flex-col items-center justify-center gap-2 bg-white"
              variant="outline" style={{ borderColor: "#E5E5E7" }}>
              <Icon size={24} style={{ color: "#C9A84C" }} />
              <span style={{ color: "#2C2C2C" }}>{label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
