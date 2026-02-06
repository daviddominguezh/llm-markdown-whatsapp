import { describe, expect, test } from '@jest/globals';

import { splitChatText } from '../index.js';

describe('Edge cases - empty and basic input', () => {
  test('should return empty array for empty string', () => {
    expect(splitChatText('')).toEqual([]);
  });

  test('should return empty array for null/undefined', () => {
    expect(splitChatText(null)).toEqual([]);
    expect(splitChatText(undefined)).toEqual([]);
  });

  test('should handle text with only newlines and spaces', () => {
    const input = '\n\n   \n  ';
    const expected = ['\n\n   \n  '];
    expect(splitChatText(input)).toEqual(expected);
  });

  test('should handle mixed punctuation', () => {
    const input = '¡Hola! ¿Cómo estás? ¡Qué bueno verte! Me alegra mucho poder ayudarte hoy.';
    const expected = ['¡Hola! ¿Cómo estás? ¡Qué bueno verte! Me alegra mucho poder ayudarte hoy.'];
    expect(splitChatText(input)).toEqual(expected);
  });
});

describe('Edge cases - emoji handling', () => {
  test('should handle text with emojis', () => {
    const input =
      '¡Hola! 😊 ¿Te gusta este producto? 🛍️ Tenemos descuentos especiales hoy. También puedes ver nuestro catálogo completo en línea. 📱💻';
    const expected = [
      '¡Hola! 😊 ¿te gusta este producto? 🛍️ Tenemos descuentos especiales hoy.',
      'También puedes ver nuestro catálogo completo en línea. 📱💻',
    ];
    expect(splitChatText(input)).toEqual(expected);
  });

  test('should keep emoji with question instead of starting new segment', () => {
    const input = `¿Qué deseas hacer ahora? 😊
•Continuar con este pedido
•Comprar más productos
•Ver carrito
•Eliminar producto
•Reemplazar producto`;
    const expected = [
      `¿Qué deseas hacer ahora? 😊
`,
      `•Continuar con este pedido
•Comprar más productos
•Ver carrito
•Eliminar producto
•Reemplazar producto`,
    ];
    expect(splitChatText(input)).toEqual(expected);
  });
});

describe('Edge cases - question continuation and formatting', () => {
  test('should not split at question mark when lowercase text follows', () => {
    const input =
      '¡Hola! Me llamo Antonia. Estoy a tu servicio en Nike. Una tienda deportiva donde podrás encontrar zapatos, ropa y accesorios icónicos de la moda y la innovación en el deporte. Por favor, dime ¿cuál es tu nombre? para conocerte mejor 😊';
    const result = splitChatText(input);
    const hasQuestionWithContinuation = result.some((chunk) =>
      chunk.includes('¿cuál es tu nombre? para conocerte')
    );
    expect(hasQuestionWithContinuation).toBe(true);
    const hasBrokenContinuation = result.some((chunk) => chunk.trim().startsWith('para conocerte mejor'));
    expect(hasBrokenContinuation).toBe(false);
  });

  test('should handle text with markdown formatting', () => {
    const input =
      'Este producto tiene **características premium** y viene con *garantía extendida*. Puedes ver más detalles en `especificaciones técnicas`. También incluye soporte 24/7.';
    const expected = [
      'Este producto tiene **características premium** y viene con *garantía extendida*.',
      'Puedes ver más detalles en `especificaciones técnicas`. También incluye soporte 24/7.',
    ];
    expect(splitChatText(input)).toEqual(expected);
  });
});

describe('Edge cases - abbreviation protection', () => {
  test('should handle abbreviations like "etc." without breaking parentheses', () => {
    const input =
      '¡Perfecto! Para generar el enlace de pago y confirmar el total, necesito que me indiques:\n\n1. **Barrio**\n2. **Dirección exacta** (calle, número, referencia, etc.)\n\n¿Me puedes proporcionar esa información?';
    const expected = [
      '¡Perfecto! Para generar el enlace de pago y confirmar el total, necesito que me indiques:',
      '1. **Barrio**\n2. **Dirección exacta** (calle, número, referencia, etc.)',
      '¿Me puedes proporcionar esa información?',
    ];
    expect(splitChatText(input)).toEqual(expected);
  });

  test('should protect common abbreviations (etc., e.g., i.e., Dr., Mr.)', () => {
    const input =
      'Necesito algunos datos personales (nombre, edad, etc.) para continuar. El Dr. Pérez te atenderá pronto.';
    const expected = [
      'Necesito algunos datos personales (nombre, edad, etc.) para continuar.',
      'El Dr. Pérez te atenderá pronto.',
    ];
    expect(splitChatText(input)).toEqual(expected);
  });
});

describe('Edge cases - location and complex abbreviations', () => {
  test('should protect location abbreviations like D.C., U.S., U.K.', () => {
    const input = `📦 Resumen final de tu pedido:
* Producto: Nike Sportswear Breaking Windrunner (1 unidad)
 - Color: Negro
 - Talla: M
 - Precio: $388.465
* Envío a Bogotá D.C.: $5.000
Total a pagar (contra‑entrega): $393.465
¿Confirmas? 😊`;
    const expected = [
      `📦 Resumen final de tu pedido:
* Producto: Nike Sportswear Breaking Windrunner (1 unidad)
 - Color: Negro
 - Talla: M
 - Precio: $388.465
* Envío a Bogotá D.C.: $5.000
Total a pagar (contra‑entrega): $393.465
¿Confirmas? 😊`,
    ];
    expect(splitChatText(input)).toEqual(expected);
  });

  test('should handle abbreviations with periods (S.A., E.U.A.)', () => {
    const input =
      'La empresa S.A. fue fundada en el año 2020 por el Dr. Juan Pérez. Actualmente opera en E.U.A. y varios países de América Latina.';
    const expected = [
      'La empresa S.A. fue fundada en el año 2020 por el Dr. Juan Pérez.',
      'Actualmente opera en E.U.A. y varios países de América Latina.',
    ];
    expect(splitChatText(input)).toEqual(expected);
  });
});

describe('Edge cases - version numbers and long sentences', () => {
  test('should handle text with version numbers', () => {
    const input =
      'La nueva versión 2.5.1 incluye mejoras significativas en rendimiento. Actualizada desde la versión 2.4.8 con nuevas funcionalidades. Compatible con iOS 15.0 y superior.';
    const expected = [
      'La nueva versión 2.5.1 incluye mejoras significativas en rendimiento.',
      'Actualizada desde la versión 2.4.8 con nuevas funcionalidades. Compatible con iOS 15.0 y superior.',
    ];
    expect(splitChatText(input)).toEqual(expected);
  });

  test('should handle very long single sentence', () => {
    const input =
      'Este es un producto extraordinario que ha sido diseñado con la más alta calidad y atención al detalle, utilizando materiales premium importados directamente desde Europa y Asia, garantizando durabilidad excepcional, rendimiento superior y satisfacción total del cliente, respaldado por nuestro equipo de ingenieros especialistas con más de 20 años de experiencia en la industria.';
    const expected = [input];
    expect(splitChatText(input)).toEqual(expected);
  });
});
