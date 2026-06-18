import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="text-center space-y-6 animate-fade-in">
        <div className="text-8xl font-bold gradient-text">404</div>
        <h1 className="text-2xl font-semibold text-white">Page Not Found</h1>
        <p className="text-dark-muted">The page you're looking for doesn't exist.</p>
        <button className="btn-primary" onClick={() => navigate("/dashboard")}>
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
