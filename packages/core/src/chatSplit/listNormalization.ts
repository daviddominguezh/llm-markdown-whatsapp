import { INDEX_OFFSET, MAX_LIST_NUMBER } from './constants.js';

/** Zero constant */
const ZERO = 0;

/** Not found constant for indexOf */
const NOT_FOUND = -1;

/** Match info for list item replacement */
interface ListMatchInfo {
  match: string;
  before: string;
  num: string;
  after: string;
  offset: number;
}

/** Replacement info */
interface ReplacementInfo {
  start: number;
  end: number;
  replacement: string;
}

/** Get replacement at index */
const getReplacementAt = (replacements: ReplacementInfo[], index: number): ReplacementInfo | undefined =>
  replacements[index];

/** Check if text is already formatted */
const isAlreadyFormatted = (text: string): boolean => /\d{1,2}\.\s+[^\n]+\n\s*\d{1,2}\.\s+/v.test(text);

/** Check for inline list patterns */
const hasInlineListPatterns = (text: string): boolean => {
  const afterColon = /:[^\n]*\d{1,2}\.\s+[^\n]+[ ]+\d{1,2}\.\s+/v.test(text);
  const afterPunctuation = /[?!][^\n]*\s+1\.\s+[^\n]+[ ]+2\.\s+/v.test(text);
  return afterColon || afterPunctuation;
};

/** Check if offset is preceded by a digit (version number pattern) */
const isPrecededByDigit = (text: string, offset: number): boolean => {
  if (offset <= ZERO) return false;
  const charBefore = text.charAt(offset - INDEX_OFFSET);
  return /\d/v.test(charBefore);
};

/** Process a single list match and return replacement */
const processListMatch = (info: ListMatchInfo, text: string): string => {
  const numValue = parseInt(info.num, 10);

  if (numValue > MAX_LIST_NUMBER) return info.match;
  if (isPrecededByDigit(text, info.offset)) return info.match;

  if (info.num === '1' && info.before === ':') {
    return `${info.before}\n${info.num}. ${info.after}`;
  }

  if (info.before.trim() === '' || info.before === ':') {
    return `\n${info.num}. ${info.after}`;
  }

  return info.match;
};

/** Get string length safely */
const getStringLength = (str: string): number => str.length;

/** Create list match info from regex match */
const createListMatchInfo = (match: RegExpExecArray): ListMatchInfo => {
  const { groups } = match;
  const [firstMatch = ''] = match;
  return {
    match: firstMatch,
    before: groups?.before ?? '',
    num: groups?.num ?? '',
    after: groups?.after ?? '',
    offset: match.index,
  };
};

/** Collect all replacements from text */
const collectReplacements = (text: string): ReplacementInfo[] => {
  const pattern = /(?<before>[:\s?!])(?<num>\d{1,2})\.\s+(?<after>[^\n])/gv;
  const replacements: ReplacementInfo[] = [];
  let match = pattern.exec(text);

  while (match !== null) {
    const info = createListMatchInfo(match);
    const replacement = processListMatch(info, text);
    if (replacement !== info.match) {
      const matchLength = getStringLength(info.match);
      replacements.push({ start: match.index, end: match.index + matchLength, replacement });
    }
    match = pattern.exec(text);
  }

  return replacements;
};

/** Apply replacements in reverse order */
const applyReplacements = (text: string, replacements: ReplacementInfo[]): string => {
  let result = text;
  const { length: count } = replacements;

  for (let i = count - INDEX_OFFSET; i >= ZERO; i -= INDEX_OFFSET) {
    const r = getReplacementAt(replacements, i);
    if (r !== undefined) {
      result = result.substring(ZERO, r.start) + r.replacement + result.substring(r.end);
    }
  }

  return result;
};

/**
 * Detects if text contains an inline numbered list pattern like "1. X 2. Y 3. Z"
 * and normalizes it by adding line breaks between items
 * IMPORTANT: Only normalizes truly inline lists, preserves already-formatted lists
 */
export const normalizeInlineNumberedList = (text: string): string => {
  if (isAlreadyFormatted(text)) return text;
  if (!hasInlineListPatterns(text)) return text;

  const replacements = collectReplacements(text);
  return applyReplacements(text, replacements);
};

/**
 * Normalizes inline product card lists by adding line breaks.
 * Detects patterns like "**1. 🛍️ Product** 💵 Price... **2. 🛍️ Product** 💵 Price..."
 * and adds line breaks before each numbered item and emoji indicators.
 */
export const normalizeInlineProductCardList = (text: string): string => {
  // Check if we have inline product cards (numbered items with 🛍️ or markdown + emoji indicators on same line)
  // Pattern 1: Multiple product cards - "1. 🛍️...2. 🛍️"
  // Pattern 2: Single product card - "1. 🛍️" followed by emoji indicators without line breaks
  const hasInlineProductCards =
    /(?:\*{1,2})?\d+\.\s*🛍️[^\n]*\s+(?:\*{1,2})?\d+\.\s*🛍️/v.test(text) ||
    /\d+\.\s+\*{1,2}[^*\n]+\*{1,2}\s+\p{Extended_Pictographic}[^\n]+\s+(?:\*{1,2})?\d+\.\s+/v.test(text) ||
    /(?:\*{1,2})?\d+\.\s*🛍️[^\n]+\p{Extended_Pictographic}[^\n]+\p{Extended_Pictographic}/v.test(text);

  if (!hasInlineProductCards) {
    return text; // No inline product cards, return as-is
  }

  let result = text;

  // Step 1: Add line break before numbered product card items (but not the first one)
  // Pattern matches: "**2. 🛍️" or "*2. 🛍️" or "2. 🛍️" or "**2. *Title*" or "*2. *Title*"
  // Must be preceded by a period, exclamation, or emoji from previous card
  result = result.replace(/(?<punct>[.!✅])\s+(?<card>\*{0,2}\d+\.\s+(?:🛍️|\*{1,2}))/gv, '$<punct>\n$<card>');

  // Step 2: Add line breaks before ANY emoji when not already on new line
  // Only apply to content AFTER the first 🛍️ marker (to avoid affecting intro text)
  // But NOT if they immediately follow the product card number pattern (to avoid breaking "1. 🛍️")
  const firstProductMarker = result.indexOf('🛍️');
  if (firstProductMarker !== NOT_FOUND) {
    const beforeProducts = result.substring(ZERO, firstProductMarker);
    const productsContent = result.substring(firstProductMarker);

    const transformedProducts = productsContent.replace(
      /(?<before>[^\n])\s+(?<emoji>\p{Extended_Pictographic})/gv,
      (match, before: string, emoji: string) => {
        // Don't add newline if the emoji follows a number and period (like "1. 🛍️")
        if (/\d\.\s*$/v.test(before)) {
          return match;
        }
        // Don't add newline if there's no actual space (protects emoji sequences)
        if (!/\s/v.test(match)) {
          return match;
        }
        return `${before}\n${emoji}`;
      }
    );

    result = beforeProducts + transformedProducts;
  }

  // Step 3: Add line break before trailing questions (after product card content)
  // Pattern: period/exclamation followed by space and question starting with ¿
  // Keep the trailing emoji with the question
  result = result.replace(
    /(?<punctuation>[.!])\s+(?<question>¿[^\n?]*\?(?:\s*[^\s\n]+)?)$/mv,
    (_match, punctuation: string, question: string) =>
      // Check if question ends with an emoji - if so, keep it together
      `${punctuation}\n${question.trim()}`
  );

  return result;
};
