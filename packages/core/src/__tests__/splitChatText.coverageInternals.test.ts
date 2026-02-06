import { describe, expect, test } from '@jest/globals';

import { mergeSmallChunks } from '../chatSplit/mergeProcessor.js';
import { isPositionInBulletLine, isPositionInsideParentheses } from '../chatSplit/positionHelpers.js';
import { normalizeSpanishPunctuation } from '../chatSplit/punctuationNormalization.js';
import {
  handleLongQuestion,
  handleShortQuestion,
  processContiguousQuestions,
} from '../chatSplit/questionProcessor.js';
import { findListSection } from '../chatSplit/sections.js';
import { findPositionAfterEmoji } from '../chatSplit/textHelpers.js';

const FIRST_ELEMENT = 0;
const ZERO = 0;
const NEGATIVE_ONE = -1;

describe('mergeSmallChunks - next chunk ends with colon', () => {
  test('should not merge small chunk when next chunk ends with colon', () => {
    const chunks = ['OK', 'Opciones:', '- Item A\n- Item B\n- Item C'];
    const result = mergeSmallChunks(chunks);
    expect(result[FIRST_ELEMENT]).toBe('OK');
    expect(result.some((chunk) => chunk.includes('Opciones:'))).toBe(true);
  });
});

describe('findListSection - leading empty lines before numbered list', () => {
  test('should handle empty lines before numbered list items', () => {
    const text = '\n1. Primera opción\n2. Segunda opción';
    const result = findListSection(text);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('numbered');
  });
});

describe('findListSection - leading empty lines before bullet list', () => {
  test('should handle empty lines before bullet list items', () => {
    const text = '\n- Primera opción\n- Segunda opción';
    const result = findListSection(text);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('bullet');
  });
});

describe('isPositionInBulletLine - out of range', () => {
  test('should return false for negative position', () => {
    const result = isPositionInBulletLine('- Item', NEGATIVE_ONE);
    expect(result).toBe(false);
  });

  test('should return false for position beyond text length', () => {
    const text = '- Item';
    const result = isPositionInBulletLine(text, text.length);
    expect(result).toBe(false);
  });
});

describe('isPositionInsideParentheses - out of range', () => {
  test('should return false for negative position', () => {
    const result = isPositionInsideParentheses('(test)', NEGATIVE_ONE);
    expect(result).toBe(false);
  });

  test('should return false for position beyond text length', () => {
    const text = '(test)';
    const result = isPositionInsideParentheses(text, text.length);
    expect(result).toBe(false);
  });
});

describe('findPositionAfterEmoji - non-emoji string', () => {
  test('should return zero for string without emoji at start', () => {
    const result = findPositionAfterEmoji('Hello world');
    expect(result).toBe(ZERO);
  });
});

describe('normalizeSpanishPunctuation - inverted mark at text start', () => {
  test('should not lowercase when inverted question mark is at text start', () => {
    const result = normalizeSpanishPunctuation('¿Cómo estás?');
    expect(result).toBe('¿Cómo estás?');
  });

  test('should not lowercase when inverted exclamation is at text start', () => {
    const result = normalizeSpanishPunctuation('¡Hola amigo!');
    expect(result).toBe('¡Hola amigo!');
  });
});

describe('handleLongQuestion - emoji only after question', () => {
  test('should not split when only emoji follows long question', () => {
    const chunks: string[] = [];
    const questionPart =
      '¿Qué te parece esta opción del producto que tenemos disponible en nuestra tienda del centro comercial actualmente?';
    const afterQuestion = '😊';
    const result = handleLongQuestion(
      `${questionPart} ${afterQuestion}`,
      chunks,
      questionPart,
      afterQuestion
    );
    expect(result.splitFound).toBe(false);
    expect(chunks).toHaveLength(ZERO);
  });
});

describe('handleShortQuestion - emoji only after question', () => {
  test('should not split when only emoji follows short question', () => {
    const chunks: string[] = [];
    const questionPart = '¿Te gusta este producto?';
    const afterQuestion = '😊';
    const result = handleShortQuestion(
      `${questionPart} ${afterQuestion}`,
      chunks,
      questionPart,
      afterQuestion
    );
    expect(result.splitFound).toBe(false);
    expect(chunks).toHaveLength(ZERO);
  });
});

describe('processContiguousQuestions - digit-as-emoji after questions', () => {
  test('should not split when digit-only content follows contiguous questions', () => {
    const chunks: string[] = [];
    const input = '¿Te gusta? ¿Lo quieres? 5';
    const lastQuestionIdx = input.lastIndexOf('?');
    const result = processContiguousQuestions(input, chunks, lastQuestionIdx);
    expect(result.splitFound).toBe(false);
    expect(chunks).toHaveLength(ZERO);
  });
});
