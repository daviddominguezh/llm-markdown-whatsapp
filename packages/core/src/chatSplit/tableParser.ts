/** Zero constant */
const ZERO = 0;

/** Index offset */
const INDEX_OFFSET = 1;

/** Minimum columns for a valid table */
const MIN_COLUMNS = 2;

/** Parsed table data */
export interface ParsedTable {
  headers: string[];
  rows: string[][];
}

/** Result of finding a table in text */
export interface TableMatch {
  beforeTable: string;
  table: ParsedTable;
  afterTable: string;
}

/** Check if a line is a table separator row (e.g. | --- | --- |) */
const isSeparatorRow = (line: string): boolean => /^\|(?:\s*:?-+:?\s*\|)+\s*$/v.test(line.trim());

/** Check if a line looks like a table row (starts and ends with |) */
const isTableRow = (line: string): boolean => {
  const trimmed = line.trim();
  return trimmed.startsWith('|') && trimmed.endsWith('|');
};

/** Parse cells from a pipe-delimited table row */
export const parseCells = (row: string): string[] => {
  const trimmed = row.trim();
  const withoutOuterPipes = trimmed.substring(INDEX_OFFSET, trimmed.length - INDEX_OFFSET);
  return withoutOuterPipes.split('|').map((cell) => cell.trim());
};

/** Parse table lines into structured data */
const parseTableLines = (headerLine: string, dataLines: string[]): ParsedTable => {
  const headers = parseCells(headerLine);
  const rows = dataLines.map((line) => {
    const cells = parseCells(line);
    return padRowToLength(cells, headers.length);
  });
  return { headers, rows };
};

/** Pad a row with empty strings to match expected column count */
const padRowToLength = (cells: string[], expectedLength: number): string[] => {
  const padded = [...cells];
  while (padded.length < expectedLength) {
    padded.push('');
  }
  return padded.slice(ZERO, expectedLength);
};

/** Get a line safely from array */
const getLineAt = (lines: string[], index: number): string | undefined => lines[index];

/** Collect consecutive data rows starting from an index */
const collectDataRows = (lines: string[], startIndex: number): { dataLines: string[]; endIndex: number } => {
  const dataLines: string[] = [];
  let i = startIndex;

  while (i < lines.length) {
    const line = getLineAt(lines, i);
    if (line === undefined || !isTableRow(line)) break;
    dataLines.push(line);
    i += INDEX_OFFSET;
  }

  return { dataLines, endIndex: i };
};

/** Check if a potential table has enough structure to be valid */
const isValidTable = (headerLine: string): boolean => {
  const cells = parseCells(headerLine);
  return cells.length >= MIN_COLUMNS;
};

/** Build the before-table text from lines */
const buildBeforeText = (lines: string[], endIndex: number): string => lines.slice(ZERO, endIndex).join('\n');

/** Build the after-table text from lines */
const buildAfterText = (lines: string[], startIndex: number): string => lines.slice(startIndex).join('\n');

/**
 * Find a markdown table in the given text.
 * Returns the text before the table, the parsed table, and text after.
 */
export const findMarkdownTable = (text: string): TableMatch | null => {
  const lines = text.split('\n');

  for (let i = ZERO; i < lines.length - INDEX_OFFSET; i += INDEX_OFFSET) {
    const currentLine = getLineAt(lines, i);
    const nextLine = getLineAt(lines, i + INDEX_OFFSET);

    if (currentLine === undefined || nextLine === undefined) continue;
    if (!isTableRow(currentLine) || !isSeparatorRow(nextLine)) continue;
    if (!isValidTable(currentLine)) continue;

    const dataStartIndex = i + INDEX_OFFSET + INDEX_OFFSET;
    const { dataLines, endIndex } = collectDataRows(lines, dataStartIndex);

    if (dataLines.length === ZERO) continue;

    const table = parseTableLines(currentLine, dataLines);
    const beforeTable = buildBeforeText(lines, i).trim();
    const afterTable = buildAfterText(lines, endIndex).trim();

    return { beforeTable, table, afterTable };
  }

  return null;
};
