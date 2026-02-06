const ZERO = 0;

export function countOccurrences(text: string, pattern: RegExp): number {
  const matches = text.match(pattern);
  return matches?.length ?? ZERO;
}
