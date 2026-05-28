import { useEffect, useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { api } from "../../../lib/api";

interface Notification {
  id: number;
  message: string;
  type: "info" | "success" | "warning" | "error";
  is_read: boolean;
  created_at: string;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const typeColor: Record<string, string> = {
  success: "#1A7F4B",
  warning: "#D97706",
  error: "#C0392B",
  info: "#2563EB",
};

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get<any>('/api/v1/notifications');
      setNotifications(Array.isArray(res) ? res : res.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: number) => {
    setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: true } : x));
    await api.put(`/api/v1/notifications/${id}/read`, {}).catch(() => {});
  };

  const markAllRead = async () => {
    setNotifications(n => n.map(x => ({ ...x, is_read: true })));
    await api.put('/api/v1/notifications/read-all', {}).catch(() => {});
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card style={{ borderColor: "#E5E5E7" }}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Notifications</CardTitle>
          {notifications.some(n => !n.is_read) && (
            <Button variant="ghost" size="sm" onClick={markAllRead} style={{ color: "#800020" }}>
              Mark all as read
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin" size={32} style={{ color: "#001F5B" }} />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell size={48} className="mx-auto mb-4" style={{ color: "#9A9A9A" }} />
              <p className="text-lg" style={{ color: "#9A9A9A" }}>No notifications yet</p>
              <p className="text-sm" style={{ color: "#9A9A9A" }}>You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#E5E5E7" }}>
              {notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => !n.is_read && markRead(n.id)}
                  className="w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-start gap-4"
                  style={{ backgroundColor: n.is_read ? "#FFFFFF" : "#F4F4F6" }}
                >
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: typeColor[n.type] ?? "#9A9A9A" }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm" style={{ color: "#2C2C2C" }}>{n.message}</p>
                    <p className="text-xs mt-1" style={{ color: "#9A9A9A" }}>{timeAgo(n.created_at)}</p>
                  </div>
                  {n.is_read && <Check size={16} style={{ color: "#1A7F4B" }} className="flex-shrink-0 mt-1" />}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
