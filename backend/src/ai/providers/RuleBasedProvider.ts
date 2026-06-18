// ============================================================
// src/ai/providers/RuleBasedProvider.ts — Fallback AI Provider
// ============================================================
//
// 🎓 TEACHING: Rule-Based Systems
//
// Before Machine Learning, software used rule-based systems.
// Rules are explicit IF/THEN conditions written by humans.
//
// PROS:
//   - No API key needed
//   - Instant response (no network call)
//   - Deterministic (same input = same output always)
//   - Easy to understand and debug
//   - Free to run
//
// CONS:
//   - Only catches what rules cover (blind spots)
//   - "Uber" goes to Transportation but "Uber Eats" should go to Food
//   - Maintenance: rules need updating as language evolves
//
// This is the FALLBACK provider when no AI API key is configured.
// When Gemini IS configured, it handles edge cases automatically.
//
// DESIGN NOTE:
//   We export this as a concrete class implementing IAIProvider.
//   The AICategorizerService uses it via the interface — it
//   doesn't know it's a rule-based system vs neural network.
// ============================================================

import { IAIProvider, CategorizationResult } from "./IAIProvider";

// ── Category Rules ────────────────────────────────────────────
// Each rule: { keywords: string[], category: string }
// Keywords are matched case-insensitively against the description.
// ORDER MATTERS — more specific rules should come first.
const CATEGORY_RULES: Array<{ keywords: string[]; category: string }> = [
  // Food & Dining
  {
    category: "Food & Dining",
    keywords: [
      "restaurant", "cafe", "coffee", "pizza", "burger", "sushi",
      "food", "dinner", "lunch", "breakfast", "meal", "eat", "drink",
      "bar", "pub", "bistro", "grill", "takeaway", "delivery", "swiggy",
      "zomato", "doordash", "ubereats", "grubhub", "mcdonald", "kfc",
      "starbucks", "dunkin", "subway", "dominos", "bakery", "snack",
    ],
  },
  // Transportation
  {
    category: "Transportation",
    keywords: [
      "uber", "lyft", "taxi", "cab", "bus", "train", "metro", "subway",
      "fuel", "petrol", "gas station", "parking", "toll", "transport",
      "flight", "airline", "airport", "ferry", "ride", "ola", "rapido",
      "auto", "rickshaw", "commute",
    ],
  },
  // Shopping
  {
    category: "Shopping",
    keywords: [
      "amazon", "flipkart", "ebay", "walmart", "target", "shop",
      "store", "mall", "market", "purchase", "clothes", "clothing",
      "fashion", "shoes", "accessories", "electronics", "appliance",
      "ikea", "zara", "h&m", "myntra", "ajio",
    ],
  },
  // Entertainment
  {
    category: "Entertainment",
    keywords: [
      "netflix", "spotify", "youtube", "movie", "cinema", "theater",
      "concert", "show", "game", "gaming", "steam", "playstation",
      "xbox", "nintendo", "disney+", "hulu", "prime", "hotstar",
      "ticket", "event", "festival", "streaming",
    ],
  },
  // Healthcare
  {
    category: "Healthcare",
    keywords: [
      "hospital", "doctor", "clinic", "pharmacy", "medicine", "drug",
      "dentist", "health", "medical", "prescription", "lab", "test",
      "checkup", "therapy", "dental", "optical", "vision", "insurance",
    ],
  },
  // Housing
  {
    category: "Housing",
    keywords: [
      "rent", "mortgage", "lease", "property", "maintenance", "repair",
      "plumber", "electrician", "cleaning", "furniture", "home",
      "apartment", "landlord", "hoa", "housing",
    ],
  },
  // Education
  {
    category: "Education",
    keywords: [
      "school", "college", "university", "course", "class", "tuition",
      "book", "textbook", "udemy", "coursera", "tutorial", "training",
      "education", "exam", "fee", "study", "learn",
    ],
  },
  // Travel
  {
    category: "Travel",
    keywords: [
      "hotel", "airbnb", "hostel", "resort", "vacation", "holiday",
      "trip", "travel", "tour", "booking", "visa", "passport",
      "luggage", "suitcase", "makemytrip", "goibibo",
    ],
  },
  // Utilities
  {
    category: "Utilities",
    keywords: [
      "electricity", "water", "gas", "internet", "wifi", "broadband",
      "phone", "mobile", "bill", "utility", "cable", "isp", "jio",
      "airtel", "vodafone", "bsnl", "telecom",
    ],
  },
  // Fitness
  {
    category: "Fitness",
    keywords: [
      "gym", "fitness", "workout", "yoga", "pilates", "sports",
      "equipment", "protein", "supplement", "nike", "adidas", "training",
    ],
  },
  // Subscriptions
  {
    category: "Subscriptions",
    keywords: [
      "subscription", "monthly", "annual", "membership", "saas",
      "software", "app", "license", "renewal", "plan",
    ],
  },
  // Gifts & Donations
  {
    category: "Gifts & Donations",
    keywords: [
      "gift", "present", "donation", "charity", "birthday", "wedding",
      "anniversary", "celebrate", "ngo", "fund",
    ],
  },
  // Investments
  {
    category: "Investments",
    keywords: [
      "stock", "mutual fund", "etf", "crypto", "bitcoin", "investment",
      "trading", "broker", "dividend", "portfolio", "sip", "fd",
      "deposit", "zerodha", "groww", "robinhood", "coinbase",
    ],
  },
  // Business
  {
    category: "Business",
    keywords: [
      "office", "supplies", "printing", "postage", "client", "meeting",
      "conference", "coworking", "business", "professional", "service",
      "consulting", "freelance", "invoice",
    ],
  },
];

export class RuleBasedProvider implements IAIProvider {
  async categorize(
    description: string,
    _amount:     number
  ): Promise<CategorizationResult> {
    const normalizedDesc = description.toLowerCase().trim();

    // Score each category by how many keywords match
    let bestCategory   = "Other";
    let bestMatchCount = 0;

    for (const rule of CATEGORY_RULES) {
      const matchCount = rule.keywords.filter((kw) =>
        normalizedDesc.includes(kw.toLowerCase())
      ).length;

      if (matchCount > bestMatchCount) {
        bestMatchCount = matchCount;
        bestCategory   = rule.category;
      }
    }

    // Confidence calculation:
    //   0 matches  → 0.3 (low confidence — just the "Other" default)
    //   1 match    → 0.6 (moderate confidence)
    //   2+ matches → 0.85 (high confidence)
    const confidence =
      bestMatchCount === 0 ? 0.3
      : bestMatchCount === 1 ? 0.6
      : 0.85;

    return {
      categoryName: bestCategory,
      confidence,
      provider: "RULE_BASED",
    };
  }
}
