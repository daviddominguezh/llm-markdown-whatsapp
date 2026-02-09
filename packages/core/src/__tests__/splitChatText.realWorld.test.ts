import { describe, expect, test } from '@jest/globals';

import { splitChatText } from '../index.js';

describe('Real-world - customer and product info', () => {
  test('should handle customer service conversation', () => {
    const input =
      'Gracias por contactarnos. Entiendo tu situación y quiero ayudarte a resolverla de la mejor manera. Puedes enviar tu producto de vuelta sin costo adicional. ¿Prefieres un reembolso completo o un intercambio por otro modelo?';
    const expected = [
      'Gracias por contactarnos.',
      'Entiendo tu situación y quiero ayudarte a resolverla de la mejor manera.',
      'Puedes enviar tu producto de vuelta sin costo adicional.',
      '¿Prefieres un reembolso completo o un intercambio por otro modelo?',
    ];
    expect(splitChatText(input)).toEqual(expected);
  });

  test('should handle product description with specifications', () => {
    const input =
      'El iPhone 14 Pro tiene una pantalla Super Retina XDR de 6.1 pulgadas con tecnología ProMotion. Incluye el chip A16 Bionic y cámara principal de 48MP con zoom óptico 3x. Disponible en colores Morado Intenso, Oro, Plata y Negro Espacial. ¿Te gustaría conocer más sobre algún color específico?';
    const expected = [
      'El iPhone 14 Pro tiene una pantalla Super Retina XDR de 6.1 pulgadas con tecnología ProMotion.',
      'Incluye el chip A16 Bionic y cámara principal de 48MP con zoom óptico 3x.',
      'Disponible en colores Morado Intenso, Oro, Plata y Negro Espacial.',
      '¿Te gustaría conocer más sobre algún color específico?',
    ];
    expect(splitChatText(input)).toEqual(expected);
  });
});

describe('Real-world - shipping and payment', () => {
  test('should handle shipping and delivery information', () => {
    const input =
      'Tu pedido será procesado en 1-2 días hábiles y enviado mediante FedEx Express. El tiempo de entrega estimado es de 3-5 días hábiles para la ciudad de Bogotá. Recibirás un código de seguimiento por email y SMS una vez que el paquete sea despachado. ¿Necesitas que lo enviemos a una dirección diferente?';
    const expected = [
      'Tu pedido será procesado en 1-2 días hábiles y enviado mediante FedEx Express.',
      'El tiempo de entrega estimado es de 3-5 días hábiles para la ciudad de Bogotá.',
      'Recibirás un código de seguimiento por email y SMS una vez que el paquete sea despachado.',
      '¿Necesitas que lo enviemos a una dirección diferente?',
    ];
    expect(splitChatText(input)).toEqual(expected);
  });

  test('should handle payment and pricing information', () => {
    const input =
      'El precio final es $450.000 COP incluyendo IVA del 19%. Puedes pagar con tarjeta de crédito, débito, PSE o efectivo contra entrega. También ofrecemos financiamiento sin intereses a 3, 6 o 12 meses con tarjetas participantes. ¿Cuál método de pago prefieres?';
    const expected = [
      'El precio final es $450.000 COP incluyendo IVA del 19%.',
      'Puedes pagar con tarjeta de crédito, débito, PSE o efectivo contra entrega.',
      'También ofrecemos financiamiento sin intereses a 3, 6 o 12 meses con tarjetas participantes. ¿Cuál método de pago prefieres?',
    ];
    expect(splitChatText(input)).toEqual(expected);
  });
});

