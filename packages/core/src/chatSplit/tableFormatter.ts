import { COLUMN_SEPARATOR_WIDTH, TABLE_MONOSPACE_WIDTH_THRESHOLD } from './constants.js';
import type { ParsedTable } from './tableParser.js';

/** Zero constant */
const ZERO = 0;

/** Index offset */
const INDEX_OFFSET = 1;

/** Triple backtick for monospace blocks */
const TRIPLE_BACKTICK = '```';

/**
 * Strip all markdown formatting from text.
 * Removes bold, italic, inline code, and link syntax.
 */
export const stripMarkdownFormatting = (text: string): string => {
  let result = text;
  result = result.replace(/\*\*(?<content>[^*]+)\*\*/gv, '$<content>');
  result = result.replace(/\*(?<content>[^*]+)\*/gv, '$<content>');
  result = result.replace(/`(?<content>[^`]+)`/gv, '$<content>');
  result = result.replace(/\[(?<linkText>[^\]]+)\]\([^\)]*\)/gv, '$<linkText>');
  return result;
};

/** Pattern matching both **bold** and *italic* for single-pass replacement */
const BOLD_OR_ITALIC_PATTERN = /\*\*[^*]+\*\*|\*[^*]+\*/gv;

/** Start length of double asterisk */
const DOUBLE_ASTERISK_LENGTH = 2;

/** Convert a bold or italic match to WhatsApp format */
const convertBoldOrItalic = (match: string): string => {
  if (match.startsWith('**')) {
    return `*${match.slice(DOUBLE_ASTERISK_LENGTH, -DOUBLE_ASTERISK_LENGTH)}*`;
  }
  return `_${match.slice(INDEX_OFFSET, -INDEX_OFFSET)}_`;
};

/**
 * Transform markdown formatting to WhatsApp formatting.
 * **bold** → *bold*, *italic* → _italic_, `code` → code, [text](url) → text
 */
export const transformToWhatsApp = (text: string): string => {
  let result = text;
  result = result.replace(BOLD_OR_ITALIC_PATTERN, convertBoldOrItalic);
  result = result.replace(/`(?<content>[^`]+)`/gv, '$<content>');
  result = result.replace(/\[(?<linkText>[^\]]+)\]\([^\)]*\)/gv, '$<linkText>');
  return result;
};

/** Get cell value at column index */
const getCellAt = (row: string[], colIndex: number): string => row[colIndex] ?? '';

/** Calculate the max width for each column using stripped content */
export const calculateColumnWidths = (table: ParsedTable): number[] => {
  const { headers, rows } = table;
  return headers.map((header, colIndex) => {
    const { length: headerWidth } = stripMarkdownFormatting(header);
    const maxCellWidth = rows.reduce((max, row) => {
      const cell = getCellAt(row, colIndex);
      const { length: cellWidth } = stripMarkdownFormatting(cell);
      return Math.max(max, cellWidth);
    }, ZERO);
    return Math.max(headerWidth, maxCellWidth);
  });
};

/** Calculate the total real width of the table */
export const calculateTableRealWidth = (columnWidths: number[]): number => {
  const contentWidth = columnWidths.reduce((sum, width) => sum + width, ZERO);
  const separatorWidth = (columnWidths.length - INDEX_OFFSET) * COLUMN_SEPARATOR_WIDTH;
  return contentWidth + separatorWidth;
};

/** Check if a table should use monospace format (Option A) */
export const shouldUseMonospace = (columnWidths: number[]): boolean =>
  calculateTableRealWidth(columnWidths) <= TABLE_MONOSPACE_WIDTH_THRESHOLD;

/** Pad a string with spaces to reach the target width */
const padToWidth = (text: string, targetWidth: number): string => {
  const { length: currentWidth } = text;
  const padding = targetWidth - currentWidth;
  if (padding <= ZERO) return text;
  return text + ' '.repeat(padding);
};

/** Format a single row for monospace output */
const formatMonospaceRow = (cells: string[], columnWidths: number[], isLastColumn: number): string =>
  cells
    .map((cell, index) => {
      const stripped = stripMarkdownFormatting(cell);
      return index < isLastColumn ? padToWidth(stripped, columnWidths[index] ?? ZERO) : stripped;
    })
    .join(' ');

/**
 * Format a table as a monospace block (Option A).
 * Wraps in triple backticks with aligned columns, all formatting stripped.
 */
export const formatAsMonospace = (table: ParsedTable, columnWidths: number[]): string => {
  const lastColumnIndex = table.headers.length - INDEX_OFFSET;
  const headerRow = formatMonospaceRow(table.headers, columnWidths, lastColumnIndex);
  const dataRows = table.rows.map((row) => formatMonospaceRow(row, columnWidths, lastColumnIndex));
  const allRows = [headerRow, ...dataRows].join('\n');
  return `${TRIPLE_BACKTICK}\n${allRows}\n${TRIPLE_BACKTICK}`;
};

/** Format a single data row as a chunk for Option B */
export const formatRowChunk = (headers: string[], row: string[]): string =>
  headers
    .map((header, index) => {
      const strippedHeader = stripMarkdownFormatting(header);
      const cellValue = row[index] ?? '';
      const transformedValue = transformToWhatsApp(cellValue);
      return `*${strippedHeader}:* ${transformedValue}`;
    })
    .join('\n');

/**
 * Format a table as row-per-chunk (Option B).
 * Each data row becomes a separate chunk with headers as bold labels.
 */
export const formatAsRowChunks = (table: ParsedTable): string[] =>
  table.rows.map((row) => formatRowChunk(table.headers, row));
