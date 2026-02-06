import { describe, expect, test } from '@jest/globals';

import { splitChatText } from '../index.js';

describe('URL protection - basic URL handling', () => {
  test('should not split URLs with periods', () => {
    const input =
      '¡Genial! Abre este link para terminar los detalles de tu pedido y ver el total: *https://console.usecloser.ai/personalizations/8e283bf8-90bb-4e8f-b562-9a2ea757cf5a*\n\n¡Gracias por tu compra! Si necesitas algo más, estoy aquí para ayudarte.';
    const expected = [
      '¡Genial! Abre este link para terminar los detalles de tu pedido y ver el total: *https://console.usecloser.ai/personalizations/8e283bf8-90bb-4e8f-b562-9a2ea757cf5a*',
      '¡Gracias por tu compra! Si necesitas algo más, estoy aquí para ayudarte.',
    ];
    expect(splitChatText(input)).toEqual(expected);
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

describe('URL protection - domain names', () => {
  test('should not split plain domain names like Nike.com.co', () => {
    const input =
      '¡Hola! Me llamo Antonia. Estoy a tu servicio en Nike 😊. No, actualmente no hacemos envíos a Bucaramanga (Santander). Si necesitas el producto, puedes comprarlo en línea (Nike.com.co) y luego elegir una opción de recogida en una tienda Nike cercana o solicitar el envío a una ciudad dentro de nuestra zona de cobertura. ¿Podrías decirme tu nombre para poder asistirte mejor? 😊';
    const result = splitChatText(input);
    const hasSplitDomain = result.some((chunk) => chunk.includes('Nike.') && !chunk.includes('Nike.com.co'));
    expect(hasSplitDomain).toBe(false);
    const hasDomainInFull = result.some((chunk) => chunk.includes('Nike.com.co'));
    expect(hasDomainInFull).toBe(true);
    const hasBrokenDomain = result.some((chunk) => chunk.trim() === 'com.' || chunk.trim().startsWith('co)'));
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
});

describe('URL protection - multiple domains', () => {
  test('should handle multiple plain domains in the same text', () => {
    const input =
      'Visita Nike.com.co para ver nuestro catálogo completo y Adidas.com.mx para comparar precios. También puedes revisar Puma.co.uk si buscas ofertas internacionales. ¿Te gustaría que te ayude con algo más?';
    const result = splitChatText(input);
    const allDomainsIntact =
      result.some((chunk) => chunk.includes('Nike.com.co')) &&
      result.some((chunk) => chunk.includes('Adidas.com.mx')) &&
      result.some((chunk) => chunk.includes('Puma.co.uk'));
    expect(allDomainsIntact).toBe(true);
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
});
