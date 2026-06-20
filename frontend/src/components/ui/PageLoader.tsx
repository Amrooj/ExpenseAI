import { Sparkles } from "lucide-react";

export function PageLoader() {
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 mx-auto relative">
          <div className="absolute inset-0 rounded-2xl bg-primary-600/20 animate-pulse" />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" />
        </div>
        <p className="text-dark-muted text-sm">Loading ExpenseAI...</p>
      </div>
    </div>
  );
}
