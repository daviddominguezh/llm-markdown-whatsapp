import { describe, expect, test } from '@jest/globals';

import { splitChatText } from '../index.js';

describe('Number and price protection', () => {
  test('should not split formatted numbers with periods', () => {
    const input =
      'El precio total es $1.000.000 y puedes pagarlo en cuotas. También tenemos un descuento del 20% si pagas de contado.';
    const expected = [
      'El precio total es $1.000.000 y puedes pagarlo en cuotas.',
      'También tenemos un descuento del 20% si pagas de contado.',
    ];
    expect(splitChatText(input)).toEqual(expected);
  });

  test('should handle multiple formatted numbers', () => {
    const input =
      'Los precios van desde $100.000 hasta $5.000.000 dependiendo del modelo. También ofrecemos financiamiento desde $50.000 mensuales.';
    const expected = [
      'Los precios van desde $100.000 hasta $5.000.000 dependiendo del modelo.',
      'También ofrecemos financiamiento desde $50.000 mensuales.',
    ];
    expect(splitChatText(input)).toEqual(expected);
  });

  test('should handle decimal numbers', () => {
    const input =
      'La medida exacta es 15.5 centímetros y el peso es aproximadamente 2.3 kilogramos. La precisión es del 99.9% según las especificaciones técnicas.';
    const expected = [
      'La medida exacta es 15.5 centímetros y el peso es aproximadamente 2.3 kilogramos.',
      'La precisión es del 99.9% según las especificaciones técnicas.',
    ];
    expect(splitChatText(input)).toEqual(expected);
  });

  test('should handle numbers without currency symbols', () => {
    const input =
      'La producción anual es de 1.500.000 unidades y el crecimiento proyectado es del 25.5% para el próximo año. Las ventas superaron los 2.000.000 de unidades.';
    const expected = [
      'La producción anual es de 1.500.000 unidades y el crecimiento proyectado es del 25.5% para el próximo año.',
      'Las ventas superaron los 2.000.000 de unidades.',
    ];
    expect(splitChatText(input)).toEqual(expected);
  });
});

describe('Email protection - basic', () => {
  test('should not split email addresses', () => {
    const input =
      'Para contactarnos puedes escribir a juan.perez@example.com y te responderemos pronto. También puedes llamar al teléfono disponible.';
    const expected = [
      'Para contactarnos puedes escribir a juan.perez@example.com y te responderemos pronto.',
      'También puedes llamar al teléfono disponible.',
    ];
    expect(splitChatText(input)).toEqual(expected);
  });

  test('should handle multiple email addresses', () => {
    const input =
      'Contacta a support.team@company.co.uk para soporte técnico o a ventas.info@company.co.uk para información comercial. Nuestro equipo está disponible.';
    const expected = [
      'Contacta a support.team@company.co.uk para soporte técnico o a ventas.info@company.co.uk para información comercial.',
      'Nuestro equipo está disponible.',
    ];
    expect(splitChatText(input)).toEqual(expected);
  });
});

describe('Email protection - lists', () => {
  test('should handle emails in numbered lists', () => {
    const input =
      'Por favor envíame los siguientes datos:\n\n1. Nombre completo\n2. Correo electrónico (ejemplo: juan.perez@gmail.com)\n3. Número de teléfono\n\nTe contactaremos pronto.';
    const expected = [
      'Por favor envíame los siguientes datos:',
      '1. Nombre completo\n2. Correo electrónico (ejemplo: juan.perez@gmail.com)\n3. Número de teléfono',
      'Te contactaremos pronto.',
    ];
    expect(splitChatText(input)).toEqual(expected);
  });

  test('should keep numbered lists together without splitting at periods', () => {
    const input = `📋 Perfecto, David 😊. Para procesar tu pedido contra‑entrega, necesito algunos datos:
1. Nombre completo
2. Email
3. Cédula
4. Dirección completa (incluye barrio y, si aplica, detalles del apartamento/torre/conjunto).`;
    const expected = [
      '📋 Perfecto, David 😊. Para procesar tu pedido contra‑entrega, necesito algunos datos:',
      `1. Nombre completo
2. Email
3. Cédula
4. Dirección completa (incluye barrio y, si aplica, detalles del apartamento/torre/conjunto).`,
    ];
    expect(splitChatText(input)).toEqual(expected);
  });
});
