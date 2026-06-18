// ============================================================
// src/ai/providers/IAIProvider.ts — The Strategy Interface
// ============================================================
//
// 🎓 TEACHING: The Strategy Pattern
//
// Strategy Pattern = define a FAMILY of algorithms (AI providers),
// encapsulate each one, and make them interchangeable.
//
// HOW IT WORKS:
//   1. Define an INTERFACE (the "strategy contract")
//   2. Implement CONCRETE strategies (Gemini, rule-based)
//   3. The consumer (AICategorizerService) only knows the interface
//      — it doesn't care which strategy is being used
//
// BENEFIT:
//   Switch from Gemini → Claude → OpenAI by changing ONE env variable.
//   Zero changes to the service layer, the controller, or the routes.
//
// This is the OPEN/CLOSED principle from SOLID:
//   "Open for extension (add new providers), closed for modification"
//   (existing code doesn't change when you add a new provider)
//
// USED IN PRODUCTION:
//   Stripe uses Strategy for payment methods.
//   Auth0 uses it for authentication providers.
//   AWS SDK uses it for credential resolution.
// ============================================================

export interface CategorizationResult {
  categoryName: string;  // Suggested category name
  confidence:   number;  // 0.0 (guessing) to 1.0 (certain)
  provider:     "GEMINI" | "RULE_BASED";
}

// The contract: every AI provider MUST implement this method
export interface IAIProvider {
  categorize(description: string, amount: number): Promise<CategorizationResult>;
}
