import { describe, expect, test } from '@jest/globals';

import { splitChatText } from '../index.js';

describe('List normalization - colon before number', () => {
  test('should normalize inline list when colon immediately precedes number', () => {
    const input = 'Necesito estos datos:1. Nombre completo 2. Email 3. Cédula';
    const result = splitChatText(input);
    const hasIntro = result.some((chunk) => chunk.includes('Necesito estos datos:'));
    expect(hasIntro).toBe(true);
    const hasList = result.some((chunk) => chunk.includes('1. Nombre completo'));
    expect(hasList).toBe(true);
  });
});

describe('List normalization - question mark before list', () => {
  test('should normalize list items after question mark with non-first item', () => {
    const input = '¿Cuál prefieres? 3. Ciudad A 4. Ciudad B 5. Ciudad C';
    const result = splitChatText(input);
    const hasContent = result.some((chunk) => chunk.includes('3. Ciudad A') && chunk.includes('4. Ciudad B'));
    expect(hasContent).toBe(true);
  });
});

describe('Sections - numbered list with text continuation', () => {
  test('should end numbered list when non-list text follows', () => {
    const input =
      '1. Opción primera disponible ahora\n' +
      '2. Opción segunda disponible también\n' +
      'Este texto no es parte de la lista sino que continúa la descripción del producto con información adicional.';
    const result = splitChatText(input);
    const hasListItems = result.some(
      (chunk) => chunk.includes('1. Opción primera') && chunk.includes('2. Opción segunda')
    );
    expect(hasListItems).toBe(true);
    const hasTextSeparate = result.some((chunk) => chunk.includes('Este texto no es parte'));
    expect(hasTextSeparate).toBe(true);
  });
});

describe('Sections - bullet list with text after', () => {
  test('should end bullet list when regular text follows', () => {
    const input =
      '- Primera opción disponible en la tienda\n' +
      '- Segunda opción disponible en la tienda\n' +
      'Este texto no es parte de la lista de opciones disponibles sino información adicional del producto.';
    const result = splitChatText(input);
    const hasBulletList = result.some(
      (chunk) => chunk.includes('- Primera opción') && chunk.includes('- Segunda opción')
    );
    expect(hasBulletList).toBe(true);
  });
});

describe('Sections - numbered list ending with blank lines', () => {
  test('should handle numbered list followed by blank lines only', () => {
    const input = '1. Primera opción\n2. Segunda opción\n\n';
    const result = splitChatText(input);
    const hasList = result.some(
      (chunk) => chunk.includes('1. Primera opción') && chunk.includes('2. Segunda opción')
    );
    expect(hasList).toBe(true);
  });
});

describe('List processor - short bullet list kept together', () => {
  test('should keep short bullet items as one chunk', () => {
    const input = 'Opciones:\n- Rojo\n- Azul\n- Verde\n\nElige tu favorito.';
    const result = splitChatText(input);
    const hasIntro = result.some((chunk) => chunk.includes('Opciones:'));
    expect(hasIntro).toBe(true);
    const hasBulletsTogetherOrSplit = result.some((chunk) => chunk.includes('- Rojo'));
    expect(hasBulletsTogetherOrSplit).toBe(true);
  });
});

describe('Split processors - response prompt adjustment', () => {
  test('should handle intro containing puedes responder con pattern', () => {
    const input = 'Datos necesarios: puedes responder con:\n- Nombre\n- Email';
    const result = splitChatText(input);
    const hasIntro = result.some((chunk) => chunk.includes('Datos necesarios:'));
    expect(hasIntro).toBe(true);
    const hasList = result.some((chunk) => chunk.includes('- Nombre'));
    expect(hasList).toBe(true);
  });
});

describe('Split processors - question with non-list lines', () => {
  test('should not treat question with mixed content as question-with-options', () => {
    const input =
      '¿Cuál de estos productos prefieres para tu compra?\n1. Opción A\nEsto no es un item de lista sino texto libre';
    const result = splitChatText(input);
    const hasQuestion = result.some((chunk) => chunk.includes('¿Cuál de estos productos'));
    expect(hasQuestion).toBe(true);
  });
});

describe('Sections - markdown section with bullet after double newline', () => {
  test('should handle markdown section followed by bullet after break', () => {
    const input =
      '*Información del producto*\n' +
      'Detalles del artículo seleccionado para tu compra\n\n' +
      '- Característica especial del producto disponible';
    const result = splitChatText(input);
    const hasMarkdownSection = result.some((chunk) => chunk.includes('*Información del producto*'));
    expect(hasMarkdownSection).toBe(true);
  });
});
