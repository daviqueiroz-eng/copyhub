// Pure text similarity utilities for detecting near-duplicate headlines.
// No external dependencies.

const STOPWORDS = new Set([
  "que", "o", "a", "os", "as", "de", "do", "da", "dos", "das",
  "e", "em", "um", "uma", "uns", "umas", "para", "pra", "com",
  "no", "na", "nos", "nas", "se", "é", "esta", "está", "ou",
  "mas", "por", "pelo", "pela", "te", "seu", "sua", "seus", "suas",
  "meu", "minha", "meus", "minhas", "ao", "à", "às", "aos",
  "como", "ja", "já", "lhe", "tem", "ter",
]);

export function normalize(text: string): string {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let inter = 0;
  setA.forEach((t) => {
    if (setB.has(t)) inter++;
  });
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}

function bigrams(text: string): Map<string, number> {
  const map = new Map<string, number>();
  const s = normalize(text).replace(/\s/g, "");
  for (let i = 0; i < s.length - 1; i++) {
    const bg = s.slice(i, i + 2);
    map.set(bg, (map.get(bg) || 0) + 1);
  }
  return map;
}

function cosineBigrams(a: string, b: string): number {
  const va = bigrams(a);
  const vb = bigrams(b);
  if (va.size === 0 || vb.size === 0) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  va.forEach((v) => (magA += v * v));
  vb.forEach((v) => (magB += v * v));
  va.forEach((v, k) => {
    const w = vb.get(k);
    if (w) dot += v * w;
  });
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

export function similarity(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  const j = jaccard(ta, tb);
  const c = cosineBigrams(a, b);
  return j * 0.6 + c * 0.4;
}

export type SimilarHeadlineCandidate = {
  key: string;
  headline: string;
  guia: number;
  ordem: number;
};

export type SimilarHeadlineMatch = SimilarHeadlineCandidate & {
  score: number;
};

export function compareHeadlines(
  input: string,
  candidates: SimilarHeadlineCandidate[],
  options: { threshold?: number; selfKey?: string } = {}
): SimilarHeadlineMatch[] {
  const threshold = options.threshold ?? 0.7;
  const inputTokens = tokenize(input);
  if (inputTokens.length < 4 || input.trim().length < 8) return [];

  const matches: SimilarHeadlineMatch[] = [];
  for (const cand of candidates) {
    if (options.selfKey && cand.key === options.selfKey) continue;
    const text = (cand.headline || "").trim();
    if (text.length < 8) continue;
    const candTokens = tokenize(text);
    if (candTokens.length < 4) continue;
    const score = similarity(input, text);
    if (score > threshold) {
      matches.push({ ...cand, score });
    }
  }
  return matches.sort((a, b) => b.score - a.score);
}