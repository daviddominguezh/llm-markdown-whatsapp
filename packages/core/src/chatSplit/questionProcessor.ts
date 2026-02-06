import {
  COMBINED_LENGTH_THRESHOLD,
  DOUBLE_NEWLINE_DISTANCE_THRESHOLD,
  INDEX_OFFSET,
  LONG_QUESTION_THRESHOLD,
  SHORT_INTRO_THRESHOLD,
} from './constants.js';
import { isPositionInBulletLine, isPositionInsideParentheses } from './positionHelpers.js';
import type { SplitResult } from './splitProcessors.js';
import {
  findPositionAfterEmoji,
  hasTextContent,
  isParentheticalClarification,
  smartTrim,
  startsWithEmoji,
  startsWithLowercase,
} from './textHelpers.js';

/** Contiguous questions text length threshold */
const CONTIGUOUS_QUESTIONS_TEXT_THRESHOLD = 50;

/** Zero constant */
const ZERO = 0;

/** Not found constant */
const NOT_FOUND = -1;

/** Double newline offset */
const DOUBLE_NEWLINE_OFFSET = 2;

/** Increment constant */
const INCREMENT = 1;

/** Get first element of regex match */
const getFirstMatch = (match: RegExpExecArray): string => {
  const [firstElement] = match;
  return firstElement;
};

/** Get last element of array */
const getLastElement = <T>(arr: T[]): T | undefined => {
  const { length } = arr;
  return length > ZERO ? arr[length - INDEX_OFFSET] : undefined;
};

/**
 * Handles long question splitting
 */
export function handleLongQuestion(
  remainingText: string,
  chunks: string[],
  questionPart: string,
  afterQuestion: string
): SplitResult {
  if (startsWithLowercase(afterQuestion)) {
    return { splitFound: false, newRemainingText: remainingText };
  }

  if (startsWithEmoji(afterQuestion)) {
    const emojiEndPos = findPositionAfterEmoji(afterQuestion);
    const emojiPart = afterQuestion.substring(ZERO, emojiEndPos);
    const textAfterEmoji = afterQuestion.substring(emojiEndPos).trim();

    if (textAfterEmoji.length > ZERO) {
      chunks.push(`${questionPart} ${emojiPart}`);
      return { splitFound: true, newRemainingText: textAfterEmoji };
    }
  } else {
    chunks.push(questionPart);
    return { splitFound: true, newRemainingText: afterQuestion };
  }

  return { splitFound: false, newRemainingText: remainingText };
}

/**
 * Handles short question splitting
 */
export function handleShortQuestion(
  remainingText: string,
  chunks: string[],
  questionPart: string,
  afterQuestion: string
): SplitResult {
  const firstPeriodIndex = afterQuestion.indexOf('.');

  if (firstPeriodIndex !== NOT_FOUND && firstPeriodIndex < afterQuestion.length - INDEX_OFFSET) {
    const untilFirstPeriod = afterQuestion.substring(ZERO, firstPeriodIndex + INDEX_OFFSET);
    const combinedLength = questionPart.length + INDEX_OFFSET + untilFirstPeriod.length;

    if (combinedLength <= COMBINED_LENGTH_THRESHOLD) {
      return { splitFound: false, newRemainingText: remainingText };
    }
  }

  if (startsWithLowercase(afterQuestion)) {
    return { splitFound: false, newRemainingText: remainingText };
  }

  if (startsWithEmoji(afterQuestion)) {
    const emojiEndPos = findPositionAfterEmoji(afterQuestion);
    const emojiPart = afterQuestion.substring(ZERO, emojiEndPos);
    const textAfterEmoji = afterQuestion.substring(emojiEndPos).trim();

    if (textAfterEmoji.length > ZERO) {
      chunks.push(`${questionPart} ${emojiPart}`);
      return { splitFound: true, newRemainingText: textAfterEmoji };
    }
  } else {
    chunks.push(questionPart);
    return { splitFound: true, newRemainingText: afterQuestion };
  }

  return { splitFound: false, newRemainingText: remainingText };
}

/** Context for parenthetical split */
interface ParentheticalContext {
  remainingText: string;
  questionIndex: number;
  afterQuestionRaw: string;
  afterQuestion: string;
}

/** Handle parenthetical clarification split */
function handleParentheticalSplit(ctx: ParentheticalContext, chunks: string[]): SplitResult | null {
  const parentheticalMatch = /^\([^\)]+\)\?/v.exec(ctx.afterQuestion);
  if (parentheticalMatch === null) return null;

  const firstMatch = getFirstMatch(parentheticalMatch);
  const { length: parentheticalLength } = firstMatch;
  const afterParenthetical = smartTrim(ctx.afterQuestion.substring(parentheticalLength));

  if (!hasTextContent(afterParenthetical)) return null;

  const beforePart = ctx.remainingText.substring(
    ZERO,
    ctx.questionIndex + INDEX_OFFSET + ctx.afterQuestionRaw.indexOf(firstMatch) + parentheticalLength
  );
  chunks.push(beforePart);
  return { splitFound: true, newRemainingText: afterParenthetical };
}

/**
 * Processes a single question
 */
