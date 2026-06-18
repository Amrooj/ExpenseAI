// ============================================================
// src/ai/providers/GeminiProvider.ts — Gemini AI Provider
// ============================================================
//
// 🎓 TEACHING: Calling External APIs in a Service Layer
//
// We call the Gemini API here, inside the provider class.
// The rest of the application NEVER calls Gemini directly.
// If Gemini changes their API, we update ONLY this file.
//
// PROMPT ENGINEERING NOTE:
// Getting good results from AI requires careful prompt design.
// We use a "few-shot" prompt — giving the AI examples of what
// we expect. This dramatically improves accuracy.
//
// We also set `temperature: 0` for deterministic responses.
// Temperature 0 = the model always picks the most likely output.
// Temperature 1 = creative, random. For categorization, we want 0.
// ============================================================

import { GoogleGenerativeAI } from "@google/generative-ai";
import { IAIProvider, CategorizationResult } from "./IAIProvider";
import { env } from "../../config/env";
import { log } from "../../utils/logger";

const VALID_CATEGORIES = [
  "Food & Dining", "Transportation", "Shopping", "Entertainment",
  "Healthcare", "Housing", "Education", "Travel", "Utilities",
  "Personal Care", "Fitness", "Subscriptions", "Gifts & Donations",
  "Business", "Investments", "Other",
];

export class GeminiProvider implements IAIProvider {
  private readonly genAI: GoogleGenerativeAI;

  constructor() {
    if (!env.ai.geminiApiKey) {
      throw new Error("GEMINI_API_KEY is required to use the Gemini AI provider");
    }
    this.genAI = new GoogleGenerativeAI(env.ai.geminiApiKey);
  }

  async categorize(
    description: string,
    amount:      number
  ): Promise<CategorizationResult> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: "gemini-1.5-flash", // Fast and cheap — perfect for categorization
        generationConfig: {
          temperature:    0,   // Deterministic
          maxOutputTokens: 50, // We only need a short response
        },
      });

      const prompt = `
You are an expense categorizer. Given an expense description and amount,
return ONLY a JSON object with two fields:
- "category": one of ${VALID_CATEGORIES.join(", ")}
- "confidence": a number between 0 and 1

Examples:
Description: "Starbucks coffee", Amount: 5.50
Response: {"category": "Food & Dining", "confidence": 0.98}

Description: "Uber ride to airport", Amount: 35.00
Response: {"category": "Transportation", "confidence": 0.95}

Description: "Netflix monthly", Amount: 15.99
Response: {"category": "Subscriptions", "confidence": 0.99}

Now categorize:
Description: "${description.replace(/"/g, "'")}", Amount: ${amount}
Response:`;

      const result = await model.generateContent(prompt);
      const text   = result.response.text().trim();

      // Parse JSON response — extract just the JSON object
      const jsonMatch = text.match(/\{[^}]+\}/);
      if (!jsonMatch) {
        throw new Error(`Could not parse Gemini response: ${text}`);
      }

      const parsed = JSON.parse(jsonMatch[0]) as {
        category:   string;
        confidence: number;
      };

      // Validate that the returned category is one we recognize
      const validCategory = VALID_CATEGORIES.includes(parsed.category)
        ? parsed.category
        : "Other";

      return {
        categoryName: validCategory,
        confidence:   Math.min(1, Math.max(0, parsed.confidence)),
        provider:     "GEMINI",
      };

    } catch (error) {
      // If Gemini fails (network error, rate limit, bad response),
      // log the error but DON'T crash — graceful degradation.
      log.warn("Gemini categorization failed, returning low-confidence result", {
        description,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        categoryName: "Other",
        confidence:   0.2,
        provider:     "GEMINI",
      };
    }
  }
}
