/** Empty length constant */
const EMPTY_LENGTH = 0;

/** First character index */
const FIRST_INDEX = 0;

/**
 * Smart trim that only removes whitespace but preserves emojis and other Unicode characters
 */
export const smartTrim = (str: string): string =>
  // Remove only ASCII whitespace characters and common Unicode spaces
  str
    .replace(/^[\s\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000]+/v, '')
    .replace(/[\s\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000]+$/v, '');

/**
 * Check if a string contains only whitespace and/or emojis (no actual text content)
 */
export const hasTextContent = (str: string): boolean => {
  const trimmed = smartTrim(str);
  if (trimmed.length === EMPTY_LENGTH) return false;

  // Check if the trimmed string contains any alphanumeric or punctuation characters
  // If it only contains emojis/symbols, we don't consider it as having text content for splitting purposes
  const hasAlphaNumeric = /[a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/v.test(trimmed);
  return hasAlphaNumeric;
};

/**
 * Check if text after a question mark is just a parenthetical clarification
 * that should stay with the question (e.g., "(XS, S o M)?")
 */
export const isParentheticalClarification = (str: string): boolean => {
  const trimmed = smartTrim(str);
  if (trimmed.length === EMPTY_LENGTH) return false;

  // Check if it starts with opening parenthesis and contains a closing question mark
  // Pattern: (something)?
  const parentheticalPattern = /^\([^\)]+\)\?/v;
  return parentheticalPattern.test(trimmed);
};

/** Emoji pattern for detection with Unicode property escape */
const EMOJI_PATTERN = /\p{Emoji}/v;

/**
 * Check if text starts with an emoji using Unicode property escapes
 */
export const startsWithEmoji = (str: string): boolean => {
  if (str === '' || str.length === EMPTY_LENGTH) return false;
  const match = EMOJI_PATTERN.exec(str);
  return match !== null && match.index === FIRST_INDEX;
};

/**
 * Check if text starts with a lowercase letter (indicating continuation of sentence)
 */
export const startsWithLowercase = (str: string): boolean => {
  if (str === '' || str.length === EMPTY_LENGTH) return false;

  // Find the first alphabetic character (skipping whitespace and symbols)
  const firstLetterMatch = /[a-zA-ZáéíóúüñÁÉÍÓÚÜÑàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛäëïöüÄËÏÖÜ]/v.exec(str);
  if (firstLetterMatch === null) return false;

  const [firstLetter] = firstLetterMatch;
  // Check if it's lowercase
  return firstLetter === firstLetter.toLowerCase() && firstLetter !== firstLetter.toUpperCase();
};

/**
 * Find the position after the emoji (including any trailing spaces)
 * Returns the index where actual text content starts
 */
export const findPositionAfterEmoji = (str: string): number => {
  if (str === '' || str.length === EMPTY_LENGTH) return FIRST_INDEX;

  // Match emoji at the start using Unicode property escape, potentially followed by whitespace
  const emojiWithSpacePattern = /^\p{Emoji}+\s*/v;
  const match = emojiWithSpacePattern.exec(str);

  if (match !== null) {
    return match[FIRST_INDEX].length;
  }

  return FIRST_INDEX;
};
