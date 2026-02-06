import { INDEX_OFFSET } from './constants.js';
import type { SplitResult } from './splitProcessors.js';

/** Constants */
const NOT_FOUND = -1;
const ZERO = 0;
const FIRST_MATCH = 1;
const SECOND_MATCH = 2;

/** Question match info */
interface QuestionMatch {
  before: string;
  question: string;
}

/** Find question line by startsWith */
const findQuestionByStart = (lines: string[]): number =>
  lines.findIndex((line) => line.trim().startsWith('¿'));

/** Get line at index */
const getLineAt = (lines: string[], index: number): string | undefined => lines[index];

/** Find question in line pattern */
const findQuestionInLine = (lines: string[]): { index: number; match: QuestionMatch } | null => {
  for (let i = ZERO; i < lines.length; i += INDEX_OFFSET) {
    const line = getLineAt(lines, i);
    if (line === undefined) continue;

    const lineMatch = /^(?<before>.*?)\s+(?<question>¿[^\n?]+\?(?:\s*[^\s\n]+)?)$/v.exec(line);
    if (lineMatch !== null) {
      const { groups } = lineMatch;
      return {
        index: i,
        match: {
          before: groups?.before ?? lineMatch[FIRST_MATCH] ?? '',
          question: groups?.question ?? lineMatch[SECOND_MATCH] ?? '',
        },
      };
    }
  }
  return null;
};

/** Extract content and question when question is in a separate line */
const extractSeparateQuestion = (
  lines: string[],
  questionIndex: number
): { cardContent: string; question: string } => ({
  cardContent: lines.slice(ZERO, questionIndex).join('\n').trim(),
  question: lines.slice(questionIndex).join(' ').trim(),
});

/** Extract content and question when question is inline */
const extractInlineQuestion = (
  lines: string[],
  questionIndex: number,
  questionMatch: QuestionMatch
): { cardContent: string; question: string } => {
  const beforeLines = lines.slice(ZERO, questionIndex);
  beforeLines.push(questionMatch.before);
  const afterLines = lines.slice(questionIndex + INDEX_OFFSET);

  return {
    cardContent: beforeLines.join('\n').trim(),
    question: [questionMatch.question, ...afterLines].join(' ').trim(),
  };
};

/**
 * Extracts trailing question from card content
 */
export function extractTrailingQuestion(cleanedCard: string, chunks: string[]): { handled: boolean } {
  const lines = cleanedCard.split('\n');
  const questionByStart = findQuestionByStart(lines);
  const questionInLine = questionByStart === NOT_FOUND ? findQuestionInLine(lines) : null;

  const questionIndex = questionInLine?.index ?? questionByStart;

  if (questionIndex === NOT_FOUND) {
    return { handled: false };
  }

  const { cardContent, question } =
    questionInLine === null
      ? extractSeparateQuestion(lines, questionIndex)
      : extractInlineQuestion(lines, questionIndex, questionInLine.match);

  if (cardContent.length > ZERO) {
    chunks.push(cardContent);
  }
  if (question.length > ZERO) {
    chunks.push(question);
  }

  return { handled: true };
}

/** Product card patterns */
const EMOJI_PATTERN = /(?:\*{1,2})?\d+\.\s*🛍️/mv;
const MARKDOWN_PATTERN = /\d+\.\s+\*{1,2}[^*\n]+\*{1,2}\s*\n[💵🌈👟✅📏]/mv;

/** Get patterns based on detected type */
const getPatterns = (hasEmoji: boolean): { firstMatch: RegExp; cardPattern: RegExp } => {
  if (hasEmoji) {
    return {
      firstMatch: /^(?<intro>[\s\S]*?)(?<card>(?:\*{1,2})?\d+\.\s*🛍️)/v,
      cardPattern: /(?<card>(?:\*{1,2})?\d+\.\s*🛍️[\s\S]*?)(?=\n\s*\n|\n\s*(?:\*{1,2})?\d+\.\s*🛍️|$)/gv,
    };
  }
  return {
    firstMatch: /^(?<intro>[\s\S]*?)(?<card>\d+\.\s+\*{1,2}[^*\s])/v,
    cardPattern: /(?<card>\d+\.\s+\*{1,2}[^*\n]*[\s\S]*?)(?=\n\s*\n|\n\s*\d+\.\s+\*{1,2}[^*\s]|$)/gv,
  };
};

/** Extract product cards from text */
const extractProductCards = (text: string, pattern: RegExp): { cards: string[]; lastMatchEnd: number } => {
  const cards: string[] = [];
  let lastMatchEnd = ZERO;
  let match = pattern.exec(text);

  while (match !== null) {
    const { groups } = match;
    const card = groups?.card ?? match[FIRST_MATCH] ?? '';
    cards.push(card.trim());
    lastMatchEnd = match.index + match[ZERO].length;
    match = pattern.exec(text);
  }

  return { cards, lastMatchEnd };
};

/** Process a single product card */
const processCard = (card: string, isLastCard: boolean, hasEmoji: boolean, chunks: string[]): void => {
  if (card.trim().length === ZERO) return;

  const cleanedCard = hasEmoji
    ? card.replace(/^(?<asterisks>\*{1,2})?(?:\d+\.\s*)/v, '$<asterisks>')
    : card.replace(/^\d+\.\s+/v, '');

  if (isLastCard) {
    const result = extractTrailingQuestion(cleanedCard, chunks);
    if (result.handled) return;
  }

  chunks.push(cleanedCard);
};

/**
 * Processes product card lists
 */
export function processProductCardLists(remainingText: string, chunks: string[]): SplitResult {
  const hasEmoji = EMOJI_PATTERN.test(remainingText);
  const hasMarkdown = MARKDOWN_PATTERN.test(remainingText);

  if (!hasEmoji && !hasMarkdown) {
    return { splitFound: false, newRemainingText: remainingText };
  }

  const { firstMatch: firstMatchPattern, cardPattern } = getPatterns(hasEmoji);
  const firstMatch = firstMatchPattern.exec(remainingText);

  if (firstMatch === null) {
    return { splitFound: false, newRemainingText: remainingText };
  }

  const { groups } = firstMatch;
  const intro = (groups?.intro ?? firstMatch[FIRST_MATCH] ?? '').trim();
  const restAfterIntro = remainingText.substring((groups?.intro ?? '').length).trim();

  if (intro.length > ZERO) {
    chunks.push(intro);
  }

  const { cards, lastMatchEnd } = extractProductCards(restAfterIntro, cardPattern);

  cards.forEach((card, index) => {
    processCard(card, index === cards.length - INDEX_OFFSET, hasEmoji, chunks);
  });

  const afterCards = restAfterIntro.substring(lastMatchEnd).replace(/^\s+/v, '');

  return { splitFound: true, newRemainingText: afterCards };
}
