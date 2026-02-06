import { describe, expect, test } from '@jest/globals';

import { splitChatText } from '../index.js';

const MIN_SPLIT_COUNT = 2;
const SINGLE_CHUNK = 1;

describe('Question processor - parenthetical clarification split', () => {
  test('should split after parenthetical when text follows and gap is large', () => {
    const input =
      'Este texto tiene información bastante detallada sobre nuestros productos y servicios disponibles actualmente?' +
      ' (en cualquier talla y color disponible actualmente en nuestra tienda del centro comercial y sus alrededores)?' +
      ' Si necesitas otra opción avísame por favor.';
    const result = splitChatText(input);
    const hasParenthetical = result.some((chunk) => chunk.includes('centro comercial'));
    expect(hasParenthetical).toBe(true);
    const hasContinuation = result.some((chunk) => chunk.includes('Si necesitas otra opción'));
    expect(hasContinuation).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(MIN_SPLIT_COUNT);
  });

  test('should not split when parenthetical has no text after and gap is large', () => {
    const input =
      'Este texto tiene información bastante detallada sobre nuestros productos y servicios disponibles actualmente?' +
      ' (en cualquier talla y color disponible actualmente en nuestra tienda del centro comercial y sus alrededores)?';
    const result = splitChatText(input);
    expect(result).toHaveLength(SINGLE_CHUNK);
  });
});

describe('Question processor - long question emoji paths', () => {
  test('should not split long question when only emoji follows', () => {
    const input =
      '¿Qué te parece esta opción del Nike Air Max 90 en color Hueso claro y Oliva neutro y Gris universitario? 😊';
    const result = splitChatText(input);
    expect(result).toEqual([input]);
  });

  test('should split long question with emoji and text after', () => {
    const input =
      '¿Qué te parece esta opción del Nike Air Max 90 en color Hueso claro y Oliva neutro y Gris universitario de Nike?' +
      ' 😊 Tenemos muchas más opciones disponibles en nuestra tienda.';
    const result = splitChatText(input);
    const hasQuestionWithEmoji = result.some(
      (chunk) => chunk.includes('Gris universitario de Nike?') && chunk.includes('😊')
    );
    expect(hasQuestionWithEmoji).toBe(true);
    const hasAfter = result.some((chunk) => chunk.includes('Tenemos muchas más opciones'));
    expect(hasAfter).toBe(true);
  });
});

describe('Question processor - short question emoji paths', () => {
  test('should split short question with emoji and text after', () => {
    const input =
      '¿Te gusta este producto? 😊 Podemos buscar otras opciones de productos disponibles para ti en la tienda virtual ahora mismo.';
    const result = splitChatText(input);
    const hasQuestionWithEmoji = result.some((chunk) => chunk.includes('¿Te gusta este producto? 😊'));
    expect(hasQuestionWithEmoji).toBe(true);
    const hasTextAfter = result.some((chunk) => chunk.includes('Podemos buscar otras opciones'));
    expect(hasTextAfter).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(MIN_SPLIT_COUNT);
  });
});

describe('Question processor - contiguous questions emoji paths', () => {
  test('should split contiguous questions with emoji and text after', () => {
    const input =
      '¿Te gusta? ¿Lo quieres? 😊 Tenemos descuentos especiales hoy disponibles para todos nuestros clientes.';
    const result = splitChatText(input);
    const hasQuestionsWithEmoji = result.some(
      (chunk) => chunk.includes('¿Te gusta?') && chunk.includes('¿Lo quieres?') && chunk.includes('😊')
    );
    expect(hasQuestionsWithEmoji).toBe(true);
    const hasTextAfter = result.some((chunk) => chunk.includes('Tenemos descuentos especiales'));
    expect(hasTextAfter).toBe(true);
  });

  test('should not split contiguous questions when only emoji follows', () => {
    const input = '¿Te gusta? ¿Lo quieres? 😊';
    const result = splitChatText(input);
    expect(result).toEqual([input]);
  });
});

describe('Question processor - non-emoji uppercase after question', () => {
  test('should split when uppercase text follows short question', () => {
    const input =
      '¿Te gusta este producto? Podemos buscar otras opciones para ti en la tienda de productos y accesorios deportivos.';
    const result = splitChatText(input);
    expect(result.length).toBeGreaterThanOrEqual(MIN_SPLIT_COUNT);
    const hasQuestion = result.some((chunk) => chunk.includes('¿Te gusta este producto?'));
    expect(hasQuestion).toBe(true);
  });
});
