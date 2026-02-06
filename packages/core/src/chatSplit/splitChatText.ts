import { processSectionBreaks } from './breakProcessor.js';
import { ZERO } from './constants.js';
import { normalizeInlineNumberedList, normalizeInlineProductCardList } from './listNormalization.js';
import { processListSection } from './listProcessor.js';
import { mergeSmallChunks } from './mergeProcessor.js';
import {
  processLongParagraphSequence,
  processLongParagraphsAfterIntro,
  processMarkdownSection,
} from './paragraphProcessor.js';
import { processPeriodSplits } from './periodProcessor.js';
import { processProductCardLists } from './productCardProcessor.js';
import { normalizeSpanishPunctuation } from './punctuationNormalization.js';
import { processQuestionMarks } from './questionProcessor.js';
import { PERIOD_SPLIT_TEXT_THRESHOLD } from './splitConstants.js';
import {
  processIntroWithList,
  processIntroWithLongParagraphs,
  processQuestionWithList,
} from './splitProcessors.js';
import { removePeriodsAfterURLs } from './urlNormalization.js';

/** Split result type for processor functions */
interface SplitProcessorResult {
  splitFound: boolean;
  newRemainingText: string;
}

/** Run intro and list processors */
const runIntroAndListProcessors = (remainingText: string, chunks: string[]): SplitProcessorResult | null => {
  const introResult = processIntroWithList(remainingText, chunks);
  if (introResult.splitFound) return introResult;

  const questionListResult = processQuestionWithList(remainingText, chunks);
  if (questionListResult.splitFound) return questionListResult;

  const longParaResult = processIntroWithLongParagraphs(remainingText, chunks);
  if (longParaResult.splitFound) return longParaResult;

  return null;
};

/** Run content structure processors */
const runContentStructureProcessors = (
  remainingText: string,
  chunks: string[]
): SplitProcessorResult | null => {
  const productCardResult = processProductCardLists(remainingText, chunks);
  if (productCardResult.splitFound) return productCardResult;

  const listResult = processListSection(remainingText, chunks);
  if (listResult.splitFound) return listResult;

  const longParaAfterIntroResult = processLongParagraphsAfterIntro(remainingText, chunks);
  if (longParaAfterIntroResult.splitFound) return longParaAfterIntroResult;

  const longParagraphResult = processLongParagraphSequence(remainingText, chunks);
  if (longParagraphResult.splitFound) return longParagraphResult;

  return null;
};

/** Run formatting processors */
const runFormattingProcessors = (remainingText: string, chunks: string[]): SplitProcessorResult | null => {
  const markdownResult = processMarkdownSection(remainingText, chunks);
  if (markdownResult.splitFound) return markdownResult;

  const sectionBreakResult = processSectionBreaks(remainingText, chunks);
  if (sectionBreakResult.splitFound) return sectionBreakResult;

  return null;
};

/**
 * Runs all split processors on the remaining text
 */
const runSplitProcessors = (remainingText: string, chunks: string[]): SplitProcessorResult => {
  const introResult = runIntroAndListProcessors(remainingText, chunks);
  if (introResult !== null) return introResult;

  const contentResult = runContentStructureProcessors(remainingText, chunks);
  if (contentResult !== null) return contentResult;

  const formatResult = runFormattingProcessors(remainingText, chunks);
  if (formatResult !== null) return formatResult;

  return { splitFound: false, newRemainingText: remainingText };
};

/**
 * Runs question and period processors
 */
const runQuestionAndPeriodProcessors = (remainingText: string, chunks: string[]): SplitProcessorResult => {
  const questionResult = processQuestionMarks(remainingText, chunks);
  if (questionResult.splitFound) {
    return questionResult;
  }

  if (remainingText.length > PERIOD_SPLIT_TEXT_THRESHOLD) {
    const periodResult = processPeriodSplits(remainingText, chunks);
    if (periodResult.splitFound) {
      return periodResult;
    }
  }

  return { splitFound: false, newRemainingText: remainingText };
};

/** Pre-process text before splitting */
const preProcessText = (text: string): string => {
  let processedText = removePeriodsAfterURLs(text);
  processedText = normalizeInlineNumberedList(processedText);
  processedText = normalizeInlineProductCardList(processedText);
  return processedText;
};

/**
 * Splits chat text into smaller chunks for better readability.
 * Handles various patterns like lists, questions, markdown sections, etc.
 */
export const splitChatText = (text: string | null | undefined): string[] => {
  if (text === null || text === undefined || text.length === ZERO) {
    return [];
  }

  const processedText = preProcessText(text);
  const chunks: string[] = [];
  let remainingText = processedText;

  while (remainingText !== '') {
    const { splitFound, newRemainingText } = runSplitProcessors(remainingText, chunks);

    if (splitFound) {
      remainingText = newRemainingText;
      continue;
    }

    const { splitFound: qpSplitFound, newRemainingText: qpNewText } = runQuestionAndPeriodProcessors(
      remainingText,
      chunks
    );

    if (qpSplitFound) {
      remainingText = qpNewText;
      continue;
    }

    chunks.push(remainingText);
    break;
  }

  const mergedChunks = mergeSmallChunks(chunks);
  const normalizedChunks = mergedChunks.map((chunk) => normalizeSpanishPunctuation(chunk));

  return normalizedChunks;
};
