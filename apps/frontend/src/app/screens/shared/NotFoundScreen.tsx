import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";

export function NotFoundScreen() {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex items-center justify-center" style={{ backgroundColor: "#F4F4F6" }}>
      <div className="text-center space-y-6 max-w-md px-6">
        <h1 className="text-8xl font-bold" style={{ color: "#800020" }}>404</h1>
        <h2 className="text-3xl font-semibold" style={{ color: "#2C2C2C" }}>Page not found</h2>
        <p className="text-lg" style={{ color: "#9A9A9A" }}>
          The page you are looking for doesn't exist.
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
