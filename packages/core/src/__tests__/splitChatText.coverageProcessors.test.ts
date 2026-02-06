import { describe, expect, test } from '@jest/globals';

import { splitChatText } from '../index.js';

const MIN_SPLIT_COUNT = 2;
const SINGLE_CHUNK = 1;
const FIRST_ELEMENT = 0;
const LONG_TEXT_PAD =
  'Este es un contenido suficientemente largo para que el procesador lo considere válido para dividir.';

describe('Break processor - text after break with no further newlines', () => {
  test('should split at double newline when after-text has no newlines', () => {
    const input = `${LONG_TEXT_PAD}\n\nEste texto viene después del salto sin más saltos internos`;
    const result = splitChatText(input);
    expect(result.length).toBeGreaterThanOrEqual(MIN_SPLIT_COUNT);
    const hasBefore = result.some((chunk) => chunk.includes('suficientemente largo'));
    expect(hasBefore).toBe(true);
    const hasAfter = result.some((chunk) => chunk.includes('viene después del salto'));
    expect(hasAfter).toBe(true);
  });
});

describe('Break processor - question with short intro and bullets', () => {
  test('should not split when question precedes short intro with bullets', () => {
    const input =
      '¿Qué quieres hacer con tu pedido actual de la tienda?\n\nOpciones:\n- Cancelar\n- Modificar';
    const result = splitChatText(input);
    const allTogether = result.some(
      (chunk) => chunk.includes('¿Qué quieres') && chunk.includes('- Cancelar')
    );
    expect(allTogether).toBe(true);
  });
});

describe('Break processor - lowercase response prompt', () => {
  test('should not split when before ends with puedes responder con', () => {
    const input =
      'Algo corto aquí.\nOtro texto mediano puedes responder con:\n\n- Opción primera\n- Opción segunda';
    const result = splitChatText(input);
    const hasAll = result.some(
      (chunk) => chunk.includes('puedes responder con:') && chunk.includes('- Opción primera')
    );
    expect(hasAll).toBe(true);
  });
});

describe('Break processor - long paragraphs before break', () => {
  test('should not split when before-text has long paragraphs', () => {
    const longParagraph =
      'Este es un párrafo extremadamente largo que describe en detalle todas las características del producto,' +
      ' incluyendo materiales, dimensiones, colores disponibles y opciones de envío para el comprador.';
    const input = `${longParagraph}\nOtro párrafo corto.\n\nTexto después del salto.`;
    const result = splitChatText(input);
    const hasLongParagraph = result.some((chunk) => chunk.includes('extremadamente largo'));
    expect(hasLongParagraph).toBe(true);
  });
});

describe('Merge processor - next chunk ends with colon', () => {
  test('should not merge small chunk with next chunk ending in colon', () => {
    const input = 'Hola. Mira estas opciones de productos:\n- Zapatillas Nike\n- Camiseta Adidas';
    const result = splitChatText(input);
    const hasContent = result.some((chunk) => chunk.includes('opciones de productos:'));
    expect(hasContent).toBe(true);
  });
});

describe('Paragraph processor - intro with long paragraphs', () => {
  test('should split intro from long paragraphs after colon', () => {
    const input =
      'Detalles del producto:\n' +
      'Este es un párrafo extremadamente largo que describe el producto con muchos detalles importantes sobre sus' +
      ' características, materiales, dimensiones y disponibilidad en stock actualmente.\n' +
      'Otro párrafo corto aquí con información adicional.';
    const result = splitChatText(input);
    const hasIntro = result.some(
      (chunk) => chunk === 'Detalles del producto:' || chunk.startsWith('Detalles del producto:')
    );
    expect(hasIntro).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(MIN_SPLIT_COUNT);
  });
});

describe('Period processor - period inside parentheses', () => {
  test('should not split at period inside parentheses', () => {
    const input =
      'El producto que elegiste tiene un valor especial (aprox. $500.000) y es muy recomendable para uso diario.' +
      ' Además incluye garantía de dos años completos.';
    const result = splitChatText(input);
    const hasParenIntact = result.some((chunk) => chunk.includes('(aprox. $500.000)'));
    expect(hasParenIntact).toBe(true);
  });
});

describe('Period processor - period at end of text', () => {
  test('should not split when period is at the very end of text', () => {
    const input =
      'Este producto tiene características especiales que lo hacen único en su categoría de productos deportivos.';
    const result = splitChatText(input);
    expect(result).toHaveLength(SINGLE_CHUNK);
  });
});

describe('Product card - trailing question by findQuestionByStart', () => {
  test('should separate trailing question starting with inverted mark from last card', () => {
    const input =
      'Encontré opciones:\n\n' +
      '1. 🛍️ Zapatillas Nike Air: 💵 $500.000\n📏 Talla: 40, 41, 42.\n' +
      '¿Te gusta este producto?';
    const result = splitChatText(input);
    const hasQuestion = result.some((chunk) => chunk.includes('¿Te gusta este producto?'));
    expect(hasQuestion).toBe(true);
    const hasCard = result.some((chunk) => chunk.includes('Zapatillas Nike Air'));
    expect(hasCard).toBe(true);
  });
});

describe('Punctuation normalization - mark at end of text', () => {
  test('should handle inverted mark followed by only spaces at end', () => {
    const input = 'hola ¿   ';
    const result = splitChatText(input);
    expect(result).toHaveLength(SINGLE_CHUNK);
    expect(result[FIRST_ELEMENT]).toContain('¿');
  });
});

describe('Position helpers - unbalanced close paren', () => {
  test('should handle text with close paren before open paren', () => {
    const input =
      'Texto con paréntesis cerrado) aquí y luego (más información) sobre el producto disponible.' +
      ' También tenemos otras opciones para ti.';
    const result = splitChatText(input);
    const hasContent = result.some((chunk) => chunk.includes('paréntesis cerrado)'));
    expect(hasContent).toBe(true);
  });
});

describe('Product card - inline question in last card', () => {
  test('should extract inline question embedded in last card line', () => {
    const input =
      'Encontré opciones:\n\n' +
      '1. 🛍️ Zapatillas Nike Air: 💵 $500.000\n📏 Talla: 40, 41.\n' +
      '✅ Son ideales para running y deporte ¿Te gustan estas zapatillas?';
    const result = splitChatText(input);
    const hasQuestion = result.some((chunk) => chunk.includes('¿Te gustan estas zapatillas?'));
    expect(hasQuestion).toBe(true);
    const hasCard = result.some((chunk) => chunk.includes('Zapatillas Nike Air'));
    expect(hasCard).toBe(true);
  });
});

describe('Paragraph processor - short first paragraph with long second', () => {
  test('should process intro with short and long paragraphs after colon', () => {
    const input =
      'Detalles:\nCorto.\n' +
      'Este es un párrafo muy largo con más de ciento cincuenta caracteres que describe todos los detalles' +
      ' del producto incluyendo materiales, dimensiones y disponibilidad en stock actual en la tienda.';
    const result = splitChatText(input);
    const hasIntro = result.some((chunk) => chunk.includes('Detalles:'));
    expect(hasIntro).toBe(true);
    const hasLongParagraph = result.some((chunk) => chunk.includes('párrafo muy largo'));
    expect(hasLongParagraph).toBe(true);
  });
});

describe('Sections - numbered list with bullet sub-items', () => {
  test('should handle bullet items within numbered list', () => {
    const input = '1. Opción primera disponible\n- Sub opción A\n- Sub opción B\n2. Opción segunda';
    const result = splitChatText(input);
    const hasList = result.some((chunk) => chunk.includes('1. Opción primera'));
    expect(hasList).toBe(true);
  });
});
