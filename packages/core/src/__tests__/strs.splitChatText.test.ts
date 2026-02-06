import { describe, expect, test } from '@jest/globals';

import { splitChatText } from '../index.js';

describe('splitChatText', () => {
  describe('Basic question splitting', () => {
    test('should split at question mark when text follows', () => {
      const input =
        '¿Qué te parece el Nike Air Max 90 en tonos hueso/oliva/gris, o el Nike Pegasus Plus en color negro? También tengo otras opciones disponibles si prefieres ver más estilos.';
      const expected = [
        '¿Qué te parece el Nike Air Max 90 en tonos hueso/oliva/gris, o el Nike Pegasus Plus en color negro?',
        'También tengo otras opciones disponibles si prefieres ver más estilos.',
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('should not split when only one sentence', () => {
      const input = '¿Cómo estás hoy?';
      const expected = ['¿Cómo estás hoy?'];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('should not split short text even with question', () => {
      const input = 'Me gusta mucho. ¿Te parece bien?';
      const expected = ['Me gusta mucho. ¿Te parece bien?'];
      expect(splitChatText(input)).toEqual(expected);
    });
  });

  describe('Contiguous questions', () => {
    test('should split contiguous questions at the last question mark', () => {
      const input =
        '¿Qué te parece esta? ¿quieres ver más fotos? También tengo otras opciones disponibles si prefieres ver más estilos.';
      const expected = [
        '¿Qué te parece esta? ¿quieres ver más fotos? ',
        'También tengo otras opciones disponibles si prefieres ver más estilos.',
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('should handle multiple contiguous questions', () => {
      const input =
        '¿Te gusta? ¿Quieres comprarlo? ¿O prefieres ver más opciones? Perfecto, entonces procedamos.';
      const expected = [
        '¿Te gusta? ¿Quieres comprarlo? ¿O prefieres ver más opciones? ',
        'Perfecto, entonces procedamos.',
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('should not treat questions as contiguous when separated by periods', () => {
      const input =
        '¿Qué te parece esta opción? Me encanta este modelo. También tengo otras opciones. ¿Te gustaría ver más?';
      const expected = [
        '¿Qué te parece esta opción? Me encanta este modelo.',
        'También tengo otras opciones. ¿Te gustaría ver más?',
      ];
      expect(splitChatText(input)).toEqual(expected);
    });
  });

  describe('Period splitting for long text', () => {
    test('should split at periods when text is over 100 chars', () => {
      const input =
        'Me encanta el estilo de ese sweater, yo creo que podría favorecerte demasiado, así que te propongo que lo lleves, hermosa, sé que es la opción correcta. Además, te ofrezco 20% de descuento.';
      const expected = [
        'Me encanta el estilo de ese sweater, yo creo que podría favorecerte demasiado, así que te propongo que lo lleves, hermosa, sé que es la opción correcta.',
        'Además, te ofrezco 20% de descuento.',
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('should not split when text is under 100 chars', () => {
      const input =
        'Me encanta el estilo de ese sweater, yo creo que podría favorecerte demasiado, llévalo. Aceptas?';
      const expected = [
        'Me encanta el estilo de ese sweater, yo creo que podría favorecerte demasiado, llévalo. Aceptas?',
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('should handle multiple period splits', () => {
      const input =
        'Este producto es excelente para uso diario y tiene una calidad premium que durará años. Además, viene con garantía extendida de 2 años sin costo adicional. También incluye envío gratuito a toda la ciudad y instalación profesional gratuita. ¿Te interesa conocer más detalles?';
      const expected = [
        'Este producto es excelente para uso diario y tiene una calidad premium que durará años.',
        'Además, viene con garantía extendida de 2 años sin costo adicional.',
        'También incluye envío gratuito a toda la ciudad y instalación profesional gratuita. ¿Te interesa conocer más detalles?',
      ];
      expect(splitChatText(input)).toEqual(expected);
    });
  });

  describe('Smart question-period combination', () => {
    test('should combine short question with following sentence to avoid fragmentation', () => {
      const input =
        '¿Qué te parece este Nike Air Max 90 en color Hueso claro? También lo tengo en Blanco/Gris universitario. Si prefieres otro modelo, el Nike Pegasus Plus está disponible en Negro o en Azul glacial. ¿Te gustaría ver más opciones?';
      const expected = [
        '¿Qué te parece este Nike Air Max 90 en color Hueso claro? También lo tengo en Blanco/Gris universitario.',
        'Si prefieres otro modelo, el Nike Pegasus Plus está disponible en Negro o en Azul glacial. ¿Te gustaría ver más opciones?',
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('should split after long question even if followed by another sentence', () => {
      const input =
        '¿Qué te parece esta opción del Nike Air Max 90 en color Hueso claro/Oliva neutro/Gris universitario/Cueva? También tengo disponibles otras opciones como el mismo modelo en Blanco/Gris universitario/Gris vasto/Rojo universitario, o podríamos ver el Nike Pegasus Plus en Negro o el Tenis de skateboarding en Blanco/Rosa óxido/Negro. ¿Te gustaría explorar alguna de estas alternativas?';
      const expected = [
        '¿Qué te parece esta opción del Nike Air Max 90 en color Hueso claro/Oliva neutro/Gris universitario/Cueva?',
        'También tengo disponibles otras opciones como el mismo modelo en Blanco/Gris universitario/Gris vasto/Rojo universitario, o podríamos ver el Nike Pegasus Plus en Negro o el Tenis de skateboarding en Blanco/Rosa óxido/Negro.',
        '¿Te gustaría explorar alguna de estas alternativas?',
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('should avoid splitting before short questions', () => {
      const input =
        'Este producto tiene excelentes características y viene con garantía extendida de por vida, además incluye soporte técnico 24/7. ¿Te interesa?';
      const expected = [
        'Este producto tiene excelentes características y viene con garantía extendida de por vida, además incluye soporte técnico 24/7. ¿Te interesa?',
      ];
      expect(splitChatText(input)).toEqual(expected);
    });
  });

  describe('URL and link protection', () => {
    test('should not split URLs with periods', () => {
      const input =
        '¡Genial! Abre este link para terminar los detalles de tu pedido y ver el total: *https://console.usecloser.ai/personalizations/8e283bf8-90bb-4e8f-b562-9a2ea757cf5a*\n\n¡Gracias por tu compra! Si necesitas algo más, estoy aquí para ayudarte.';
      const expected = [
        '¡Genial! Abre este link para terminar los detalles de tu pedido y ver el total: *https://console.usecloser.ai/personalizations/8e283bf8-90bb-4e8f-b562-9a2ea757cf5a*',
        '¡Gracias por tu compra! Si necesitas algo más, estoy aquí para ayudarte.',
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('should not split plain domain names like Nike.com.co', () => {
      const input =
        '¡Hola! Me llamo Antonia. Estoy a tu servicio en Nike 😊. No, actualmente no hacemos envíos a Bucaramanga (Santander). Si necesitas el producto, puedes comprarlo en línea (Nike.com.co) y luego elegir una opción de recogida en una tienda Nike cercana o solicitar el envío a una ciudad dentro de nuestra zona de cobertura. ¿Podrías decirme tu nombre para poder asistirte mejor? 😊';
      const result = splitChatText(input);

      // The key assertion: Nike.com.co should NOT be split
      const hasSplitDomain = result.some(
        (chunk) => chunk.includes('Nike.') && !chunk.includes('Nike.com.co')
      );
      expect(hasSplitDomain).toBe(false);

      // Verify Nike.com.co appears in full in one of the chunks
      const hasDomainInFull = result.some((chunk) => chunk.includes('Nike.com.co'));
      expect(hasDomainInFull).toBe(true);

      // Should NOT have "com." or "co)" as separate chunks
      const hasBrokenDomain = result.some(
        (chunk) => chunk.trim() === 'com.' || chunk.trim().startsWith('co)')
      );
      expect(hasBrokenDomain).toBe(false);
    });

    test('should preserve plain domains like example.com in parentheses', () => {
      const input =
        'Si necesitas más información, visita nuestro sitio web (example.com) donde encontrarás todos los detalles. También puedes llamar al número de atención al cliente.';
      const expected = [
        'Si necesitas más información, visita nuestro sitio web (example.com) donde encontrarás todos los detalles.',
        'También puedes llamar al número de atención al cliente.',
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('should preserve domains with country codes like site.co.uk', () => {
      const input =
        'Puedes visitar nuestra tienda en Reino Unido en shop.example.co.uk para ver productos exclusivos. Además, tenemos promociones especiales para nuevos clientes.';
      const expected = [
        'Puedes visitar nuestra tienda en Reino Unido en shop.example.co.uk para ver productos exclusivos.',
        'Además, tenemos promociones especiales para nuevos clientes.',
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('should handle multiple plain domains in the same text', () => {
      const input =
        'Visita Nike.com.co para ver nuestro catálogo completo y Adidas.com.mx para comparar precios. También puedes revisar Puma.co.uk si buscas ofertas internacionales. ¿Te gustaría que te ayude con algo más?';
      const result = splitChatText(input);

      // All domains should be preserved intact
      const allDomainsIntact =
        result.some((chunk) => chunk.includes('Nike.com.co')) &&
        result.some((chunk) => chunk.includes('Adidas.com.mx')) &&
        result.some((chunk) => chunk.includes('Puma.co.uk'));
      expect(allDomainsIntact).toBe(true);

      // No chunk should have broken domain parts
      const hasBrokenParts = result.some((chunk) => {
        const trimmed = chunk.trim();
        return (
          trimmed === 'com.co' ||
          trimmed === 'com.mx' ||
          trimmed === 'co.uk' ||
          trimmed.startsWith('co)') ||
          trimmed.startsWith('mx)')
        );
      });
      expect(hasBrokenParts).toBe(false);
    });

    test('should split properly around URLs in longer text', () => {
      const input =
        'Este es un texto largo con información importante sobre el producto que estás comprando y necesitas saber todos los detalles. Puedes ver más información en https://www.example.com/product/details. Además, tenemos ofertas especiales disponibles.';
      const expected = [
        'Este es un texto largo con información importante sobre el producto que estás comprando y necesitas saber todos los detalles. Puedes ver más información en https://www.example.com/product/details',
        'Además, tenemos ofertas especiales disponibles.',
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('should handle multiple URLs in text', () => {
      const input =
        'Visita nuestro catálogo en https://shop.example.com y nuestra guía de tallas en https://help.example.com/sizing. Para dudas, contacta https://support.example.com o llama al 123-456-7890.';
      const expected = [
        'Visita nuestro catálogo en https://shop.example.com y nuestra guía de tallas en https://help.example.com/sizing\n Para dudas, contacta https://support.example.com o llama al 123-456-7890.',
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('should handle www URLs', () => {
      const input =
        'Puedes encontrar más información en www.example.com/products o en www.help.example.com para soporte técnico. También tenemos un blog en www.blog.example.com con consejos útiles.';
      const expected = [
        'Puedes encontrar más información en www.example.com/products o en www.help.example.com para soporte técnico.',
        'También tenemos un blog en www.blog.example.com con consejos útiles.',
      ];
      expect(splitChatText(input)).toEqual(expected);
    });
  });

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

  describe('Email protection', () => {
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

  describe('Edge cases and special scenarios', () => {
    test('should return empty array for empty string', () => {
      expect(splitChatText('')).toEqual([]);
    });

    test('should return empty array for null/undefined', () => {
      expect(splitChatText(null as any)).toEqual([]);
      expect(splitChatText(undefined as any)).toEqual([]);
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

    test('should not split at question mark when lowercase text follows (continuation of sentence)', () => {
      const input =
        '¡Hola! Me llamo Antonia. Estoy a tu servicio en Nike. Una tienda deportiva donde podrás encontrar zapatos, ropa y accesorios icónicos de la moda y la innovación en el deporte. Por favor, dime ¿cuál es tu nombre? para conocerte mejor 😊';
      const result = splitChatText(input);

      // The key assertion: question with lowercase continuation should be kept together
      const hasQuestionWithContinuation = result.some((chunk) =>
        chunk.includes('¿cuál es tu nombre? para conocerte')
      );
      expect(hasQuestionWithContinuation).toBe(true);

      // Should NOT have "para conocerte mejor" as a separate chunk
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

    test('should handle abbreviations with periods (S.A., E.U.A.) - Dr. and multi-letter abbreviations are now protected', () => {
      const input =
        'La empresa S.A. fue fundada en el año 2020 por el Dr. Juan Pérez. Actualmente opera en E.U.A. y varios países de América Latina.';
      const expected = [
        'La empresa S.A. fue fundada en el año 2020 por el Dr. Juan Pérez.',
        'Actualmente opera en E.U.A. y varios países de América Latina.',
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('should handle text with version numbers (current behavior)', () => {
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
      const expected = [input]; // Should not split as it's one sentence
      expect(splitChatText(input)).toEqual(expected);
    });
  });

  describe('Real-world scenarios', () => {
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

    test('should handle product description with bullet points and specifications', () => {
      const input = `¡Entiendo que necesitas un calzado cómodo para la maratón de mañana! 😊
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
      const result = splitChatText(input);

      // Log the result to show improved splitting
      console.log('\n=== IMPROVED SPLITTING (keeps bullet points together) ===');
      result.forEach((chunk, index) => {
        console.log(`\nChunk ${index + 1}:`);
        console.log(chunk);
        console.log('---');
      });
      console.log(`\nTotal chunks: ${result.length} (previously was 11)\n`);

      // Verify expected chunking behavior
      expect(result.length).toBe(5);

      // Chunk 1: Introduction
      expect(result[0]).toContain('¡Entiendo que necesitas un calzado cómodo');
      expect(result[0]).toContain('Encontré estas opciones que pueden ser perfectas para ti:');

      // Chunk 2: Nike Pegasus Plus with ALL its bullets together
      const chunk2 = result[1];
      expect(chunk2).toBeDefined();
      expect(chunk2).toContain('*Nike Pegasus Plus*');
      expect(chunk2).toContain('- Zapatillas de alto rendimiento');
      expect(chunk2).toContain('- Disponibles en color Negro');
      expect(chunk2!.split('\n').filter((line) => line.trim().startsWith('-')).length).toBe(5);

      // Chunk 3: Nike Air Max 90 with ALL its bullets together
      const chunk3 = result[2];
      expect(chunk3).toBeDefined();
      expect(chunk3).toContain('*Nike Air Max 90*');
      expect(chunk3).toContain('- Calzado de running');
      expect(chunk3).toContain('- Disponibles en color Hueso claro');
      expect(chunk3!.split('\n').filter((line) => line.trim().startsWith('-')).length).toBe(4);

      // Chunk 4: Closing paragraph only
      expect(result[3]).toContain('Ambos modelos están diseñados para ofrecer soporte');
      expect(result[3]).not.toContain('¿Cuál de estos productos te gustaría?');

      // Chunk 5: Question + "Puedes responder con:" + response option bullets
      const chunk5 = result[4];
      expect(chunk5).toBeDefined();
      expect(chunk5).toContain('¿Cuál de estos productos te gustaría?');
      expect(chunk5).toContain('Puedes responder con:');
      expect(chunk5).toContain('"Me gusta el producto Nike Pegasus Plus"');
      expect(chunk5).toContain('"Me gusta el producto Nike Air Max 90"');
      expect(chunk5).toContain('"Tienes el producto [nombre] en otro material/tamaño/talla/color?"');
      expect(chunk5).toContain('"Ninguno me gustó"');
      // All 4 response option bullets should be in this chunk
      expect(chunk5!.split('\n').filter((line) => line.trim().startsWith('-')).length).toBe(4);
    });
  });

  describe('Real-world test cases from data.js', () => {
    test('Test 1: Numbered lists should not split at periods (1., 2., 3., 4.)', () => {
      // Explanation: When we have a list (1., 2., 3., ...) we must never split the list unless each member of the list is huge
      // (150 or more characters), and ALSO ensure each item from the list starts with a line-break,
      // if the line break is not there, then add it
      const input = `📋 Para procesar tu pedido necesito algunos datos: 1. Nombre completo 2. Email 3. Cédula 4. Dirección completa (dirección exacta con barrio y si aplican detalles del apartamento/torre/conjunto).`;
      const expected = [
        `📋 Para procesar tu pedido necesito algunos datos:`,
        `1. Nombre completo
2. Email
3. Cédula
4. Dirección completa (dirección exacta con barrio y si aplican detalles del apartamento/torre/conjunto).`,
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('Test 2: Bullet lists should not split within items', () => {
      // Explanation: the string "Disponibles en negro y en una combinación multicolor." is part of the first item from
      // the list (the list is given by the hyphens "-"). Since it is a member of the list, we cannot split it (we can
      // split a list in its inner items, if they are huge (150+ chars), but we cannot split the items themselves)
      const input = `Encontré estas opciones:

- Nike Pegasus Plus – Zapatillas de alto rendimiento para maratones y running, con amortiguación ZoomX Foam y parte superior Flyknit que se adapta al pie. Disponibles en negro y en una combinación multicolor.
- Nike Air Max 90 – Modelo clásico con suela tipo waffle y la icónica amortiguación Air visible, en tonos neutros como hueso claro/oliva/gris universitario.
- Tenis de skateboarding – Zapatillas diseñadas para skate con suela vulcanizada y Zoom Air, disponibles en blanco con varios materiales (cuero, gamuza, algodón) y también en negro.
¿Cuál de estos modelos te interesa más? 😊`;
      const expected = [
        `Encontré estas opciones:`,
        `- Nike Pegasus Plus – Zapatillas de alto rendimiento para maratones y running, con amortiguación ZoomX Foam y parte superior Flyknit que se adapta al pie. Disponibles en negro y en una combinación multicolor.`,
        `- Nike Air Max 90 – Modelo clásico con suela tipo waffle y la icónica amortiguación Air visible, en tonos neutros como hueso claro/oliva/gris universitario.`,
        `- Tenis de skateboarding – Zapatillas diseñadas para skate con suela vulcanizada y Zoom Air, disponibles en blanco con varios materiales (cuero, gamuza, algodón) y también en negro.`,
        `¿Cuál de estos modelos te interesa más? 😊`,
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('Test 3: Bullet lists should keep each item intact', () => {
      // Explanation: same as above
      const input = `Encontré estas opciones:

- Tenis de skateboarding: Zapatillas diseñadas para skateboarding con suela vulcanizada, amortiguación Zoom Air y una parte superior rediseñada para un mejor ajuste y comodidad. Disponibles en varios colores y materiales como cuero, gamuza, lona y algodón. 👟
- Nike Pegasus Plus: Zapatillas de alto rendimiento para running con espuma ZoomX Foam de largo completo, parte superior Flyknit transpirable y suela de goma resistente para tracción. Ideales para maratones y entrenamientos diarios. 🏃‍♂️
- Nike Air Max 90: Calzado clásico de running con suela tipo waffle y amortiguación Air visible. Ofrece ventilación y comodidad con un diseño icónico y materiales de alta calidad. 👟
- Nike Dunk Low Retro: Modelo clásico con parte superior de cuero auténtico y sintético, entresuela de espuma ligera y suela de goma con punto de pivote. Disponible en combinaciones de colores.`;
      const expected = [
        `Encontré estas opciones:`,
        `- Tenis de skateboarding: Zapatillas diseñadas para skateboarding con suela vulcanizada, amortiguación Zoom Air y una parte superior rediseñada para un mejor ajuste y comodidad. Disponibles en varios colores y materiales como cuero, gamuza, lona y algodón. 👟`,
        `- Nike Pegasus Plus: Zapatillas de alto rendimiento para running con espuma ZoomX Foam de largo completo, parte superior Flyknit transpirable y suela de goma resistente para tracción. Ideales para maratones y entrenamientos diarios. 🏃‍♂️`,
        `- Nike Air Max 90: Calzado clásico de running con suela tipo waffle y amortiguación Air visible. Ofrece ventilación y comodidad con un diseño icónico y materiales de alta calidad. 👟`,
        `- Nike Dunk Low Retro: Modelo clásico con parte superior de cuero auténtico y sintético, entresuela de espuma ligera y suela de goma con punto de pivote. Disponible en combinaciones de colores.`,
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('Test 4: This splitting is fine (emoji with question)', () => {
      const input = `Lamentablemente, el Nike Pegasus Plus no está disponible en algodón. Sin embargo, tenemos tenis de skateboarding en algodón (color blanco) y otras opciones en este material. 😊 ¿Te gustaría continuar con alguna de estas alternativas o buscar otro producto?`;
      const expected = [
        'Lamentablemente, el Nike Pegasus Plus no está disponible en algodón.',
        'Sin embargo, tenemos tenis de skateboarding en algodón (color blanco) y otras opciones en este material.',
        '😊 ¿Te gustaría continuar con alguna de estas alternativas o buscar otro producto?',
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('Test 5: This splitting is fine (product description with question)', () => {
      const input = `Encontré esta opción: Tenis de skateboarding (Algodón, Color: Blanco) – Zapatillas diseñadas para skateboarding con suela vulcanizada, amortiguación Zoom Air y una parte superior rediseñada para un mejor ajuste y comodidad. 👍 ¿Te gusta el producto Tenis de skateboarding?`;
      const expected = [
        'Encontré esta opción: Tenis de skateboarding (Algodón, Color: Blanco) – Zapatillas diseñadas para skateboarding con suela vulcanizada, amortiguación Zoom Air y una parte superior rediseñada para un mejor ajuste y comodidad.',
        '👍 ¿Te gusta el producto Tenis de skateboarding?',
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('Test 6: Small chunks (< 25 chars) should merge with next chunk', () => {
      // Explanation: when one of the splits is too small (less than 25 chars) we must add it to the next chunk
      const input = `Mónica, ¿qué te parece la Nike Pegasus Plus? 👟 Precio: $1.015.000. Tall. 38, 41, 43. Colores: Negro, Azul/Espuma/Verde/Negro. Amortiguación ligera y transpirable. ¿Te gusta?`;
      const expected = [
        'Mónica, ¿qué te parece la Nike Pegasus Plus? 👟 Precio: $1.015.000.',
        'Tall. 38, 41, 43. Colores: Negro, Azul/Espuma/Verde/Negro. Amortiguación ligera y transpirable. ¿Te gusta?',
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('Test 7: Numbered lists should not split items', () => {
      // Explanation: we must not split items of the list
      const input = `Encontré dos opciones geniales para correr, Sebastián 👟:
1. Nike Air Max 90 – $724.950, tallas 40-43. Colores variados, suela waffle.
2. Nike Pegasus Plus – $1.015.000, tallas 38, 41, 43. Negro, azul y verde. ¿Cuál te gusta más?`;
      const expected = [
        `Encontré dos opciones geniales para correr, Sebastián 👟:`,
        `1. Nike Air Max 90 – $724.950, tallas 40-43. Colores variados, suela waffle.`,
        `2. Nike Pegasus Plus – $1.015.000, tallas 38, 41, 43. Negro, azul y verde. ¿Cuál te gusta más?`,
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('Test 8: Small chunks (< 25 chars) should merge with next chunk (price example)', () => {
      // Explanation: when one of the splits is too small (less than 25 chars) we must add it to the next chunk
      const input = `Nike Air Max 90 – $724.950. Tallas: 40‑43. Colores: Blanco, Gris, Rojo, Hueso, Oliva, Cueva. Suela waffle y Air visible. ¿Qué talla? 👟`;
      const expected = [
        `Nike Air Max 90 – $724.950.`,
        `Tallas: 40‑43. Colores: Blanco, Gris, Rojo, Hueso, Oliva, Cueva. Suela waffle y Air visible. ¿Qué talla? 👟`,
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('Test 9: Long list items (> 150 chars) should split by items', () => {
      // Explanation: the items of the list have more than 150 chars, so we must split the list in chunks
      const input = `Encontré estas opciones:
Nike Trail – Chaqueta de running impermeable con acabado repelente al agua, ajuste holgado y tonos tierra. Disponible en color multicolor y tallas XS, S, M. Es ideal para correr en el bosque o en la montaña y mantenerse seco. 🏃‍♂️
Nike Sportswear Breaking Windrunner – Chaqueta amplia con acabado repelente al agua en color negro, con gráficos de átomos giratorios. Disponible en tallas XS, S, M. Perfecta para actividades urbanas o al aire libre, manteniendo la comodidad y la protección contra la lluvia. ☔

¿Cuál de estas chaquetas te interesa más?`;
      const expected = [
        `Encontré estas opciones:`,
        `Nike Trail – Chaqueta de running impermeable con acabado repelente al agua, ajuste holgado y tonos tierra. Disponible en color multicolor y tallas XS, S, M. Es ideal para correr en el bosque o en la montaña y mantenerse seco. 🏃‍♂️`,
        `Nike Sportswear Breaking Windrunner – Chaqueta amplia con acabado repelente al agua en color negro, con gráficos de átomos giratorios. Disponible en tallas XS, S, M. Perfecta para actividades urbanas o al aire libre, manteniendo la comodidad y la protección contra la lluvia. ☔`,
        `¿Cuál de estas chaquetas te interesa más?`,
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('Test 10: Long product list with bullet items', () => {
      // This is fine
      const input = `¡Perfecto, Leydi! Encontré varias opciones de zapatos deportivos que podrían interesarte. Aquí te detallo algunas:

- Tenis de skateboarding Janoski por 430.000: Son ideales para un estilo casual y dinámico, con excelente agarre para actividades como el skate o uso diario, ofreciendo comodidad y flexibilidad gracias a su diseño vulcanizado y amortiguación Zoom Air.

- Nike Pegasus Plus por 1.015.000: Perfectos para running y entrenamientos intensos, con espuma ZoomX para un retorno de energía superior y una parte superior Flyknit transpirable que se adapta perfectamente al pie.

- Nike Air Max 90 por 724.950: Un clásico con amortiguación Air visible para comodidad todo el día, suela waffle para tracción y un diseño versátil que combina estilo retro con rendimiento en running o uso casual.

- Nike Air Force 1 por 749.950: Icónicos y duraderos, con cuero premium y amortiguación Nike Air para un confort excepcional, ideales para la calle o la cancha con un toque atemporal.

¿Cuál de estos te gusta más, o prefieres que busque algo específico como color o talla?`;
      const expected = [
        `¡Perfecto, Leydi! Encontré varias opciones de zapatos deportivos que podrían interesarte. Aquí te detallo algunas:`,
        `- Tenis de skateboarding Janoski por 430.000: Son ideales para un estilo casual y dinámico, con excelente agarre para actividades como el skate o uso diario, ofreciendo comodidad y flexibilidad gracias a su diseño vulcanizado y amortiguación Zoom Air.`,
        `- Nike Pegasus Plus por 1.015.000: Perfectos para running y entrenamientos intensos, con espuma ZoomX para un retorno de energía superior y una parte superior Flyknit transpirable que se adapta perfectamente al pie.`,
        `- Nike Air Max 90 por 724.950: Un clásico con amortiguación Air visible para comodidad todo el día, suela waffle para tracción y un diseño versátil que combina estilo retro con rendimiento en running o uso casual.`,
        `- Nike Air Force 1 por 749.950: Icónicos y duraderos, con cuero premium y amortiguación Nike Air para un confort excepcional, ideales para la calle o la cancha con un toque atemporal.`,
        `¿Cuál de estos te gusta más, o prefieres que busque algo específico como color o talla?`,
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('Test 11: Small chunks (< 25 chars) should merge with next chunk (tallas example)', () => {
      // Explanation: when one of the splits is too small (less than 25 chars) we must add it to the next chunk
      const input = `Kiara, Nike Dunk Low Retro: $724.950. Tallas 39-43. Colores: Burdeos/Vinotinto, Azul, Oliva neutro/Caqui claro, Blanco/Blanco/Negro. Diseño icónico. Gusta o quieres otro color? 👟✨`;
      const expected = [
        `Kiara, Nike Dunk Low Retro: $724.950.`,
        `Tallas 39-43. Colores: Burdeos/Vinotinto, Azul, Oliva neutro/Caqui claro, Blanco/Blanco/Negro. Diseño icónico. Gusta o quieres otro color? 👟✨`,
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('Test 12: Small emoji-only chunks should merge backward with previous chunk', () => {
      // Explanation: When the last chunk is too small (< 20 chars), it should merge backward with the previous chunk
      // This prevents creating tiny emoji-only chunks at the end
      const input = `¡Perfecto! ✅❤️

De las dos opciones, la *Nike Trail* es ideal si buscas algo ligero y con ajuste holgado para terrenos complicados, mientras que la *Nike Sportswear Breaking Windrunner* te ofrece un tejido más absorbente y un diseño más clásico en negro.

¿Te inclinas por alguna de ellas?

Y, si ya sabes la talla, dime cuál prefieres para que pueda confirmar disponibilidad y enviarte los detalles de envío. 🚚💨`;
      const expected = [
        `¡Perfecto! ✅❤️

De las dos opciones, la *Nike Trail* es ideal si buscas algo ligero y con ajuste holgado para terrenos complicados, mientras que la *Nike Sportswear Breaking Windrunner* te ofrece un tejido más absorbente y un diseño más clásico en negro.

¿Te inclinas por alguna de ellas?`,
        `Y, si ya sabes la talla, dime cuál prefieres para que pueda confirmar disponibilidad y enviarte los detalles de envío. 🚚💨`,
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('Test 13: Product card lists (numbered lists with 🛍️) should split into individual cards', () => {
      // Explanation: When a numbered list has items that start with 🛍️ emoji, each item should be split into its own chunk
      // This is a special case that overrides the normal numbered list behavior
      const input = `Encontré estas opciones:

1. 🛍️  Zapatillas Pegasus Plus: 💵 $1.015.000
📏 Color: Negro, Azul glacial/Espuma menta/Verde impacto/Negro.
📏 Talla Calzado: 43, 41, 38.
✅ Zapatillas Pegasus Plus: ultraligeras, con amortiguación ZoomX y gran transpirabilidad, diseñadas para running intensivo y maratones, ideal para tus entrenamientos de carrera.

2. 🛍️  Zapaillas ISPA Sense: 💵 $804.900
📏 Talla Calzado: 38, 39, 40, 41, 42, 43.
✅ Zapaillas ISPA Sense: estilo casual con buena comodidad, pueden servir para trotes ligeros o uso diario, aunque no están optimizadas para alto rendimiento de running.

¿Cuál de estos productos te gusta?`;
      const expected = [
        `Encontré estas opciones:`,
        `🛍️  Zapatillas Pegasus Plus: 💵 $1.015.000
📏 Color: Negro, Azul glacial/Espuma menta/Verde impacto/Negro.
📏 Talla Calzado: 43, 41, 38.
✅ Zapatillas Pegasus Plus: ultraligeras, con amortiguación ZoomX y gran transpirabilidad, diseñadas para running intensivo y maratones, ideal para tus entrenamientos de carrera.`,
        `🛍️  Zapaillas ISPA Sense: 💵 $804.900
📏 Talla Calzado: 38, 39, 40, 41, 42, 43.
✅ Zapaillas ISPA Sense: estilo casual con buena comodidad, pueden servir para trotes ligeros o uso diario, aunque no están optimizadas para alto rendimiento de running.`,
        `¿Cuál de estos productos te gusta?`,
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('Test 14: Product card lists with bold formatting (**) should split into individual cards', () => {
      // Explanation: Product cards can also start with bold formatting (**1. 🛍️)
      // This is the same as regular product cards but with markdown bold syntax
      const input = `Encontré estas opciones:

**1. 🛍️ Tenis Skateboarding:** 💵 $430.000
📏 **Color:** Blanco/Rosa óxido/Negro, Blanco, Negro.
📏 **Talla Calzado:** 40, 38, 39, 41.
📏 **Material:** Cuero, Gamuza, Lona, Algodon.
✅ Este porque amas a Luisa

**2. 🛍️ Zapatillas ISPA Axis:** 💵 $902.000
📏 **Talla Calzado:** 38, 39, 40, 41, 42, 43.
✅ Este por si acaso

¿Cuál te gusta más?`;
      const expected = [
        `Encontré estas opciones:`,
        `**🛍️ Tenis Skateboarding:** 💵 $430.000
📏 **Color:** Blanco/Rosa óxido/Negro, Blanco, Negro.
📏 **Talla Calzado:** 40, 38, 39, 41.
📏 **Material:** Cuero, Gamuza, Lona, Algodon.
✅ Este porque amas a Luisa`,
        `**🛍️ Zapatillas ISPA Axis:** 💵 $902.000
📏 **Talla Calzado:** 38, 39, 40, 41, 42, 43.
✅ Este por si acaso`,
        `¿Cuál te gusta más?`,
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('Test 15: Product card lists with italic formatting (*) should split into individual cards', () => {
      // Explanation: Product cards can also start with italic formatting (*1. 🛍️)
      // This is the same as regular product cards but with markdown italic syntax
      const input = `Encontré estas opciones:

*1. 🛍️ Tenis Skateboarding:* 💵 $430.000
📏 *Color:* Blanco/Rosa óxido/Negro, Blanco, Negro.
📏 *Talla Calzado:* 40, 38, 39, 41.
📏 *Material:* Cuero, Gamuza, Lona, Algodon.
✅ Este porque amas a Luisa

*2. 🛍️ Zapatillas ISPA Axis:* 💵 $902.000
📏 *Talla Calzado:* 38, 39, 40, 41, 42, 43.
✅ Este por si acaso

¿Cuál te gusta más?`;
      const expected = [
        `Encontré estas opciones:`,
        `*🛍️ Tenis Skateboarding:* 💵 $430.000
📏 *Color:* Blanco/Rosa óxido/Negro, Blanco, Negro.
📏 *Talla Calzado:* 40, 38, 39, 41.
📏 *Material:* Cuero, Gamuza, Lona, Algodon.
✅ Este porque amas a Luisa`,
        `*🛍️ Zapatillas ISPA Axis:* 💵 $902.000
📏 *Talla Calzado:* 38, 39, 40, 41, 42, 43.
✅ Este por si acaso`,
        `¿Cuál te gusta más?`,
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('Test 16: Product card lists should separate trailing questions into separate chunk', () => {
      // Explanation: When a product card list ends with a question (without blank line separator),
      // the question should be split into its own chunk
      const input = `Encontré estas opciones:
1. 🛍️ Zapatillas Pegasus Plus
💵 Precio: $1.015.000
🌈 Color: Negro, Azul glacial/Espuma menta/Verde impacto/Negro.
👟 Talla Calzado: 43, 41, 38.
✅ Zapatillas de alto rendimiento diseñadas para running, con amortiguación ZoomX Foam y Flyknit ligero, ideales para entrenamientos intensivos y maratones.

2. 🛍️ Zapaillas ISPA Sense
💵 Precio: $804.900
👟 Talla Calzado: 38, 39, 40, 41, 42, 43.
¿Cuál de estos productos te gusta?`;
      const expected = [
        `Encontré estas opciones:`,
        `🛍️ Zapatillas Pegasus Plus
💵 Precio: $1.015.000
🌈 Color: Negro, Azul glacial/Espuma menta/Verde impacto/Negro.
👟 Talla Calzado: 43, 41, 38.
✅ Zapatillas de alto rendimiento diseñadas para running, con amortiguación ZoomX Foam y Flyknit ligero, ideales para entrenamientos intensivos y maratones.`,
        `🛍️ Zapaillas ISPA Sense
💵 Precio: $804.900
👟 Talla Calzado: 38, 39, 40, 41, 42, 43.`,
        `¿Cuál de estos productos te gusta?`,
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('Test 17: Product card lists with markdown titles (without 🛍️) should split into individual cards', () => {
      // Explanation: Product cards can also be identified by markdown formatting after the number
      // Pattern: "1. *Title*" or "1. **Title**" without the 🛍️ emoji
      const input = `¡Mira estas opciones de chaquetas para hombre! 👀

1.  *Conjunto Chaqueta y Pantaloneta - Hombre Urbano*
💵 Precio: $554.950
🌈 Color: Negro
👕 Talla Ropa: XL, S, M, L
✅ Conjunto de chaqueta y pantaloneta casual, perfecto para looks deportivos y comodidad en el día a día.

2.  *Chaqueta Hombre Urbano*
💵 Precio: $425.950
👕 Talla Ropa: M, S, L
🌈 Color: Blanco/Blanco/Negro
✅ Chaqueta urbana ligera y moderna, ideal para estilo streetwear y uso diario.

¿Cuál de estos productos te gusta? 🤔`;
      const expected = [
        `¡Mira estas opciones de chaquetas para hombre! 👀`,
        `*Conjunto Chaqueta y Pantaloneta - Hombre Urbano*
💵 Precio: $554.950
🌈 Color: Negro
👕 Talla Ropa: XL, S, M, L
✅ Conjunto de chaqueta y pantaloneta casual, perfecto para looks deportivos y comodidad en el día a día.`,
        `*Chaqueta Hombre Urbano*
💵 Precio: $425.950
👕 Talla Ropa: M, S, L
🌈 Color: Blanco/Blanco/Negro
✅ Chaqueta urbana ligera y moderna, ideal para estilo streetwear y uso diario.`,
        `¿Cuál de estos productos te gusta? 🤔`,
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('Test 18: Inline product card lists should be normalized with line breaks', () => {
      // Explanation: When product cards are inline (no line breaks between items),
      // they should be normalized by adding line breaks before each numbered item
      const input = `¡Encontré estas opciones de chaquetas para hombre! **1. 🛍️  Conjunto Chaqueta y Pantaloneta - Hombre Urbano** 💵 **Precio:** $554.950 🌈 **Color:** Negro. 👕 **Talla Ropa:** XL, S, M, L. ✅ Conjunto completo de chaqueta y pantaloneta, ideal para estilo athleisure y comodidad diaria. **2. 🛍️  Chaqueta Hombre Urbano** 💵 **Precio:** $425.950 👕 **Talla Ropa:** M, S, L. 🌈 **Color:** Blanco/Blanco/Negro. ✅ Chaqueta urbana ligera y moderna, perfecta para looks casuales y streetwear. ¿Cuál de estos productos te gusta?`;
      const expected = [
        `¡Encontré estas opciones de chaquetas para hombre!`,
        `**🛍️  Conjunto Chaqueta y Pantaloneta - Hombre Urbano**
💵 **Precio:** $554.950
🌈 **Color:** Negro.
👕 **Talla Ropa:** XL, S, M, L.
✅ Conjunto completo de chaqueta y pantaloneta, ideal para estilo athleisure y comodidad diaria.`,
        `**🛍️  Chaqueta Hombre Urbano**
💵 **Precio:** $425.950
👕 **Talla Ropa:** M, S, L.
🌈 **Color:** Blanco/Blanco/Negro.
✅ Chaqueta urbana ligera y moderna, perfecta para looks casuales y streetwear.`,
        `¿Cuál de estos productos te gusta?`,
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('Test 19: Single inline product card with trailing question should separate question', () => {
      // Explanation: When a single inline product card has a trailing question,
      // it should be split into: intro, product card, question
      const input = `¡Buenos días, un gusto tenerte en Nike! Mi nombre es Valentina. ¿Cuál es tu nombre? 🤟🏼 Sí, tenemos disponibles las Zapatillas Nike P‑6000 en blanco. La versión en blanco y negro no está en stock, pero esta es muy similar. Te presento una opción: **1. 🛍️ Zapatillas Mujer P‑6000** 💵 **Precio:** $659.000 🌈 **Color:** Blanco, Azul. 👟 **Talla Calzado:** 38, 39, 40, 41, 42, 43. ✅ Estas zapatillas retro estilo P‑6000 combinan mesh y cuero sintético en un diseño vintage que se adapta a looks casuales y urbanos. ¿Te gusta así? 😎`;
      const expected = [
        `¡Buenos días, un gusto tenerte en Nike! Mi nombre es Valentina. ¿Cuál es tu nombre? 🤟🏼 Sí, tenemos disponibles las Zapatillas Nike P‑6000 en blanco. La versión en blanco y negro no está en stock, pero esta es muy similar. Te presento una opción:`,
        `**🛍️ Zapatillas Mujer P‑6000**
💵 **Precio:** $659.000
🌈 **Color:** Blanco, Azul.
👟 **Talla Calzado:** 38, 39, 40, 41, 42, 43.
✅ Estas zapatillas retro estilo P‑6000 combinan mesh y cuero sintético en un diseño vintage que se adapta a looks casuales y urbanos.`,
        `¿Te gusta así? 😎`,
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('Test 20: Order confirmation messages should split at blank lines', () => {
      // Explanation: Order details should stay together, closing message separated by blank line
      const input = `Tu orden fue creada exitosamente.
*✅ ID de la orden:* 161d
*🛍️ Productos:* 1 Zapatillas Air Max 90
*💵 Total:* $759.950
*📍 Dirección:* Carrera 20 a # 56 - 77, Apartamento 500, Bogotá, D.C., Bogotá, D.C.

En los próximos días estará llegando tu pedido.
Muchas gracias por tu compra.`;
      const expected = [
        `Tu orden fue creada exitosamente.
*✅ ID de la orden:* 161d
*🛍️ Productos:* 1 Zapatillas Air Max 90
*💵 Total:* $759.950
*📍 Dirección:* Carrera 20 a # 56 - 77, Apartamento 500, Bogotá, D.C., Bogotá, D.C.`,
        `En los próximos días estará llegando tu pedido.
Muchas gracias por tu compra.`,
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('Test 21: Intro with emoji before numbered list should split correctly', () => {
      // Explanation: When an emoji appears between the colon and the numbered list,
      // it should be included with the intro, not with the list
      const input = `Para procesar tu pedido me faltan algunos datos: 😎 1. Nombre completo 2. Email 3. Cédula 4. Dirección completa (dirección exacta con barrio y si aplican detalles del apartamento/torre/conjunto) 🚀`;
      const expected = [
        `Para procesar tu pedido me faltan algunos datos: 😎`,
        `1. Nombre completo
2. Email
3. Cédula
4. Dirección completa (dirección exacta con barrio y si aplican detalles del apartamento/torre/conjunto) 🚀`,
      ];
      expect(splitChatText(input)).toEqual(expected);
    });

    test('Test 22: Inline numbered list after question mark should add line breaks between items', () => {
      // Explanation: When a numbered list comes after a question mark (not a colon),
      // it should still be normalized by adding line breaks between items
      const input = `Mira que encontré varias ciudades llamadas Cartagena. ¿Cuál es la tuya, Camila? 😎 1. Cartagena de Indias, Bolívar 2. Cartagena del Chairá, Caquetá 🏝`;
      const expected = [
        `Mira que encontré varias ciudades llamadas Cartagena. ¿Cuál es la tuya, Camila? 😎
1. Cartagena de Indias, Bolívar
2. Cartagena del Chairá, Caquetá 🏝`,
      ];
      expect(splitChatText(input)).toEqual(expected);
    });
  });

  describe('Spanish punctuation normalization', () => {
    test('should lowercase letter after ¿ when mid-sentence', () => {
      const input = 'Hola, me alegra poder ayudarte ¿Cómo estás hoy? Espero que muy bien ¿Qué necesitas?';
      const result = splitChatText(input);

      // The ¿ in the middle of text should have lowercase after it
      const hasCorrectPunctuation = result.some((chunk) => chunk.includes('¿cómo estás'));
      expect(hasCorrectPunctuation).toBe(true);

      const hasCorrectSecondPunctuation = result.some((chunk) => chunk.includes('¿qué necesitas'));
      expect(hasCorrectSecondPunctuation).toBe(true);
    });

    test('should keep uppercase after ¿ when starting sentence or after period', () => {
      const input = '¿Cómo estás? Bien gracias. ¿Qué tal tu día?';
      const result = splitChatText(input);

      // At start of string, should keep uppercase
      const startsCorrectly = result.some((chunk) => chunk.startsWith('¿Cómo estás'));
      expect(startsCorrectly).toBe(true);

      // After period, should keep uppercase
      const afterPeriodCorrect = result.some((chunk) => chunk.includes('. ¿Qué tal'));
      expect(afterPeriodCorrect).toBe(true);
    });

    test('should lowercase letter after ¡ when mid-sentence', () => {
      const input =
        'Te cuento que tenemos una oferta ¡Descuento del 50%! Y además ¡Envío gratis! No te lo pierdas.';
      const result = splitChatText(input);

      // The ¡ in the middle of text should have lowercase after it
      const hasCorrectPunctuation = result.some((chunk) => chunk.includes('¡descuento del 50%'));
      expect(hasCorrectPunctuation).toBe(true);

      const hasCorrectSecondPunctuation = result.some((chunk) => chunk.includes('¡envío gratis'));
      expect(hasCorrectSecondPunctuation).toBe(true);
    });

    test('should keep uppercase after ¡ when starting sentence or after period', () => {
      const input = '¡Hola! Bienvenido. ¡Qué bueno verte!';
      const result = splitChatText(input);

      // At start of string, should keep uppercase
      const startsCorrectly = result.some((chunk) => chunk.startsWith('¡Hola'));
      expect(startsCorrectly).toBe(true);

      // After period, should keep uppercase
      const afterPeriodCorrect = result.some((chunk) => chunk.includes('. ¡Qué bueno'));
      expect(afterPeriodCorrect).toBe(true);
    });

    test('should not affect non-letters after ¿ or ¡', () => {
      const input = 'Mira esto ¿😀 Te gusta? También tenemos ¡123 productos disponibles!';
      const result = splitChatText(input);

      // Emojis and numbers should not be changed
      const hasEmoji = result.some((chunk) => chunk.includes('¿😀'));
      expect(hasEmoji).toBe(true);

      const hasNumber = result.some((chunk) => chunk.includes('¡123'));
      expect(hasNumber).toBe(true);
    });

    test('should keep uppercase after ¿ when there is a line break before it', () => {
      const input = 'Aquí tienes la información.\n¿Cómo te puedo ayudar?';
      const result = splitChatText(input);

      // After line break, should keep uppercase
      const hasCorrectFormat = result.some((chunk) => chunk.includes('¿Cómo te puedo'));
      expect(hasCorrectFormat).toBe(true);
    });

    test('should normalize both ¿ and ¡ in the same text', () => {
      const input =
        'Hola amigo, te cuento algo ¡Tenemos ofertas increíbles! Y además ¿Sabías que hay envío gratis? Es genial. ¿Quieres ver más?';
      const result = splitChatText(input);

      // Mid-sentence ¡ should be lowercase
      const hasCorrectExclamation = result.some((chunk) => chunk.includes('¡tenemos ofertas'));
      expect(hasCorrectExclamation).toBe(true);

      // Mid-sentence ¿ should be lowercase
      const hasCorrectQuestion = result.some((chunk) => chunk.includes('¿sabías que'));
      expect(hasCorrectQuestion).toBe(true);

      // After period ¿ should stay uppercase
      const afterPeriodCorrect = result.some((chunk) => chunk.includes('. ¿Quieres ver'));
      expect(afterPeriodCorrect).toBe(true);
    });
  });

  describe('Parentheses protection', () => {
    test('should not split text in a way that breaks parentheses', () => {
      const input = `David, hay algunos datos que no están completos o son ambiguos: el email parece incompleto (debe ser algo como david@ku.com) 📧, la cédula '123' es inválida (necesita ser un número real de cédula) 📄, y la dirección 'Av 5 rockefeller' no es clara (¿puedes especificar la avenida completa y el número?). El barrio 'Catallo' está bien. Por favor, envíame la información corregida.`;
      const result = splitChatText(input);

      // The parentheses should never be broken across chunks
      // Each chunk should have balanced parentheses
      result.forEach((chunk) => {
        const openCount = (chunk.match(/\(/g) || []).length;
        const closeCount = (chunk.match(/\)/g) || []).length;
        expect(openCount).toBe(closeCount);
      });

      // Additionally, verify that we don't have a chunk that starts with ")."
      const hasBrokenParenthesis = result.some((chunk) => chunk.trim().startsWith(').'));
      expect(hasBrokenParenthesis).toBe(false);
    });

    test('should keep parenthetical expressions together when splitting', () => {
      const input =
        'Este producto tiene características especiales (alta calidad, durabilidad y diseño moderno). También incluye garantía extendida de 2 años. Por favor, revisa los detalles.';
      const result = splitChatText(input);

      // Parentheses should be balanced in each chunk
      result.forEach((chunk) => {
        const openCount = (chunk.match(/\(/g) || []).length;
        const closeCount = (chunk.match(/\)/g) || []).length;
        expect(openCount).toBe(closeCount);
      });
    });

    test('should not break nested parentheses', () => {
      const input =
        'La información requerida es la siguiente: nombre completo (tal como aparece en tu documento (cédula o pasaporte)). Además necesitamos tu dirección completa.';
      const result = splitChatText(input);

      // Each chunk should have balanced parentheses
      result.forEach((chunk) => {
        const openCount = (chunk.match(/\(/g) || []).length;
        const closeCount = (chunk.match(/\)/g) || []).length;
        expect(openCount).toBe(closeCount);
      });
    });
  });
});
