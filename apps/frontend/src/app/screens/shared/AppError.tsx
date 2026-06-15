import { useRouteError, isRouteErrorResponse, useNavigate } from "react-router";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "../../components/ui/button";

export function AppError() {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = "Something went wrong";
  let message = "An unexpected error occurred. Please try again.";
  let detail: string | null = null;

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "Page not found";
      message = "The page you're looking for doesn't exist.";
    } else if (error.status === 403) {
      title = "Access denied";
      message = "You don't have permission to view this page.";
    } else {
      title = `Error ${error.status}`;
      message = error.statusText || message;
    }
  } else if (error instanceof Error) {
    message = error.message;
    detail = error.stack?.split('\n').slice(0, 3).join('\n') ?? null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: "#F4F4F6" }}>
      <div className="max-w-lg w-full text-center space-y-6">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
          style={{ backgroundColor: "#80002015" }}>
          <AlertTriangle size={40} style={{ color: "#800020" }} />
        </div>

        {/* Message */}
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#2C2C2C" }}>{title}</h1>
          <p style={{ color: "#9A9A9A" }}>{message}</p>
        </div>

        {/* Technical detail (dev-only style) */}
        {detail && (
          <pre className="text-left text-xs p-4 rounded-lg overflow-x-auto"
            style={{ backgroundColor: "#2C2C2C", color: "#F4F4F6", fontFamily: "monospace" }}>
            {detail}
          </pre>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => window.location.reload()}
            style={{ borderColor: "#E5E5E7", color: "#2C2C2C" }}>
            <RefreshCw size={16} className="mr-2" /> Try Again
          </Button>
          <Button onClick={() => navigate('/')}
            style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
            <Home size={16} className="mr-2" /> Go Home
          </Button>
        </div>

        <p className="text-xs" style={{ color: "#C0C0C0" }}>
          Jericho School Management System
        </p>
      </div>
    </div>
  );
}
