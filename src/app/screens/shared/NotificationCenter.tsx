import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

interface Notification {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: "info" | "success" | "warning" | "error";
  link?: string;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    message: "P1 class list has been approved by the Principal",
    timestamp: "2 hours ago",
    read: false,
    type: "success",
    link: "/dean/distribute/P1",
  },
  {
    id: "2",
    message: "New user John Smith has been added to the system",
    timestamp: "5 hours ago",
    read: false,
    type: "info",
  },
  {
    id: "3",
    message: "P2 class list requires your approval",
    timestamp: "1 day ago",
    read: true,
    type: "warning",
    link: "/principal/review/P2",
  },
];

export function NotificationCenter() {
  const [notifications, setNotifications] = useState(mockNotifications);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success": return "#1A7F4B";
      case "warning": return "#D97706";
      case "error": return "#C0392B";
      default: return "#2563EB";
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card style={{ borderColor: "#E5E5E7" }}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Notifications</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-sm"
            style={{ color: "#800020" }}
          >
            Mark all as read
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell size={48} className="mx-auto mb-4" style={{ color: "#9A9A9A" }} />
              <p className="text-lg" style={{ color: "#9A9A9A" }}>No notifications yet</p>
              <p className="text-sm" style={{ color: "#9A9A9A" }}>You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#E5E5E7" }}>
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className="w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-start gap-4"
                  style={{
                    backgroundColor: notification.read ? "#FFFFFF" : "#F4F4F6",
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: getTypeColor(notification.type) }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium" style={{ color: "#2C2C2C" }}>
                      {notification.message}
                    </p>
                    <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>
                      {notification.timestamp}
                    </p>
                  </div>
                  {notification.read && (
                    <Check size={16} style={{ color: "#1A7F4B" }} className="flex-shrink-0 mt-1" />
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