const BULLET_POINTS_INPUT = `¡Entiendo que necesitas un calzado cómodo para la maratón de mañana! 😊
Encontré estas opciones que pueden ser perfectas para ti:

*Nike Pegasus Plus*
- Zapatillas de alto rendimiento, diseñadas para maratones y running.
- Amortiguación responsiva con espuma ZoomX Foam de cuerpo completo, que brinda un alto nivel de retorno de energía.
- Parte superior Flyknit elástica y transpirable, que se adapta al pie para un ajuste perfecto.
- Suela de goma de alta resistencia a la abrasión que ofrece tracción.
- Disponibles en color Negro (tallas 38, 41, 43) y en combinación Azul glacial/Espuma menta/Verde impacto/Negro (tallas 38, 41, 43).

*Nike Air Max 90*
- Calzado de running con suela tipo waffle y amortiguación Air visible, ideal para mantener comodidad en largas distancias.
- Sistema de ventilación que ayuda a regular la temperatura del pie.
- Parte superior con cuello acolchado low que combina estilo y confort.
- Disponibles en color Hueso claro/Oliva neutro/Gris universitario/Cueva (tallas 40, 41, 42, 43) y en combinación Blanco/Gris universitario/Gris vasto/Rojo universitario (tallas 40, 41, 42, 43).

Ambos modelos están diseñados para ofrecer soporte y comodidad en carreras largas, por lo que cualquiera de ellos podría ser una excelente elección para tu maratón.

¿Cuál de estos productos te gustaría?

Puedes responder con:
- "Me gusta el producto Nike Pegasus Plus"
- "Me gusta el producto Nike Air Max 90"
- "Tienes el producto [nombre] en otro material/tamaño/talla/color?"
- "Ninguno me gustó"`;

const PEGASUS_BULLET_COUNT = 5;
const AIR_MAX_BULLET_COUNT = 4;
const RESPONSE_BULLET_COUNT = 4;

function countBulletLines(text: string): number {
  return text.split('\n').filter((line) => line.trim().startsWith('-')).length;
}

describe('Real-world - product with bullet points', () => {
  test('should split into intro, two product sections, closing, and question', () => {
    const [intro, pegasus, airMax, closing, questionChunk] = splitChatText(BULLET_POINTS_INPUT);
    expect(intro).toContain('¡Entiendo que necesitas un calzado cómodo');
    expect(intro).toContain('Encontré estas opciones que pueden ser perfectas para ti:');
    expect(pegasus).toContain('*Nike Pegasus Plus*');
    expect(pegasus).toContain('- Zapatillas de alto rendimiento');
    expect(pegasus).toContain('- Disponibles en color Negro');
    expect(countBulletLines(pegasus ?? '')).toBe(PEGASUS_BULLET_COUNT);
    expect(airMax).toContain('*Nike Air Max 90*');
    expect(airMax).toContain('- Calzado de running');
    expect(airMax).toContain('- Disponibles en color Hueso claro');
    expect(countBulletLines(airMax ?? '')).toBe(AIR_MAX_BULLET_COUNT);
    expect(closing).toContain('Ambos modelos están diseñados para ofrecer soporte');
    expect(closing).not.toContain('¿Cuál de estos productos te gustaría?');
    expect(questionChunk).toBeDefined();
  });

  test('should keep response options together with question', () => {
    const [, , , , questionChunk] = splitChatText(BULLET_POINTS_INPUT);
    expect(questionChunk).toContain('¿Cuál de estos productos te gustaría?');
    expect(questionChunk).toContain('Puedes responder con:');
    expect(questionChunk).toContain('"Me gusta el producto Nike Pegasus Plus"');
    expect(questionChunk).toContain('"Me gusta el producto Nike Air Max 90"');
    expect(questionChunk).toContain('"Tienes el producto [nombre] en otro material/tamaño/talla/color?"');
    expect(questionChunk).toContain('"Ninguno me gustó"');
    expect(countBulletLines(questionChunk ?? '')).toBe(RESPONSE_BULLET_COUNT);
  });
});

describe('Real-world - sales summary with markdown headers and store data', () => {
  test('should split sales summary into meaningful chunks', () => {
    const str = `Here's yesterday's sales summary (Sunday, Feb 8):

*Total: $4,879.36* across 318 transactions

*By store:*

*Dolphin Mall* -- $1,852.69 (175 transactions)
*Florida Mall* -- $1,613.66 (32 transactions)
*The Falls Mall* -- $1,413.01 (111 transactions)

Notable: Florida Mall had the highest average ticket at ~$50.43, while Dolphin Mall led in volume. Need any more details?`;

    const result = splitChatText(str);

    expect(result).toEqual([
      "Here's yesterday's sales summary (Sunday, Feb 8):",
      `*Total: $4,879.36* across 318 transactions

*By store:*`,
      `*Dolphin Mall* -- $1,852.69 (175 transactions)
*Florida Mall* -- $1,613.66 (32 transactions)
*The Falls Mall* -- $1,413.01 (111 transactions)`,
      'Notable: Florida Mall had the highest average ticket at ~$50.43, while Dolphin Mall led in volume. Need any more details?',
    ]);
  });
});
