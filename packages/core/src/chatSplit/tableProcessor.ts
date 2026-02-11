import type { SplitResult } from './splitProcessors.js';
import {
  calculateColumnWidths,
  formatAsMonospace,
  formatAsRowChunks,
  shouldUseMonospace,
} from './tableFormatter.js';
import type { ParsedTable } from './tableParser.js';
import { findMarkdownTable } from './tableParser.js';

/** Zero constant */
const ZERO = 0;

/** Push intro text as a chunk if non-empty */
const pushIntroChunk = (beforeTable: string, chunks: string[]): void => {
  if (beforeTable.length > ZERO) {
    chunks.push(beforeTable);
  }
};

/** Push monospace table as a single chunk (Option A) */
const pushMonospaceChunks = (table: ParsedTable, columnWidths: number[], chunks: string[]): void => {
  const monospaceBlock = formatAsMonospace(table, columnWidths);
  chunks.push(monospaceBlock);
};

/** Push row-per-chunk table chunks (Option B) */
const pushRowChunks = (table: ParsedTable, chunks: string[]): void => {
  const rowChunks = formatAsRowChunks(table);
  rowChunks.forEach((chunk) => {
    chunks.push(chunk);
  });
};

/**
 * Processes markdown tables in the remaining text.
 * Detects tables and formats them as monospace (Option A) or row-per-chunk (Option B).
 */
export const processMarkdownTable = (remainingText: string, chunks: string[]): SplitResult => {
  const tableMatch = findMarkdownTable(remainingText);

  if (tableMatch === null) {
    return { splitFound: false, newRemainingText: remainingText };
  }

  const { beforeTable, table, afterTable } = tableMatch;

  pushIntroChunk(beforeTable, chunks);

  const columnWidths = calculateColumnWidths(table);

  if (shouldUseMonospace(columnWidths)) {
    pushMonospaceChunks(table, columnWidths, chunks);
  } else {
    pushRowChunks(table, chunks);
  }

  return { splitFound: true, newRemainingText: afterTable };
};
