import { describe, expect, test } from '@jest/globals';

import { splitChatText } from '../index.js';

const SINGLE_CHUNK = 1;
const FIRST_ELEMENT = 0;

describe('Period processor - period followed by whitespace only', () => {
  test('should not split when period is followed by only whitespace', () => {
    const input =
      'Este producto tiene características especiales que lo hacen absolutamente único en su categoría de productos deportivos.   ';
    const result = splitChatText(input);
    expect(result).toHaveLength(SINGLE_CHUNK);
    expect(result[FIRST_ELEMENT]).toContain('absolutamente único');
  });
});

describe('List normalization - punctuation mark before list number', () => {
  test('should handle inline list where punctuation immediately precedes item number', () => {
    const input = 'Datos: 1. Nombre !2. Email 3. Cédula';
    const result = splitChatText(input);
    const hasContent = result.some((chunk) => chunk.includes('Nombre'));
    expect(hasContent).toBe(true);
    const hasEmail = result.some((chunk) => chunk.includes('Email'));
    expect(hasEmail).toBe(true);
  });
});

describe('Split processors - response prompt with colon mid-line', () => {
  test('should handle intro with puedes responder con and text after colon', () => {
    const input =
      'Datos necesarios: puedes responder con: tu nombre completo\n- Opción primera\n- Opción segunda';
    const result = splitChatText(input);
    const hasIntro = result.some((chunk) => chunk.includes('Datos necesarios:'));
    expect(hasIntro).toBe(true);
    const hasList = result.some((chunk) => chunk.includes('- Opción primera'));
    expect(hasList).toBe(true);
  });
});

describe('Product card - markdown pattern without valid first match', () => {
  test('should handle markdown product pattern that fails card extraction', () => {
    const input = 'Encontré opciones:\n1. ** Producto especial **\n💵 $500.000';
    const result = splitChatText(input);
    const hasIntro = result.some((chunk) => chunk.includes('Encontré opciones:'));
    expect(hasIntro).toBe(true);
    const hasProduct = result.some((chunk) => chunk.includes('Producto especial'));
    expect(hasProduct).toBe(true);
  });
});
