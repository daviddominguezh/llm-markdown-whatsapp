import { MIN_CONTENT_BEFORE_BREAK, SHORT_INTRO_THRESHOLD } from './constants.js';
import { smartTrim } from './textHelpers.js';
import { hasQuestionWithOptionsPattern, type SplitResult } from './splitProcessors.js';

/** Long paragraph threshold */
const LONG_PARAGRAPH_THRESHOLD = 150;

/** Minimum list items for question with options */
const MIN_LIST_ITEMS_FOR_OPTIONS = 2;

/** Zero constant */
const ZERO = 0;

/** Not found constant */
const NOT_FOUND = -1;

/** Double newline offset */
const DOUBLE_NEWLINE_OFFSET = 2;

/** Check if double newline index is valid */
const isValidDoubleNewlineIndex = (index: number): boolean =>
  index !== NOT_FOUND && index > MIN_CONTENT_BEFORE_BREAK;

/** Check if text after break has markdown header */
const hasMarkdownAfterBreak = (afterBreak: string): boolean =>
  /^(?:\*[^*\n]+\*|_[^_\n]+_)\s*\n/v.test(afterBreak);

/** Get first line of text */
const getFirstLine = (text: string): string => {
  const newlineIndex = text.indexOf('\n');
  return newlineIndex === NOT_FOUND ? text : text.substring(ZERO, newlineIndex);
};

/** Check if text starts with bullet */
const startsWithBullet = (text: string): boolean => /^[\-•]\s+/v.test(text.trim());

/** Check if before part has long paragraphs */
const hasLongParagraphsInBefore = (beforeBreak: string): boolean => {
  const paragraphs = beforeBreak.split('\n').filter((p) => p.trim().length > ZERO);
  return paragraphs.length >= MIN_LIST_ITEMS_FOR_OPTIONS && paragraphs.some((p) => p.length > LONG_PARAGRAPH_THRESHOLD);
};

/** Check if before ends with question and has short intro pattern */
const isQuestionWithShortIntroBullets = (beforeBreak: string, firstLine: string, afterBreak: string): boolean =>
  beforeBreak.trim().endsWith('?') &&
  firstLine.trim().length < SHORT_INTRO_THRESHOLD &&
  firstLine.trim().endsWith(':') &&
  afterBreak.includes('\n-');

/** Check if before ends with response prompt and after starts with bullets */
const isResponsePromptWithBullets = (beforeBreak: string, afterBreakStartsWithBullets: boolean): boolean => {
  const trimmed = beforeBreak.trim();
  const endsWithPrompt = trimmed.endsWith('Puedes responder con:') || trimmed.endsWith('puedes responder con:');
  return endsWithPrompt && afterBreakStartsWithBullets;
};

/** Determine if we should not split at this break */
const shouldNotSplitAtBreak = (
  beforeBreak: string,
  firstLine: string,
  afterBreak: string,
  afterBreakStartsWithBullets: boolean
): boolean =>
  isQuestionWithShortIntroBullets(beforeBreak, firstLine, afterBreak) ||
  isResponsePromptWithBullets(beforeBreak, afterBreakStartsWithBullets) ||
  hasQuestionWithOptionsPattern(afterBreak);

/** Processes section breaks (double newlines) */
export function processSectionBreaks(remainingText: string, chunks: string[]): SplitResult {
  const doubleNewlineIndex = remainingText.indexOf('\n\n');

  if (!isValidDoubleNewlineIndex(doubleNewlineIndex)) {
    return { splitFound: false, newRemainingText: remainingText };
  }

  const beforeBreak = remainingText.substring(ZERO, doubleNewlineIndex);
  const afterBreak = remainingText.substring(doubleNewlineIndex + DOUBLE_NEWLINE_OFFSET);

  if (hasMarkdownAfterBreak(afterBreak)) {
    chunks.push(beforeBreak.trim());
    return { splitFound: true, newRemainingText: afterBreak };
  }

  const firstLine = getFirstLine(afterBreak);
  const afterBreakStartsWithBullets = startsWithBullet(afterBreak);

  if (smartTrim(afterBreak).length > ZERO && !hasLongParagraphsInBefore(beforeBreak)) {
    if (!shouldNotSplitAtBreak(beforeBreak, firstLine, afterBreak, afterBreakStartsWithBullets)) {
      chunks.push(beforeBreak);
      return { splitFound: true, newRemainingText: afterBreak };
    }
  }

  return { splitFound: false, newRemainingText: remainingText };
}
