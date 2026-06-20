
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-dark-elevated border border-dark-border flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-primary-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white tracking-tight">404</h1>
          <p className="text-xl font-semibold text-slate-300">Page not found</p>
          <p className="text-dark-muted">
            Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
          </p>
        </div>

        <div className="pt-4">
          <Button variant="default" size="lg" className="w-full sm:w-auto gap-2" onClick={() => window.location.href = "/"}>
              <ArrowLeft className="w-4 h-4" />
              Back to home
          </Button>
        </div>
      </div>
    </div>
  );
}
