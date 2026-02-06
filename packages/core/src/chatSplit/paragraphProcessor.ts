import { FIRST_NEWLINE_SEARCH_LIMIT, INDEX_OFFSET } from './constants.js';
import { findMarkdownSection } from './sections.js';
import { type SplitResult, hasQuestionWithOptionsPattern } from './splitProcessors.js';

/** Long paragraph threshold */
const LONG_PARAGRAPH_THRESHOLD = 150;

/** Minimum list items for question with options */
const MIN_LIST_ITEMS_FOR_OPTIONS = 2;

/** Zero constant for comparisons */
const ZERO = 0;

/**
 * Processes long paragraphs after an intro
 */
export function processLongParagraphsAfterIntro(remainingText: string, chunks: string[]): SplitResult {
  const firstNewline = remainingText.indexOf('\n');
  const NOT_FOUND = -1;

  if (firstNewline === NOT_FOUND || firstNewline >= FIRST_NEWLINE_SEARCH_LIMIT) {
    return { splitFound: false, newRemainingText: remainingText };
  }

  const firstLine = remainingText.substring(ZERO, firstNewline);
  if (!firstLine.trim().endsWith(':')) {
    return { splitFound: false, newRemainingText: remainingText };
  }

  const afterIntro = remainingText.substring(firstNewline + INDEX_OFFSET);
  const paragraphs = afterIntro.split('\n').filter((p) => p.trim().length > ZERO);

  if (
    paragraphs.length >= MIN_LIST_ITEMS_FOR_OPTIONS &&
    paragraphs.some((p) => p.length > LONG_PARAGRAPH_THRESHOLD)
  ) {
    chunks.push(firstLine.trim());
    return { splitFound: true, newRemainingText: afterIntro };
  }

  return { splitFound: false, newRemainingText: remainingText };
}

/**
 * Processes sequence of long paragraphs
 */
export function processLongParagraphSequence(remainingText: string, chunks: string[]): SplitResult {
  const lines = remainingText.split('\n');
  const [firstLine] = lines;

  if (lines.length < MIN_LIST_ITEMS_FOR_OPTIONS || firstLine === undefined) {
    return { splitFound: false, newRemainingText: remainingText };
  }

  const firstParagraph = firstLine.trim();
  if (firstParagraph.length <= LONG_PARAGRAPH_THRESHOLD) {
    return { splitFound: false, newRemainingText: remainingText };
  }

  const afterFirstParagraph = lines.slice(INDEX_OFFSET).join('\n').trim();
  const hasQuestionWithOptions = hasQuestionWithOptionsPattern(afterFirstParagraph);

  if (!hasQuestionWithOptions) {
    chunks.push(firstParagraph);
    return { splitFound: true, newRemainingText: afterFirstParagraph };
  }

  return { splitFound: false, newRemainingText: remainingText };
}

/**
 * Processes markdown sections
 */
export function processMarkdownSection(remainingText: string, chunks: string[]): SplitResult {
  const markdownSection = findMarkdownSection(remainingText);

  if (markdownSection !== null) {
    chunks.push(markdownSection.fullSection.trim());
    return {
      splitFound: true,
      newRemainingText: remainingText.substring(markdownSection.fullSection.length).trim(),
    };
  }

  return { splitFound: false, newRemainingText: remainingText };
}
