import { describe, expect, test } from '@jest/globals';

import { splitChatText } from '../index.js';
import { countOccurrences } from './splitChatText.helpers.js';

describe('Spanish punctuation - question marks', () => {
  test('should lowercase letter after inverted question mark when mid-sentence', () => {
    const input = 'Hola, me alegra poder ayudarte ¿Cómo estás hoy? Espero que muy bien ¿Qué necesitas?';
    const result = splitChatText(input);
    const hasCorrectPunctuation = result.some((chunk) => chunk.includes('¿cómo estás'));
    expect(hasCorrectPunctuation).toBe(true);
    const hasCorrectSecondPunctuation = result.some((chunk) => chunk.includes('¿qué necesitas'));
    expect(hasCorrectSecondPunctuation).toBe(true);
  });

  test('should keep uppercase after inverted question mark when starting sentence or after period', () => {
    const input = '¿Cómo estás? Bien gracias. ¿Qué tal tu día?';
    const result = splitChatText(input);
    const startsCorrectly = result.some((chunk) => chunk.startsWith('¿Cómo estás'));
    expect(startsCorrectly).toBe(true);
    const afterPeriodCorrect = result.some((chunk) => chunk.includes('. ¿Qué tal'));
    expect(afterPeriodCorrect).toBe(true);
  });
});

describe('Spanish punctuation - exclamation marks', () => {
  test('should lowercase letter after inverted exclamation when mid-sentence', () => {
    const input =
      'Te cuento que tenemos una oferta ¡Descuento del 50%! Y además ¡Envío gratis! No te lo pierdas.';
    const result = splitChatText(input);
    const hasCorrectPunctuation = result.some((chunk) => chunk.includes('¡descuento del 50%'));
    expect(hasCorrectPunctuation).toBe(true);
    const hasCorrectSecondPunctuation = result.some((chunk) => chunk.includes('¡envío gratis'));
    expect(hasCorrectSecondPunctuation).toBe(true);
  });

  test('should keep uppercase after inverted exclamation when starting sentence or after period', () => {
    const input = '¡Hola! Bienvenido. ¡Qué bueno verte!';
    const result = splitChatText(input);
    const startsCorrectly = result.some((chunk) => chunk.startsWith('¡Hola'));
    expect(startsCorrectly).toBe(true);
    const afterPeriodCorrect = result.some((chunk) => chunk.includes('. ¡Qué bueno'));
    expect(afterPeriodCorrect).toBe(true);
  });
});

describe('Spanish punctuation - special characters and mixed', () => {
  test('should not affect non-letters after inverted punctuation', () => {
    const input = 'Mira esto ¿😀 Te gusta? También tenemos ¡123 productos disponibles!';
    const result = splitChatText(input);
    const hasEmoji = result.some((chunk) => chunk.includes('¿😀'));
    expect(hasEmoji).toBe(true);
    const hasNumber = result.some((chunk) => chunk.includes('¡123'));
    expect(hasNumber).toBe(true);
  });

  test('should keep uppercase after inverted question mark when there is a line break before it', () => {
    const input = 'Aquí tienes la información.\n¿Cómo te puedo ayudar?';
    const result = splitChatText(input);
    const hasCorrectFormat = result.some((chunk) => chunk.includes('¿Cómo te puedo'));
    expect(hasCorrectFormat).toBe(true);
  });

  test('should normalize both inverted question and exclamation in the same text', () => {
    const input =
      'Hola amigo, te cuento algo ¡Tenemos ofertas increíbles! Y además ¿Sabías que hay envío gratis? Es genial. ¿Quieres ver más?';
    const result = splitChatText(input);
    const hasCorrectExclamation = result.some((chunk) => chunk.includes('¡tenemos ofertas'));
    expect(hasCorrectExclamation).toBe(true);
    const hasCorrectQuestion = result.some((chunk) => chunk.includes('¿sabías que'));
    expect(hasCorrectQuestion).toBe(true);
    const afterPeriodCorrect = result.some((chunk) => chunk.includes('. ¿Quieres ver'));
    expect(afterPeriodCorrect).toBe(true);
  });
});

describe('Parentheses protection - balanced parentheses', () => {
  test('should not split text in a way that breaks parentheses', () => {
    const input = `David, hay algunos datos que no están completos o son ambiguos: el email parece incompleto (debe ser algo como david@ku.com) 📧, la cédula '123' es inválida (necesita ser un número real de cédula) 📄, y la dirección 'Av 5 rockefeller' no es clara (¿puedes especificar la avenida completa y el número?). El barrio 'Catallo' está bien. Por favor, envíame la información corregida.`;
    const result = splitChatText(input);
    result.forEach((chunk) => {
      const openCount = countOccurrences(chunk, /\(/gv);
      const closeCount = countOccurrences(chunk, /\)/gv);
      expect(openCount).toBe(closeCount);
    });
    const hasBrokenParenthesis = result.some((chunk) => chunk.trim().startsWith(').'));
    expect(hasBrokenParenthesis).toBe(false);
  });

  test('should keep parenthetical expressions together when splitting', () => {
    const input =
      'Este producto tiene características especiales (alta calidad, durabilidad y diseño moderno). También incluye garantía extendida de 2 años. Por favor, revisa los detalles.';
    const result = splitChatText(input);
    result.forEach((chunk) => {
      const openCount = countOccurrences(chunk, /\(/gv);
      const closeCount = countOccurrences(chunk, /\)/gv);
      expect(openCount).toBe(closeCount);
    });
  });
});

describe('Parentheses protection - nested parentheses', () => {
  test('should not break nested parentheses', () => {
    const input =
      'La información requerida es la siguiente: nombre completo (tal como aparece en tu documento (cédula o pasaporte)). Además necesitamos tu dirección completa.';
    const result = splitChatText(input);
    result.forEach((chunk) => {
      const openCount = countOccurrences(chunk, /\(/gv);
      const closeCount = countOccurrences(chunk, /\)/gv);
      expect(openCount).toBe(closeCount);
    });
  });
});
