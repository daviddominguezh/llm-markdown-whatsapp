import { INDEX_OFFSET, MIN_CHUNK_SIZE } from './constants.js';

/** Long paragraph threshold */
const LONG_PARAGRAPH_THRESHOLD = 150;

/** Zero constant */
const ZERO = 0;

/** Get chunk at index safely */
const getChunkAt = (chunks: string[], index: number): string | undefined => chunks[index];

/** Check if chunk starts with question mark */
const startsWithQuestion = (chunk: string): boolean => chunk.trim().startsWith('¿');

/** Check if chunk starts with list */
const startsWithList = (chunk: string): boolean => /^(?:\d{1,2}\.\s+|[\-•]\s+)/v.test(chunk.trim());

/** Check if chunk ends with colon */
const endsWithColon = (chunk: string): boolean => chunk.trim().endsWith(':');

/** Check if chunk is a long paragraph */
const isLongParagraph = (chunk: string): boolean => chunk.trim().length > LONG_PARAGRAPH_THRESHOLD;

/** Checks if current chunk should be merged with next */
const shouldMergeWithNext = (
  chunk: string,
  nextChunk: string,
  isLastChunk: boolean
): { shouldMerge: boolean; skipToNext: boolean } => {
  if (endsWithColon(chunk) && (startsWithList(nextChunk) || isLongParagraph(nextChunk))) {
    return { shouldMerge: false, skipToNext: false };
  }

  if (endsWithColon(nextChunk)) {
    return { shouldMerge: false, skipToNext: false };
  }

  const shouldMerge = chunk.trim().length < MIN_CHUNK_SIZE && !startsWithQuestion(nextChunk) && !isLastChunk;
  return { shouldMerge, skipToNext: shouldMerge };
};

/** Handle last chunk merge with previous */
const handleLastChunkMerge = (chunk: string, mergedChunks: string[]): void => {
  const previousChunk = mergedChunks.pop();
  if (previousChunk !== undefined) {
    mergedChunks.push(`${previousChunk} ${chunk.trim()}`);
  }
};

/** Check if last chunk should merge with previous */
const shouldMergeLastWithPrevious = (chunk: string, mergedChunksLength: number): boolean =>
  chunk.trim().length < MIN_CHUNK_SIZE && mergedChunksLength > ZERO && !startsWithQuestion(chunk);

/** Get current chunk from pending or working chunks */
const getCurrentChunk = (
  pendingMerge: string | null,
  workingChunks: string[],
  index: number
): string | undefined => {
  if (pendingMerge !== null) return pendingMerge;
  return getChunkAt(workingChunks, index);
};

/** Process last chunk with potential merge */
const processLastChunk = (chunk: string, mergedChunks: string[]): void => {
  if (shouldMergeLastWithPrevious(chunk, mergedChunks.length)) {
    handleLastChunkMerge(chunk, mergedChunks);
  } else {
    mergedChunks.push(chunk);
  }
};

/** Process a non-last chunk and return pending merge if needed */
const processNonLastChunk = (
  currentChunk: string,
  nextChunk: string | undefined,
  mergedChunks: string[]
): string | null => {
  if (nextChunk === undefined) {
    mergedChunks.push(currentChunk);
    return null;
  }

  const { shouldMerge, skipToNext } = shouldMergeWithNext(currentChunk, nextChunk, false);

  if (shouldMerge && skipToNext) {
    return `${currentChunk} ${nextChunk}`;
  }

  mergedChunks.push(currentChunk);
  return null;
};

/** Merges small chunks with adjacent chunks */
export function mergeSmallChunks(chunks: string[]): string[] {
  const mergedChunks: string[] = [];
  const workingChunks = [...chunks];
  let i = ZERO;
  let pendingMerge: string | null = null;

  while (i < workingChunks.length) {
    const currentChunk = getCurrentChunk(pendingMerge, workingChunks, i);
    pendingMerge = null;

    if (currentChunk === undefined) {
      i += INDEX_OFFSET;
      continue;
    }

    const isLastChunk = i === workingChunks.length - INDEX_OFFSET;

    if (isLastChunk) {
      processLastChunk(currentChunk, mergedChunks);
      i += INDEX_OFFSET;
      continue;
    }

    const nextChunk = getChunkAt(workingChunks, i + INDEX_OFFSET);
    pendingMerge = processNonLastChunk(currentChunk, nextChunk, mergedChunks);
    i += INDEX_OFFSET;
  }

  return mergedChunks;
}
