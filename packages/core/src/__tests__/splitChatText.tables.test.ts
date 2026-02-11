import { describe, expect, test } from '@jest/globals';

import { splitChatText } from '../index.js';

/** Expected chunk count constants */
const SINGLE_CHUNK = 1;
const TWO_CHUNKS = 2;
const THREE_CHUNKS = 3;
const FOUR_CHUNKS = 4;

/** Index constants for array access */
const FIRST = 0;
const SECOND = 1;
const LAST_INDEX_OFFSET = 1;

describe('Table Option A - small tables as monospace', () => {
  test('should format a small table as monospace block', () => {
    const input = ['| Name | City |', '| --- | --- |', '| John | New York |', '| Sarah | Miami |'].join('\n');
    const expected = ['```\nName  City\nJohn  New York\nSarah Miami\n```'];
    expect(splitChatText(input)).toEqual(expected);
  });

  test('should strip bold and italic formatting in monospace', () => {
    const input = [
      '| Product | Price |',
      '| --- | --- |',
      '| **Nike Air** | $120 |',
      '| *Adidas* | $90 |',
    ].join('\n');
    const expected = ['```\nProduct  Price\nNike Air $120\nAdidas   $90\n```'];
    expect(splitChatText(input)).toEqual(expected);
  });

  test('should strip link formatting in monospace', () => {
    const input = ['| Tool | Link |', '| --- | --- |', '| Git | [Download](https://git.com) |'].join('\n');
    const result = splitChatText(input);
    expect(result).toHaveLength(SINGLE_CHUNK);
    expect(result[FIRST]).toContain('Download');
    expect(result[FIRST]).not.toContain('[');
  });

  test('should strip inline code in monospace', () => {
    const input = ['| Command | Use |', '| --- | --- |', '| `npm install` | Install deps |'].join('\n');
    const result = splitChatText(input);
    expect(result).toHaveLength(SINGLE_CHUNK);
    expect(result[FIRST]).toContain('npm install');
    expect(result[FIRST]).not.toContain('`npm install`');
  });
});

describe('Table Option A - threshold boundary', () => {
  test('should use monospace at exactly 45 chars real width', () => {
    const input = [
      '| Column A | Column B |',
      '| --- | --- |',
      '| 12345678901234567890 | 123456789012345678901234 |',
    ].join('\n');
    const result = splitChatText(input);
    expect(result).toHaveLength(SINGLE_CHUNK);
    expect(result[FIRST]).toContain('```');
  });

  test('should handle single data row table', () => {
    const input = ['| Key | Value |', '| --- | --- |', '| Name | John |'].join('\n');
    const result = splitChatText(input);
    expect(result).toHaveLength(SINGLE_CHUNK);
    expect(result[FIRST]).toContain('```');
  });

  test('should handle table with empty cells', () => {
    const input = ['| A | B |', '| --- | --- |', '| Hello |  |', '|  | World |'].join('\n');
    const result = splitChatText(input);
    expect(result).toHaveLength(SINGLE_CHUNK);
    expect(result[FIRST]).toContain('```');
  });
});

describe('Table Option B - wide tables as row chunks', () => {
  test('should format wide table as one chunk per row', () => {
    const input = [
      '| Feature | Detailed Description | Example |',
      '| --- | --- | --- |',
      '| **Bold** | Highlights very important text in bold | **Important** |',
      '| *Italic* | Emphasizes specific words and phrases | *Emphasized* |',
    ].join('\n');
    const expected = [
      '*Feature:* *Bold*\n*Detailed Description:* Highlights very important text in bold\n*Example:* *Important*',
      '*Feature:* _Italic_\n*Detailed Description:* Emphasizes specific words and phrases\n*Example:* _Emphasized_',
    ];
    expect(splitChatText(input)).toEqual(expected);
  });

  test('should strip code backticks in Option B', () => {
    const input = [
      '| Type | Detailed Value Description | Note |',
      '| --- | --- | --- |',
      '| `Code` | Displays inline code formatting | `print("Hello")` |',
    ].join('\n');
    const result = splitChatText(input);
    expect(result).toHaveLength(SINGLE_CHUNK);
    expect(result[FIRST]).toContain('*Note:* print("Hello")');
    expect(result[FIRST]).not.toContain('`');
  });

  test('should extract link text in Option B', () => {
    const input = [
      '| Type | Detailed Value Description | Note |',
      '| --- | --- | --- |',
      '| [Link](#) | Adds clickable hyperlinks to text | [Click me](#) |',
    ].join('\n');
    const result = splitChatText(input);
    expect(result).toHaveLength(SINGLE_CHUNK);
    expect(result[FIRST]).toContain('*Type:* Link');
    expect(result[FIRST]).toContain('*Note:* Click me');
    expect(result[FIRST]).not.toContain('[');
  });
});

