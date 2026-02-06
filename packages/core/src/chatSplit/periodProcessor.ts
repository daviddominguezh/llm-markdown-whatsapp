import {
  SHORT_QUESTION_FRAGMENT_THRESHOLD,
  SHORT_CHUNK_THRESHOLD,
  CURRENT_TEXT_SHORT_THRESHOLD,
  INDEX_OFFSET,
} from './constants.js';
import { smartTrim } from './textHelpers.js';
import { isPositionInsideParentheses } from './positionHelpers.js';
import type { SplitResult } from './splitProcessors.js';

/** Protected range interface */
interface ProtectedRange {
  start: number;
  end: number;
}

/** Constants */
const ZERO = 0;
const INCREMENT = 1;

/** Add matches from pattern to protected ranges */
const addPatternMatches = (text: string, pattern: RegExp, ranges: ProtectedRange[]): void => {
  const matches = text.matchAll(pattern);
  for (const match of matches) {
    const [matchedText] = match;
    ranges.push({ start: match.index, end: match.index + matchedText.length });
  }
};

/** Add period-ending matches to protected ranges */
const addPeriodEndingMatches = (text: string, pattern: RegExp, ranges: ProtectedRange[]): void => {
  const matches = text.matchAll(pattern);
  for (const match of matches) {
    const [matchedText] = match;
    const periodIndex = match.index + matchedText.length - INDEX_OFFSET;
    ranges.push({ start: periodIndex, end: periodIndex + INDEX_OFFSET });
  }
};

/** URL patterns */
const URL_PATTERN = /https?:\/\/[^\s]*[^\s.!?,;:]|www\.[^\s]*[^\s.!?,;:]/gv;
const PLAIN_DOMAIN_PATTERN =
  /\b[a-zA-Z0-9][a-zA-Z0-9\-]*(?:\.[a-zA-Z0-9][a-zA-Z0-9\-]*)*\.(?:com|co|net|org|edu|gov|io|ai|app|dev|ly|me|tv|info|biz|tech|store|shop|online|site|web|blog|news|uk|ca|au|de|fr|es|it|nl|mx|ar|br|cl|pe|ve|uy|py|bo|gt|hn|sv|cr|pa|ni|do|cu|pr)(?:\.[a-z]{2,3})?\b/giv;
const EMAIL_PATTERN = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/gv;
const NUMBER_PATTERN = /\$?\d{1,3}(?:\.\d{3})+(?:\.\d+)?|\d+(?:\.\d+)+/gv;

/** Period-ending patterns */
const NUMBERED_LIST_PATTERN = /(?:^|\n)\s*\d+\./gv;
const ABBREVIATIONS_PATTERN = /\b(?:etc|e\.g|i\.e|dr|mr|mrs|ms|prof|sr|jr|inc|ltd|co|corp)\./giv;
const LOCATION_ABBR_PATTERN = /\b[A-Z]\.(?:[A-Z]\.)+/gv;
const BULLET_POINT_PATTERN = /(?:^|\n)\s*[\-•]\s+[^\n]+\./gmv;

/** Find URL and email protected ranges */
const findUrlEmailRanges = (text: string): ProtectedRange[] => {
  const ranges: ProtectedRange[] = [];
  addPatternMatches(text, URL_PATTERN, ranges);
  addPatternMatches(text, PLAIN_DOMAIN_PATTERN, ranges);
  addPatternMatches(text, EMAIL_PATTERN, ranges);
  addPatternMatches(text, NUMBER_PATTERN, ranges);
  return ranges;
};

/** Find list and abbreviation protected ranges */
const findListAbbreviationRanges = (text: string): ProtectedRange[] => {
  const ranges: ProtectedRange[] = [];
  addPeriodEndingMatches(text, NUMBERED_LIST_PATTERN, ranges);
  addPeriodEndingMatches(text, ABBREVIATIONS_PATTERN, ranges);
  addPatternMatches(text, LOCATION_ABBR_PATTERN, ranges);
  addPeriodEndingMatches(text, BULLET_POINT_PATTERN, ranges);
  return ranges;
};

/** Finds all protected ranges in text */
const findProtectedRanges = (text: string): ProtectedRange[] => [
  ...findUrlEmailRanges(text),
  ...findListAbbreviationRanges(text),
];

/** Check if position is protected */
const isPositionProtected = (position: number, ranges: ProtectedRange[]): boolean =>
  ranges.some((range) => position >= range.start && position < range.end);

/** Finds all valid period indices for splitting */
const findValidPeriodIndices = (text: string, protectedRanges: ProtectedRange[]): number[] => {
  const periodIndices: number[] = [];

  for (let i = ZERO; i < text.length; i += INCREMENT) {
    if (text[i] !== '.') continue;
    if (isPositionProtected(i, protectedRanges)) continue;
    if (isPositionInsideParentheses(text, i)) continue;
    periodIndices.push(i);
  }

  return periodIndices;
};

/** Check if period should be skipped due to short question after */
const shouldSkipForShortQuestion = (afterPeriod: string): boolean =>
  afterPeriod.includes('?') && afterPeriod.length < SHORT_QUESTION_FRAGMENT_THRESHOLD;

/** Check if period should be skipped due to short chunks */
const shouldSkipForShortChunks = (
  chunks: string[],
  remainingTextLength: number,
  afterPeriodLength: number
): boolean => {
  const lastChunkIndex = chunks.length - INDEX_OFFSET;
  const lastChunk = lastChunkIndex >= ZERO ? chunks[lastChunkIndex] : undefined;

  // Original logic: if no last chunk, lastChunkWasShort is false (not true)
  const lastChunkWasShort = lastChunk !== undefined && lastChunk.trim().length < SHORT_CHUNK_THRESHOLD;
  const currentTextIsShort = remainingTextLength < CURRENT_TEXT_SHORT_THRESHOLD;
  const afterPeriodIsShort = afterPeriodLength < CURRENT_TEXT_SHORT_THRESHOLD;

  return lastChunkWasShort && currentTextIsShort && afterPeriodIsShort;
};

/** Process a single period for potential split */
const processSinglePeriod = (
  remainingText: string,
  periodIndex: number,
  chunks: string[]
): SplitResult | null => {
  if (periodIndex >= remainingText.length - INDEX_OFFSET) return null;

  const afterPeriod = smartTrim(remainingText.substring(periodIndex + INDEX_OFFSET));
  if (afterPeriod.length === ZERO) return null;

  if (shouldSkipForShortQuestion(afterPeriod)) return null;
  if (shouldSkipForShortChunks(chunks, remainingText.length, afterPeriod.length)) return null;

  const beforePart = remainingText.substring(ZERO, periodIndex + INDEX_OFFSET);
  chunks.push(beforePart);
  return { splitFound: true, newRemainingText: afterPeriod };
};

/** Processes period splits */
export function processPeriodSplits(remainingText: string, chunks: string[]): SplitResult {
  const protectedRanges = findProtectedRanges(remainingText);
  const periodIndices = findValidPeriodIndices(remainingText, protectedRanges);

  for (const periodIndex of periodIndices) {
    const result = processSinglePeriod(remainingText, periodIndex, chunks);
    if (result !== null) return result;
  }

  return { splitFound: false, newRemainingText: remainingText };
}
