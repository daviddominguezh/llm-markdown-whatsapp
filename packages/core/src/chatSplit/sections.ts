/** Result of finding a markdown section */
export interface MarkdownSectionResult {
  header: string;
  content: string;
  fullSection: string;
}

/** Result of finding a list section */
export interface ListSectionResult {
  start: number;
  end: number;
  type: 'numbered' | 'bullet';
}

/** Constants for section processing */
const NOT_FOUND = -1;
const FIRST_ELEMENT = 1;
const DOUBLE_NEWLINE_LENGTH = 2;
const ZERO = 0;
const INCREMENT = 1;

/** Check if text after double newline starts with a markdown header */
const startsWithMarkdownHeader = (text: string): boolean => /^(?:\*[^*\n]+\*|_[^_\n]+_)\s*\n/v.test(text);

/** Check if text starts with a bullet list item */
const startsWithBullet = (text: string): boolean => /^[\-•]\s+/v.test(text.trim());

/** Determine end index based on content after double newline */
const determineEndIndex = (
  afterDoubleNewline: string,
  doubleNewlineIndex: number,
  defaultEndIndex: number
): number => {
  if (startsWithMarkdownHeader(afterDoubleNewline)) {
    return doubleNewlineIndex;
  }
  if (startsWithBullet(afterDoubleNewline)) {
    return defaultEndIndex;
  }
  return doubleNewlineIndex;
};

/** Get line at index safely */
const getLineAt = (lines: string[], index: number): string | undefined => lines[index];

/**
 * Detects if text starts with a markdown section header
 * Returns the header and its content if found
 */
export const findMarkdownSection = (text: string): MarkdownSectionResult | null => {
  const headerMatch = /^(?<header>\*[^*\n]+\*|_[^_\n]+_)\s*\n/v.exec(text);

  if (headerMatch === null) {
    return null;
  }

  const { groups } = headerMatch;
  const header = groups?.header ?? headerMatch[FIRST_ELEMENT] ?? '';
  const [matchedText = ''] = headerMatch;
  const afterHeader = text.substring(matchedText.length);
  const { length: defaultEndIndex } = afterHeader;

  const doubleNewlineIndex = afterHeader.indexOf('\n\n');

  const endIndex =
    doubleNewlineIndex === NOT_FOUND
      ? defaultEndIndex
      : determineEndIndex(
          afterHeader.substring(doubleNewlineIndex + DOUBLE_NEWLINE_LENGTH),
          doubleNewlineIndex,
          defaultEndIndex
        );

  const content = afterHeader.substring(ZERO, endIndex);
  const fullSection = matchedText + content;

  return { header, content, fullSection };
};

/** Test if line is a numbered list item */
const isNumberedListItem = (line: string): boolean => /^\s*\d{1,2}\.\s+/v.test(line);

/** Test if line is a bullet list item */
const isBulletListItem = (line: string): boolean => /^\s*[\-•]\s+/v.test(line);

/** Find the next non-empty line index in an array of lines */
const findNextNonEmptyIndex = (lines: string[], startIndex: number): number => {
  for (let j = startIndex; j < lines.length; j += INCREMENT) {
    const line = getLineAt(lines, j);
    if (line !== undefined && line.trim() !== '') {
      return j;
    }
  }
  return NOT_FOUND;
};

/** Check if next line is a list continuation */
const isListContinuation = (lines: string[], nextNonEmptyIndex: number): boolean => {
  if (nextNonEmptyIndex === NOT_FOUND) return false;
  const nextLine = getLineAt(lines, nextNonEmptyIndex) ?? '';
  return isNumberedListItem(nextLine) || isBulletListItem(nextLine);
};

/** Numbered list state */
interface NumberedListState {
  endLineIndex: number;
  inList: boolean;
}

/** Process numbered list line result */
interface NumberedListLineResult {
  action: 'continue' | 'break' | 'next';
  newState: NumberedListState;
}

