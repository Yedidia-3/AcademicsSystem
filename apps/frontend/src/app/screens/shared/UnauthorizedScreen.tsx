import { useNavigate } from "react-router";
import { Lock } from "lucide-react";
import { Button } from "../../components/ui/button";

export function UnauthorizedScreen() {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex items-center justify-center" style={{ backgroundColor: "#F4F4F6" }}>
      <div className="text-center space-y-6 max-w-md px-6">
        <Lock size={64} style={{ color: "#C9A84C" }} className="mx-auto" />
        <h2 className="text-3xl font-semibold" style={{ color: "#2C2C2C" }}>Access Denied</h2>
        <p className="text-lg" style={{ color: "#9A9A9A" }}>
          You don't have permission to view this page.
        </p>
        <Button
          onClick={() => navigate(-1)}
          className="h-11 px-6"
          style={{ backgroundColor: "#001F5B", color: "#FFFFFF" }}
        >
          Go back to Dashboard
        </Button>
      </div>
    </div>
  );
}