describe('Table with intro text', () => {
  test('should push intro text as separate chunk', () => {
    const input = [
      'Aquí tienes la información:',
      '',
      '| Name | City |',
      '| --- | --- |',
      '| John | New York |',
    ].join('\n');
    const result = splitChatText(input);
    expect(result).toHaveLength(TWO_CHUNKS);
    expect(result[FIRST]).toBe('Aquí tienes la información:');
    expect(result[SECOND]).toContain('```');
  });

  test('should return text after table for further processing', () => {
    const input = [
      '| Feature | Detailed Description | Example |',
      '| --- | --- | --- |',
      '| **Bold** | Highlights very important text in bold | **Important** |',
      '',
      '¿Te gustaría ver más opciones?',
    ].join('\n');
    const result = splitChatText(input);
    const { length } = result;
    expect(result[length - LAST_INDEX_OFFSET]).toBe('¿Te gustaría ver más opciones?');
  });
});

describe('Table with intro and trailing text', () => {
  test('should handle intro, wide table, and trailing question', () => {
    const input = [
      'Aquí tienes las opciones disponibles:',
      '',
      '| Producto | Descripción detallada | Precio |',
      '| --- | --- | --- |',
      '| Nike Air Max | Zapatillas deportivas cómodas y modernas | $150 |',
      '| Adidas Ultra | Zapatillas para correr de alto rendimiento | $180 |',
      '',
      '¿Cuál te interesa?',
    ].join('\n');
    const result = splitChatText(input);
    expect(result[FIRST]).toBe('Aquí tienes las opciones disponibles:');
    expect(result[SECOND]).toContain('*Producto:* Nike Air Max');
    const { length } = result;
    expect(result[length - LAST_INDEX_OFFSET]).toBe('¿Cuál te interesa?');
  });
});

describe('Table edge cases - invalid structures', () => {
  test('should not detect pipes without table structure', () => {
    const input = 'This has a | pipe | but is not a table.';
    const result = splitChatText(input);
    expect(result[FIRST]).not.toContain('```');
  });

  test('should not detect table without separator row', () => {
    const input = ['| Name | City |', '| John | New York |'].join('\n');
    const result = splitChatText(input);
    expect(result).toHaveLength(SINGLE_CHUNK);
    expect(result[FIRST]).not.toContain('```');
  });

  test('should not detect table without data rows', () => {
    const input = ['| Name | City |', '| --- | --- |'].join('\n');
    const result = splitChatText(input);
    expect(result[FIRST]).not.toContain('*Name:*');
  });

  test('should use Option B for many columns exceeding threshold', () => {
    const input = [
      '| Col1 | Col2 | Col3 | Col4 | Col5 | Col6 | Col7 | Col8 | Col9 | Col10 |',
      '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
      '| a | b | c | d | e | f | g | h | i | j |',
    ].join('\n');
    const result = splitChatText(input);
    expect(result[FIRST]).toContain('*Col1:*');
  });
});

describe('Table - spec example Option A', () => {
  test('should match the spec example for Option A', () => {
    const input = [
      '| Name | City |',
      '| --- | ----------- |',
      '| John | New York |',
      '| Sarah | Miami |',
    ].join('\n');
    const expected = ['```\nName  City\nJohn  New York\nSarah Miami\n```'];
    expect(splitChatText(input)).toEqual(expected);
  });
});

describe('Table - spec example Option B', () => {
  test('should match the spec example for Option B', () => {
    const input = [
      '| Feature   | Description                | Example          |',
      '|-----------|----------------------------|------------------|',
      '| **Bold**  | Highlights important text  | **Important**    |',
      '| *Italic*  | Emphasizes words/phrases   | *Emphasized*     |',
      '| `Code`    | Displays inline code       | `print("Hello")` |',
      '| [Link](#) | Adds clickable hyperlinks  | [Click me](#)    |',
    ].join('\n');
    const expected = [
      '*Feature:* *Bold*\n*Description:* Highlights important text\n*Example:* *Important*',
      '*Feature:* _Italic_\n*Description:* Emphasizes words/phrases\n*Example:* _Emphasized_',
      '*Feature:* Code\n*Description:* Displays inline code\n*Example:* print("Hello")',
      '*Feature:* Link\n*Description:* Adds clickable hyperlinks\n*Example:* Click me',
    ];
    const result = splitChatText(input);
    expect(result).toHaveLength(FOUR_CHUNKS);
    expect(result).toEqual(expected);
  });
});

describe('Table - multiple rows Option B', () => {
  test('should create separate chunk for each data row', () => {
    const input = [
      '| Producto | Descripción detallada | Precio |',
      '| --- | --- | --- |',
      '| Nike Air Max | Zapatillas deportivas cómodas y modernas | $150 |',
      '| Adidas Ultra | Zapatillas para correr de alto rendimiento | $180 |',
      '| Puma RS-X | Zapatillas retro con diseño futurista y colores | $130 |',
    ].join('\n');
    const result = splitChatText(input);
    expect(result).toHaveLength(THREE_CHUNKS);
    expect(result[FIRST]).toContain('*Producto:* Nike Air Max');
    expect(result[SECOND]).toContain('*Producto:* Adidas Ultra');
  });
});
