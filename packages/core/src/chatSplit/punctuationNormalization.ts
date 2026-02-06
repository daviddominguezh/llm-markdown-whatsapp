/** Index offset for position calculations */
const INDEX_OFFSET = 1;
const ZERO = 0;
const INCREMENT = 1;
const DECREMENT = 1;

/** Letter regex pattern for Spanish and accented characters */
const LETTER_PATTERN = /[a-zA-ZáéíóúüñÁÉÍÓÚÜÑàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛäëïöüÄËÏÖÜ]/v;

/** Spanish punctuation marks to process */
const SPANISH_MARKS = ['¿', '¡'];

/** Get character at position safely */
const getCharAt = (text: string, position: number): string | undefined => text[position];

/** Check if character is a letter */
const isLetter = (char: string): boolean => LETTER_PATTERN.test(char);

/** Check if character is whitespace or newline */
const isWhitespaceOrNewline = (char: string): boolean => /[\s\n]/v.test(char);

/** Check if character is sentence-ending punctuation */
const isSentenceEnd = (char: string): boolean => char === '.' || char === '!' || char === '?';

/** Check if there's any letter before position in text */
const hasLetterBefore = (text: string, position: number): boolean => {
  for (let j = ZERO; j < position; j += INCREMENT) {
    const char = getCharAt(text, j);
    if (char !== undefined && isLetter(char)) {
      return true;
    }
  }
  return false;
};

/** Find next non-space character index after position */
const findNextNonSpaceIndex = (text: string, startIndex: number): number => {
  let index = startIndex;
  while (index < text.length && text[index] === ' ') {
    index += INCREMENT;
  }
  return index;
};

/** Find previous non-whitespace character info */
interface PrevCharInfo {
  index: number;
  foundLineBreak: boolean;
}

const findPrevNonWhitespaceInfo = (text: string, startIndex: number): PrevCharInfo => {
  let index = startIndex;
  let foundLineBreak = false;

  while (index >= ZERO) {
    const char = getCharAt(text, index);
    if (char === undefined || !isWhitespaceOrNewline(char)) break;
    if (char === '\n') {
      foundLineBreak = true;
    }
    index -= DECREMENT;
  }

  return { index, foundLineBreak };
};

/** Check if next character should trigger case change */
const shouldChangeCaseForNextChar = (nextChar: string): boolean =>
  nextChar === nextChar.toUpperCase() && nextChar !== nextChar.toLowerCase();

/** Get previous character from info */
const getPrevCharFromInfo = (text: string, prevInfo: PrevCharInfo): string =>
  prevInfo.index >= ZERO ? (getCharAt(text, prevInfo.index) ?? '') : '';

/** Check if position should skip processing */
const shouldSkipProcessing = (prevInfo: PrevCharInfo, prevChar: string, text: string, markIndex: number): boolean =>
  prevInfo.index < ZERO || isSentenceEnd(prevChar) || prevInfo.foundLineBreak || !hasLetterBefore(text, markIndex);

/**
 * Process a single mark occurrence in the text
 */
const processMarkOccurrence = (text: string, markIndex: number): string => {
  const nextCharIndex = findNextNonSpaceIndex(text, markIndex + INDEX_OFFSET);
  const { length: textLength } = text;

  if (nextCharIndex >= textLength) return text;

  const nextChar = getCharAt(text, nextCharIndex);
  if (nextChar === undefined || !isLetter(nextChar)) return text;

  const prevInfo = findPrevNonWhitespaceInfo(text, markIndex - INDEX_OFFSET);
  const prevChar = getPrevCharFromInfo(text, prevInfo);

  if (shouldSkipProcessing(prevInfo, prevChar, text, markIndex)) return text;

  if (shouldChangeCaseForNextChar(nextChar)) {
    return text.substring(ZERO, nextCharIndex) + nextChar.toLowerCase() + text.substring(nextCharIndex + INDEX_OFFSET);
  }

  return text;
};

/** Process all occurrences of a mark in text */
const processAllMarkOccurrences = (text: string, mark: string): string => {
  let result = text;
  let i = ZERO;

  while (i < result.length) {
    const char = getCharAt(result, i);
    if (char === mark) {
      result = processMarkOccurrence(result, i);
    }
    i += INCREMENT;
  }

  return result;
};

/**
 * Normalizes Spanish opening punctuation marks (¿ and ¡) to ensure proper capitalization.
 */
export const normalizeSpanishPunctuation = (text: string): string => {
  let result = text;

  for (const mark of SPANISH_MARKS) {
    result = processAllMarkOccurrences(result, mark);
  }

  return result;
};
