import {
  MAX_INTRO_LENGTH,
  MAX_QUESTION_WITH_OPTIONS_LENGTH,
  FIRST_NEWLINE_SEARCH_LIMIT,
  INDEX_OFFSET,
} from './constants.js';

/** Long paragraph threshold */
const LONG_PARAGRAPH_THRESHOLD = 150;

/** Minimum list items for question with options */
const MIN_LIST_ITEMS_FOR_OPTIONS = 2;

/** Constants */
const NOT_FOUND = -1;
const ZERO = 0;
const FIRST_MATCH = 1;
const SECOND_MATCH = 2;

/** Split result type */
export interface SplitResult {
  splitFound: boolean;
  newRemainingText: string;
}

/**
 * Checks if text has a question with response options pattern
 */
export const hasQuestionWithOptionsPattern = (text: string): boolean =>
  /^[^?]+\?\s*\n+[\s\S]*?(?:Puedes responder con|puedes responder con):[\s\S]*?\n+-/v.test(text);

/** Check if line ends with colon */
const lineEndsWithColon = (line: string | undefined): boolean => line?.trim().endsWith(':') === true;

/** Find the last line ending with colon */
const findLastColonLineIndex = (lines: string[]): number => {
  for (let i = lines.length - INDEX_OFFSET; i >= ZERO; i -= INDEX_OFFSET) {
    if (lineEndsWithColon(lines[i])) {
      return i;
    }
  }
  return NOT_FOUND;
};

/** Extract intro from match groups */
const extractIntro = (match: RegExpExecArray): string => {
  const { groups } = match;
  const part1 = groups?.intro ?? match[FIRST_MATCH] ?? '';
  const part2 = groups?.afterColon ?? match[SECOND_MATCH] ?? '';
  return part1 + part2;
};

/** Adjust intro for response prompts */
const adjustIntroForResponsePrompt = (intro: string): string => {
  if (!intro.includes('Puedes responder con:') && !intro.includes('puedes responder con:')) {
    return intro;
  }

  const lines = intro.split('\n');
  const lastColonIndex = findLastColonLineIndex(lines);

  if (lastColonIndex >= ZERO) {
    return lines.slice(ZERO, lastColonIndex + INDEX_OFFSET).join('\n');
  }

  return intro;
};

/**
 * Processes intro with list pattern and returns split info
 */
export const processIntroWithList = (remainingText: string, chunks: string[]): SplitResult => {
  const match = /^(?<intro>.+?:)(?<afterColon>[^\n]*?)\n+(?<listStart>\d{1,2}\.\s+|[\-•]\s+)/v.exec(remainingText);

  if (match === null) {
    return { splitFound: false, newRemainingText: remainingText };
  }

  const intro = extractIntro(match);
  const finalIntro = adjustIntroForResponsePrompt(intro);

  if (finalIntro.length < MAX_INTRO_LENGTH) {
    chunks.push(finalIntro);
    return { splitFound: true, newRemainingText: remainingText.substring(finalIntro.length).trim() };
  }

  return { splitFound: false, newRemainingText: remainingText };
};

/**
 * Processes question followed by numbered list (answer options)
 */
export const processQuestionWithList = (remainingText: string, chunks: string[]): SplitResult => {
  const match = /^(?<question>[\s\S]*?\?[^\n]*?)\n(?<list>\d{1,2}\.\s+[\s\S]*)/v.exec(remainingText);

  if (match === null) {
    return { splitFound: false, newRemainingText: remainingText };
  }

  const { groups } = match;
  const listPart = groups?.list ?? match[SECOND_MATCH] ?? '';
  const listLines = listPart.split('\n');
  const allLinesAreListItems = listLines.every((line) => line.trim() === '' || /^\d{1,2}\.\s+/v.test(line.trim()));
  const { length: listItemCount } = listLines.filter((l) => /^\d{1,2}\.\s+/v.test(l.trim()));

  const shouldProcess =
    allLinesAreListItems &&
    remainingText.length < MAX_QUESTION_WITH_OPTIONS_LENGTH &&
    listItemCount >= MIN_LIST_ITEMS_FOR_OPTIONS;

  if (shouldProcess) {
    chunks.push(remainingText);
    return { splitFound: true, newRemainingText: '' };
  }

  return { splitFound: false, newRemainingText: remainingText };
};

/** Check if intro ends with list pattern */
const endsWithListPattern = (intro: string): boolean =>
  /\d{1,2}\.\s*$/v.exec(intro) !== null || /[\-•]\s*$/v.exec(intro) !== null;

/**
 * Processes intro followed by long paragraphs
 */
export const processIntroWithLongParagraphs = (remainingText: string, chunks: string[]): SplitResult => {
  const firstNewline = remainingText.indexOf('\n');

  if (firstNewline === NOT_FOUND || firstNewline >= FIRST_NEWLINE_SEARCH_LIMIT) {
    return { splitFound: false, newRemainingText: remainingText };
  }

  const intro = remainingText.substring(ZERO, firstNewline).trim();

  if (!intro.endsWith(':') || endsWithListPattern(intro)) {
    return { splitFound: false, newRemainingText: remainingText };
  }

  const afterIntro = remainingText.substring(firstNewline + INDEX_OFFSET);
  const [firstParagraphRaw] = afterIntro.split('\n');
  const firstParagraph = (firstParagraphRaw ?? '').trim();

  if (firstParagraph.length > LONG_PARAGRAPH_THRESHOLD) {
    chunks.push(intro);
    return { splitFound: true, newRemainingText: afterIntro };
  }

  return { splitFound: false, newRemainingText: remainingText };
};
