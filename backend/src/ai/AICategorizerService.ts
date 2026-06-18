// ============================================================
// src/ai/AICategorizerService.ts — Strategy Pattern Consumer
// ============================================================
//
// 🎓 TEACHING: This is the Strategy Pattern in action.
//
// This service:
//   1. Reads env.ai.provider to decide which strategy to use
//   2. Creates the correct provider instance
//   3. Exposes ONE method: categorize()
//
// The rest of the app calls AICategorizerService.categorize()
// and has ZERO knowledge of Gemini or rule-based systems.
//
// This is dependency inversion — high-level modules (expense service)
// depend on abstractions (IAIProvider), not concrete implementations.
// ============================================================

import { IAIProvider } from "./providers/IAIProvider";
import { RuleBasedProvider } from "./providers/RuleBasedProvider";
import { GeminiProvider } from "./providers/GeminiProvider";
import { env } from "../config/env";
import { log } from "../utils/logger";
import * as categoryRepo from "../repositories/category.repository";

// ── Singleton AI Service ──────────────────────────────────────
// Create the provider once at startup — not on every request
let providerInstance: IAIProvider | null = null;

function getProvider(): IAIProvider {
  if (!providerInstance) {
    if (env.ai.provider === "gemini" && env.ai.geminiApiKey) {
      log.info("🤖 AI Provider: Gemini");
      providerInstance = new GeminiProvider();
    } else {
      if (env.ai.provider === "gemini" && !env.ai.geminiApiKey) {
        log.warn("Gemini provider selected but GEMINI_API_KEY is empty. Falling back to rule-based.");
      }
      log.info("🤖 AI Provider: Rule-Based");
      providerInstance = new RuleBasedProvider();
    }
  }
  return providerInstance;
}

// ── Categorization Result with DB Category ────────────────────
export interface AICategorizationResult {
  categoryId:   string;
  categoryName: string;
  confidence:   number;
  provider:     "GEMINI" | "RULE_BASED";
  requiresConfirmation: boolean; // true if confidence < 0.7
}

// ── Main Categorize Function ──────────────────────────────────
export async function categorizeExpense(
  description: string,
  amount:      number,
  userId:      string
): Promise<AICategorizationResult> {
  const provider = getProvider();

  // Get AI suggestion
  const result = await provider.categorize(description, amount);

  // Find the matching category in the database
  // (AI returns a name string → we need the DB category ID)
  let category = await categoryRepo.findCategoryByName(result.categoryName, userId);

  // If AI suggested a category that doesn't exist in DB, fall back to "Other"
  if (!category) {
    log.warn(`AI suggested unknown category: "${result.categoryName}", falling back to "Other"`);
    category = await categoryRepo.findCategoryByName("Other", userId);
  }

  // If even "Other" doesn't exist (shouldn't happen after seeding)
  if (!category) {
    throw new Error("Default category 'Other' not found. Did you run the database seed?");
  }

  // Confidence threshold: below 0.7 → ask user to confirm
  const requiresConfirmation = result.confidence < 0.7;

  return {
    categoryId:           category.id,
    categoryName:         category.name,
    confidence:           result.confidence,
    provider:             result.provider,
    requiresConfirmation,
  };
}

// ── Reset provider (for testing) ─────────────────────────────
export function resetProvider(): void {
  providerInstance = null;
}
