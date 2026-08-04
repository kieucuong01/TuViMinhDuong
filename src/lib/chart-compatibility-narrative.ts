export type CompatibilityNarrativeLevel = "flow" | "coordinate" | "discuss";
export type CompatibilityNarrativeThemeKey = "temperament" | "communication" | "commitment" | "finance" | "work" | "family";
export type NarrativeTrait = "leadership" | "analysis" | "action" | "expression" | "emotion" | "stability" | "change";
export type InteractionKind = "shared" | "complementary" | "contrast";

export type NarrativeProfile = {
  name: string;
  traits: NarrativeTrait[];
  primaryNeed: string;
  reassurance: string;
  contribution: string;
  friction: string;
};

export type NarrativeContext = {
  key: CompatibilityNarrativeThemeKey;
  level: CompatibilityNarrativeLevel;
  interaction: InteractionKind;
  seed: string;
  first: NarrativeProfile;
  second: NarrativeProfile;
};

export type NarrativeVariant<T> = {
  family: string;
  value: T;
};

export function stableHash(seed: string) {
  return [...seed].reduce((value, char) => ((value * 31) + char.charCodeAt(0)) >>> 0, 2166136261);
}

export function selectStableVariant<T>(variants: NarrativeVariant<T>[], seed: string, usedFamilies: Set<string>) {
  if (variants.length === 0) throw new Error("NARRATIVE_VARIANTS_REQUIRED");
  const available = variants.filter((variant) => !usedFamilies.has(variant.family));
  const pool = available.length ? available : variants;
  return pool[stableHash(seed) % pool.length];
}

export class NarrativeLedger {
  readonly openingFamilies = new Set<string>();
  readonly transitions = new Set<string>();
  readonly normalizedSentences = new Set<string>();
}
