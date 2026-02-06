/** Constants */
const INCREMENT = 1;
const DECREMENT = 1;
const ZERO = 0;

/** Get character at position safely (charAt returns '' for out-of-range) */
const getCharAt = (text: string, position: number): string => text.charAt(position);

/** Update open count based on character */
const updateOpenCount = (currentCount: number, char: string): number => {
  if (char === '(') {
    return currentCount + INCREMENT;
  }
  if (char === ')') {
    const newCount = currentCount - DECREMENT;
    return newCount < ZERO ? ZERO : newCount;
  }
  return currentCount;
};

/**
 * Check if a position (index) in the text is within a bullet point line.
 * This prevents splitting bullet lists at punctuation within bullet items.
 */
export const isPositionInBulletLine = (text: string, position: number): boolean => {
  if (position < ZERO || position >= text.length) return false;

  let lineStart = position;
  while (lineStart > ZERO && getCharAt(text, lineStart - DECREMENT) !== '\n') {
    lineStart -= DECREMENT;
  }

  let lineEnd = position;
  while (lineEnd < text.length && getCharAt(text, lineEnd) !== '\n') {
    lineEnd += INCREMENT;
  }

  const line = text.substring(lineStart, lineEnd);
  const trimmedLine = line.trim();

  return /^[\-•]\s+/v.test(trimmedLine);
};

/**
 * Count open parentheses up to a position
 */
const countOpenParentheses = (text: string, position: number): number => {
  let openCount = ZERO;

  for (let i = ZERO; i < position; i += INCREMENT) {
    const char = getCharAt(text, i);
    openCount = updateOpenCount(openCount, char);
  }

  return openCount;
};

/**
 * Check if a position (index) in the text is within parentheses.
 * This prevents splitting text inside parenthetical expressions.
 * Returns true if the position is inside an unbalanced parenthetical expression.
 */
export const isPositionInsideParentheses = (text: string, position: number): boolean => {
  if (position < ZERO || position >= text.length) return false;
  return countOpenParentheses(text, position) > ZERO;
};
