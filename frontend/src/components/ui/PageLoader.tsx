// Full-page loading spinner shown during lazy route loading
export function PageLoader() {
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="text-center space-y-4">
        {/* Animated logo */}
        <div className="w-16 h-16 mx-auto relative">
          <div className="absolute inset-0 rounded-2xl bg-primary-600/20 animate-pulse" />
          <div className="absolute inset-2 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
            <span className="text-white font-bold text-xl">₿</span>
          </div>
        </div>
        {/* Spinner */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" />
        </div>
        <p className="text-dark-muted text-sm">Loading ExpenseAI...</p>
      </div>
    </div>
  );
}
