import { useState } from "react";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  dean: "Dean of Studies",
  principal: "Principal",
  teacher: "Teacher",
  accountant: "Accountant",
};

export function ProfileSettings() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const initials = user?.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) ?? "??";

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { setError("New passwords do not match"); return; }
    if (currentPassword === newPassword) { setError("New password must be different from current"); return; }

    setSaving(true);
    try {
      await api.post('/api/v1/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success("Password updated successfully");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: any) {
      setError(err.message ?? "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <Card style={{ borderColor: "#E5E5E7" }}>
        <CardHeader><CardTitle>Profile Settings</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <Avatar className="h-24 w-24" style={{ backgroundColor: "#001F5B" }}>
              <AvatarFallback className="text-white text-2xl">{initials}</AvatarFallback>
            </Avatar>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input value={user?.name ?? ""} readOnly className="mt-2 h-11"
                style={{ backgroundColor: "#F4F4F6", color: "#9A9A9A" }} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email ?? ""} readOnly className="mt-2 h-11"
                style={{ backgroundColor: "#F4F4F6", color: "#9A9A9A" }} />
            </div>
            <div>
              <Label>Role</Label>
              <div className="mt-2">
                <span className="inline-block px-4 py-2 rounded-md text-sm font-semibold"
                  style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
                  {roleLabels[user?.role ?? ""] ?? user?.role}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t" style={{ borderColor: "#E5E5E7" }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: "#2C2C2C" }}>Change Password</h3>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)} className="mt-2 h-11" required />
              </div>
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" value={newPassword}
                  onChange={e => setNewPassword(e.target.value)} className="mt-2 h-11" required />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)} className="mt-2 h-11" required />
              </div>
              {error && (
                <div className="p-3 rounded-md text-sm" style={{ backgroundColor: "#FEE", color: "#C0392B" }}>{error}</div>
              )}
              <Button type="submit" className="w-full h-11" disabled={saving}
                style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Update Password"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