function processSingleQuestion(remainingText: string, chunks: string[], questionIndex: number): SplitResult {
  if (questionIndex >= remainingText.length - INDEX_OFFSET) {
    return { splitFound: false, newRemainingText: remainingText };
  }

  const afterQuestionRaw = remainingText.substring(questionIndex + INDEX_OFFSET);
  const afterQuestion = smartTrim(afterQuestionRaw);

  if (isParentheticalClarification(afterQuestion)) {
    const ctx: ParentheticalContext = { remainingText, questionIndex, afterQuestionRaw, afterQuestion };
    const result = handleParentheticalSplit(ctx, chunks);
    if (result !== null) return result;
  }

  if (!isParentheticalClarification(afterQuestion) && hasTextContent(afterQuestion)) {
    const questionPart = remainingText.substring(ZERO, questionIndex + INDEX_OFFSET);

    if (questionPart.length > LONG_QUESTION_THRESHOLD) {
      return handleLongQuestion(remainingText, chunks, questionPart, afterQuestion);
    }
    return handleShortQuestion(remainingText, chunks, questionPart, afterQuestion);
  }

  return { splitFound: false, newRemainingText: remainingText };
}

/**
 * Processes contiguous questions
 */
export function processContiguousQuestions(
  remainingText: string,
  chunks: string[],
  lastQuestionIdx: number
): SplitResult {
  if (lastQuestionIdx >= remainingText.length - INDEX_OFFSET) {
    return { splitFound: false, newRemainingText: remainingText };
  }

  const afterQuestionRaw = remainingText.substring(lastQuestionIdx + INDEX_OFFSET);
  const afterQuestion = smartTrim(afterQuestionRaw);

  if (!hasTextContent(afterQuestion)) {
    return { splitFound: false, newRemainingText: remainingText };
  }

  if (startsWithEmoji(afterQuestion)) {
    const emojiEndPos = findPositionAfterEmoji(afterQuestion);
    const emojiPart = afterQuestion.substring(ZERO, emojiEndPos);
    const textAfterEmoji = afterQuestion.substring(emojiEndPos).trim();

    if (textAfterEmoji.length > ZERO) {
      const beforePart = remainingText.substring(ZERO, lastQuestionIdx + INDEX_OFFSET);
      const spaceBeforeEmoji = remainingText.charAt(lastQuestionIdx + INDEX_OFFSET) === ' ' ? ' ' : '';
      chunks.push(beforePart + spaceBeforeEmoji + emojiPart);
      return { splitFound: true, newRemainingText: textAfterEmoji };
    }
  } else {
    const beforePart = remainingText.substring(ZERO, lastQuestionIdx + INDEX_OFFSET);
    const spaceAfterQuestion = remainingText.charAt(lastQuestionIdx + INDEX_OFFSET) === ' ' ? ' ' : '';
    chunks.push(beforePart + spaceAfterQuestion);
    return { splitFound: true, newRemainingText: afterQuestion };
  }

  return { splitFound: false, newRemainingText: remainingText };
}

/** Check if character is a question mark */
const isQuestionMark = (text: string, index: number): boolean => text[index] === '?';

/** Get first line from text */
const getFirstLineFromText = (text: string): string => {
  const firstLineEnd = text.indexOf('\n');
  return firstLineEnd === NOT_FOUND ? text : text.substring(ZERO, firstLineEnd);
};

/** Check if position has response options pattern after double newline */
const hasResponseOptionsAfterDoubleNewline = (afterQuestion: string): boolean => {
  const doubleNewlineAfter = afterQuestion.indexOf('\n\n');
  if (doubleNewlineAfter === NOT_FOUND || doubleNewlineAfter >= DOUBLE_NEWLINE_DISTANCE_THRESHOLD) {
    return false;
  }

  const afterDoubleNewline = afterQuestion.substring(doubleNewlineAfter + DOUBLE_NEWLINE_OFFSET);
  const firstLine = getFirstLineFromText(afterDoubleNewline);
  const trimmedFirstLine = firstLine.trim();

  const hasResponseOptions =
    trimmedFirstLine.length < SHORT_INTRO_THRESHOLD &&
    trimmedFirstLine.endsWith(':') &&
    afterDoubleNewline.includes('\n-');

  return hasResponseOptions;
};

/** Check if position is valid for question split */
const isValidQuestionPosition = (remainingText: string, position: number): boolean => {
  if (!isQuestionMark(remainingText, position)) return false;
  if (isPositionInBulletLine(remainingText, position)) return false;
  if (isPositionInsideParentheses(remainingText, position)) return false;

  const afterQuestion = remainingText.substring(position + INDEX_OFFSET);
  return !hasResponseOptionsAfterDoubleNewline(afterQuestion);
};

/**
 * Finds all question mark indices that are valid split points
 */
function findValidQuestionIndices(remainingText: string): number[] {
  const questionIndices: number[] = [];
  const { length: textLength } = remainingText;

  for (let i = ZERO; i < textLength; i += INCREMENT) {
    if (isValidQuestionPosition(remainingText, i)) {
      questionIndices.push(i);
    }
  }

  return questionIndices;
}

/**
 * Processes question marks for splitting
 */
export function processQuestionMarks(remainingText: string, chunks: string[]): SplitResult {
  const questionIndices = findValidQuestionIndices(remainingText);

  if (questionIndices.length === ZERO) {
    return { splitFound: false, newRemainingText: remainingText };
  }

  const [firstQuestionIdx] = questionIndices;
  const lastQuestionIdx = getLastElement(questionIndices);

  if (firstQuestionIdx === undefined || lastQuestionIdx === undefined) {
    return { splitFound: false, newRemainingText: remainingText };
  }

  const areContiguous =
    questionIndices.length > INDEX_OFFSET &&
    (() => {
      const textBetween = remainingText.substring(firstQuestionIdx + INDEX_OFFSET, lastQuestionIdx);
      return (
        !textBetween.includes('.') && smartTrim(textBetween).length < CONTIGUOUS_QUESTIONS_TEXT_THRESHOLD
      );
    })();

  if (areContiguous) {
    return processContiguousQuestions(remainingText, chunks, lastQuestionIdx);
  }

  return processSingleQuestion(remainingText, chunks, firstQuestionIdx);
}