/** Process a single line in numbered list - returns new state */
const processNumberedListLine = (
  line: string,
  currentIndex: number,
  lines: string[],
  currentState: NumberedListState
): NumberedListLineResult => {
  const isNumbered = isNumberedListItem(line);
  const isBullet = isBulletListItem(line);

  if (isNumbered) {
    return { action: 'next', newState: { inList: true, endLineIndex: currentIndex } };
  }

  if (isBullet && currentState.inList) {
    return { action: 'next', newState: { ...currentState, endLineIndex: currentIndex } };
  }

  if (currentState.inList && line.trim() === '') {
    const nextNonEmptyIndex = findNextNonEmptyIndex(lines, currentIndex + INCREMENT);
    const action = isListContinuation(lines, nextNonEmptyIndex) ? 'continue' : 'break';
    return { action, newState: currentState };
  }

  if (currentState.inList) {
    return { action: 'break', newState: currentState };
  }

  return { action: 'next', newState: currentState };
};

/** Process numbered list to find end index */
const processNumberedList = (lines: string[]): number => {
  let state: NumberedListState = { endLineIndex: NOT_FOUND, inList: false };

  for (let i = ZERO; i < lines.length; i += INCREMENT) {
    const line = getLineAt(lines, i);
    if (line === undefined) continue;

    const { action, newState } = processNumberedListLine(line, i, lines, state);
    state = newState;
    if (action === 'break') break;
  }

  return state.endLineIndex >= ZERO
    ? lines.slice(ZERO, state.endLineIndex + INCREMENT).join('\n').length
    : ZERO;
};

/** Bullet list state */
interface BulletListState {
  endIndex: number;
  inList: boolean;
}

/** Process bullet list line result */
interface BulletListLineResult {
  action: 'continue' | 'break' | 'next';
  newState: BulletListState;
}

/** Process a single line in bullet list - returns new state */
const processBulletListLine = (
  line: string,
  currentIndex: number,
  lines: string[],
  currentState: BulletListState
): BulletListLineResult => {
  const isBullet = /^[\-•]\s+/v.test(line.trim());

  if (isBullet) {
    const { length: newEndIndex } = lines.slice(ZERO, currentIndex + INCREMENT).join('\n');
    return { action: 'next', newState: { inList: true, endIndex: newEndIndex } };
  }

  if (currentState.inList && line.trim() === '') {
    const nextLine = getLineAt(lines, currentIndex + INCREMENT);
    if (nextLine !== undefined && /^[\-•]\s+/v.test(nextLine.trim())) {
      return { action: 'continue', newState: currentState };
    }
    return { action: 'break', newState: currentState };
  }

  if (currentState.inList) {
    return { action: 'break', newState: currentState };
  }

  return { action: 'next', newState: currentState };
};

/** Process bullet list to find end index */
const processBulletList = (lines: string[]): number => {
  let state: BulletListState = { endIndex: ZERO, inList: false };

  for (let i = ZERO; i < lines.length; i += INCREMENT) {
    const line = getLineAt(lines, i);
    if (line === undefined) continue;

    const { action, newState } = processBulletListLine(line, i, lines, state);
    state = newState;
    if (action === 'break') break;
  }

  return state.endIndex;
};

/**
 * Detects if text is within a list section (numbered or bulleted)
 * Returns the boundaries of the list if found
 */
export const findListSection = (text: string): ListSectionResult | null => {
  const numberedListStart = /^\d{1,2}\.\s+/v;
  const bulletListStart = /^[\-•]\s+/v;

  if (numberedListStart.test(text.trim())) {
    const lines = text.split('\n');
    const endIndex = processNumberedList(lines);
    return { start: ZERO, end: endIndex, type: 'numbered' };
  }

  if (bulletListStart.test(text.trim())) {
    const lines = text.split('\n');
    const endIndex = processBulletList(lines);
    return { start: ZERO, end: endIndex, type: 'bullet' };
  }

  return null;
};
