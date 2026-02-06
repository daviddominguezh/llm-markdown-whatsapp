import { describe, expect, test } from '@jest/globals';

import { splitChatText } from '../index.js';

describe('Data tests - product cards with emoji pattern', () => {
  test('Test 13: Product card lists with shopping emoji should split into individual cards', () => {
    const input = `Encontré estas opciones:\n\n1. 🛍️  Zapatillas Pegasus Plus: 💵 $1.015.000\n📏 Color: Negro, Azul glacial/Espuma menta/Verde impacto/Negro.\n📏 Talla Calzado: 43, 41, 38.\n✅ Zapatillas Pegasus Plus: ultraligeras, con amortiguación ZoomX y gran transpirabilidad, diseñadas para running intensivo y maratones, ideal para tus entrenamientos de carrera.\n\n2. 🛍️  Zapaillas ISPA Sense: 💵 $804.900\n📏 Talla Calzado: 38, 39, 40, 41, 42, 43.\n✅ Zapaillas ISPA Sense: estilo casual con buena comodidad, pueden servir para trotes ligeros o uso diario, aunque no están optimizadas para alto rendimiento de running.\n\n¿Cuál de estos productos te gusta?`;
    const expected = [
      `Encontré estas opciones:`,
      `🛍️  Zapatillas Pegasus Plus: 💵 $1.015.000\n📏 Color: Negro, Azul glacial/Espuma menta/Verde impacto/Negro.\n📏 Talla Calzado: 43, 41, 38.\n✅ Zapatillas Pegasus Plus: ultraligeras, con amortiguación ZoomX y gran transpirabilidad, diseñadas para running intensivo y maratones, ideal para tus entrenamientos de carrera.`,
      `🛍️  Zapaillas ISPA Sense: 💵 $804.900\n📏 Talla Calzado: 38, 39, 40, 41, 42, 43.\n✅ Zapaillas ISPA Sense: estilo casual con buena comodidad, pueden servir para trotes ligeros o uso diario, aunque no están optimizadas para alto rendimiento de running.`,
      `¿Cuál de estos productos te gusta?`,
    ];
    expect(splitChatText(input)).toEqual(expected);
  });
});

describe('Data tests - product cards with bold formatting', () => {
  test('Test 14: Bold formatted product cards should split into individual cards', () => {
    const input = `Encontré estas opciones:\n\n**1. 🛍️ Tenis Skateboarding:** 💵 $430.000\n📏 **Color:** Blanco/Rosa óxido/Negro, Blanco, Negro.\n📏 **Talla Calzado:** 40, 38, 39, 41.\n📏 **Material:** Cuero, Gamuza, Lona, Algodon.\n✅ Este porque amas a Luisa\n\n**2. 🛍️ Zapatillas ISPA Axis:** 💵 $902.000\n📏 **Talla Calzado:** 38, 39, 40, 41, 42, 43.\n✅ Este por si acaso\n\n¿Cuál te gusta más?`;
    const expected = [
      `Encontré estas opciones:`,
      `**🛍️ Tenis Skateboarding:** 💵 $430.000\n📏 **Color:** Blanco/Rosa óxido/Negro, Blanco, Negro.\n📏 **Talla Calzado:** 40, 38, 39, 41.\n📏 **Material:** Cuero, Gamuza, Lona, Algodon.\n✅ Este porque amas a Luisa`,
      `**🛍️ Zapatillas ISPA Axis:** 💵 $902.000\n📏 **Talla Calzado:** 38, 39, 40, 41, 42, 43.\n✅ Este por si acaso`,
      `¿Cuál te gusta más?`,
    ];
    expect(splitChatText(input)).toEqual(expected);
  });
});

describe('Data tests - product cards with italic formatting', () => {
  test('Test 15: Italic formatted product cards should split into individual cards', () => {
    const input = `Encontré estas opciones:\n\n*1. 🛍️ Tenis Skateboarding:* 💵 $430.000\n📏 *Color:* Blanco/Rosa óxido/Negro, Blanco, Negro.\n📏 *Talla Calzado:* 40, 38, 39, 41.\n📏 *Material:* Cuero, Gamuza, Lona, Algodon.\n✅ Este porque amas a Luisa\n\n*2. 🛍️ Zapatillas ISPA Axis:* 💵 $902.000\n📏 *Talla Calzado:* 38, 39, 40, 41, 42, 43.\n✅ Este por si acaso\n\n¿Cuál te gusta más?`;
    const expected = [
      `Encontré estas opciones:`,
      `*🛍️ Tenis Skateboarding:* 💵 $430.000\n📏 *Color:* Blanco/Rosa óxido/Negro, Blanco, Negro.\n📏 *Talla Calzado:* 40, 38, 39, 41.\n📏 *Material:* Cuero, Gamuza, Lona, Algodon.\n✅ Este porque amas a Luisa`,
      `*🛍️ Zapatillas ISPA Axis:* 💵 $902.000\n📏 *Talla Calzado:* 38, 39, 40, 41, 42, 43.\n✅ Este por si acaso`,
      `¿Cuál te gusta más?`,
    ];
    expect(splitChatText(input)).toEqual(expected);
  });
});

describe('Data tests - product card trailing questions', () => {
  test('Test 16: Product card lists should separate trailing questions', () => {
    const input = `Encontré estas opciones:\n1. 🛍️ Zapatillas Pegasus Plus\n💵 Precio: $1.015.000\n🌈 Color: Negro, Azul glacial/Espuma menta/Verde impacto/Negro.\n👟 Talla Calzado: 43, 41, 38.\n✅ Zapatillas de alto rendimiento diseñadas para running, con amortiguación ZoomX Foam y Flyknit ligero, ideales para entrenamientos intensivos y maratones.\n\n2. 🛍️ Zapaillas ISPA Sense\n💵 Precio: $804.900\n👟 Talla Calzado: 38, 39, 40, 41, 42, 43.\n¿Cuál de estos productos te gusta?`;
    const expected = [
      `Encontré estas opciones:`,
      `🛍️ Zapatillas Pegasus Plus\n💵 Precio: $1.015.000\n🌈 Color: Negro, Azul glacial/Espuma menta/Verde impacto/Negro.\n👟 Talla Calzado: 43, 41, 38.\n✅ Zapatillas de alto rendimiento diseñadas para running, con amortiguación ZoomX Foam y Flyknit ligero, ideales para entrenamientos intensivos y maratones.`,
      `🛍️ Zapaillas ISPA Sense\n💵 Precio: $804.900\n👟 Talla Calzado: 38, 39, 40, 41, 42, 43.`,
      `¿Cuál de estos productos te gusta?`,
    ];
    expect(splitChatText(input)).toEqual(expected);
  });
});

const MARKDOWN_TITLES_INPUT = `¡Mira estas opciones de chaquetas para hombre! 👀

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

describe('Data tests - product cards with markdown titles', () => {
  test('Test 17: Markdown title product cards should split into individual cards', () => {
    const expected = [
      `¡Mira estas opciones de chaquetas para hombre! 👀`,
      `*Conjunto Chaqueta y Pantaloneta - Hombre Urbano*\n💵 Precio: $554.950\n🌈 Color: Negro\n👕 Talla Ropa: XL, S, M, L\n✅ Conjunto de chaqueta y pantaloneta casual, perfecto para looks deportivos y comodidad en el día a día.`,
      `*Chaqueta Hombre Urbano*\n💵 Precio: $425.950\n👕 Talla Ropa: M, S, L\n🌈 Color: Blanco/Blanco/Negro\n✅ Chaqueta urbana ligera y moderna, ideal para estilo streetwear y uso diario.`,
      `¿Cuál de estos productos te gusta? 🤔`,
    ];
    expect(splitChatText(MARKDOWN_TITLES_INPUT)).toEqual(expected);
  });
});

describe('Data tests - inline product cards', () => {
  test('Test 18: Inline product cards should be normalized with line breaks', () => {
    const input = `¡Encontré estas opciones de chaquetas para hombre! **1. 🛍️  Conjunto Chaqueta y Pantaloneta - Hombre Urbano** 💵 **Precio:** $554.950 🌈 **Color:** Negro. 👕 **Talla Ropa:** XL, S, M, L. ✅ Conjunto completo de chaqueta y pantaloneta, ideal para estilo athleisure y comodidad diaria. **2. 🛍️  Chaqueta Hombre Urbano** 💵 **Precio:** $425.950 👕 **Talla Ropa:** M, S, L. 🌈 **Color:** Blanco/Blanco/Negro. ✅ Chaqueta urbana ligera y moderna, perfecta para looks casuales y streetwear. ¿Cuál de estos productos te gusta?`;
    const expected = [
      `¡Encontré estas opciones de chaquetas para hombre!`,
      `**🛍️  Conjunto Chaqueta y Pantaloneta - Hombre Urbano**\n💵 **Precio:** $554.950\n🌈 **Color:** Negro.\n👕 **Talla Ropa:** XL, S, M, L.\n✅ Conjunto completo de chaqueta y pantaloneta, ideal para estilo athleisure y comodidad diaria.`,
      `**🛍️  Chaqueta Hombre Urbano**\n💵 **Precio:** $425.950\n👕 **Talla Ropa:** M, S, L.\n🌈 **Color:** Blanco/Blanco/Negro.\n✅ Chaqueta urbana ligera y moderna, perfecta para looks casuales y streetwear.`,
      `¿Cuál de estos productos te gusta?`,
    ];
    expect(splitChatText(input)).toEqual(expected);
  });

  test('Test 19: Single inline product card should separate question', () => {
    const input = `¡Buenos días, un gusto tenerte en Nike! Mi nombre es Valentina. ¿Cuál es tu nombre? 🤟🏼 Sí, tenemos disponibles las Zapatillas Nike P‑6000 en blanco. La versión en blanco y negro no está en stock, pero esta es muy similar. Te presento una opción: **1. 🛍️ Zapatillas Mujer P‑6000** 💵 **Precio:** $659.000 🌈 **Color:** Blanco, Azul. 👟 **Talla Calzado:** 38, 39, 40, 41, 42, 43. ✅ Estas zapatillas retro estilo P‑6000 combinan mesh y cuero sintético en un diseño vintage que se adapta a looks casuales y urbanos. ¿Te gusta así? 😎`;
    const expected = [
      `¡Buenos días, un gusto tenerte en Nike! Mi nombre es Valentina. ¿Cuál es tu nombre? 🤟🏼 Sí, tenemos disponibles las Zapatillas Nike P‑6000 en blanco. La versión en blanco y negro no está en stock, pero esta es muy similar. Te presento una opción:`,
      `**🛍️ Zapatillas Mujer P‑6000**\n💵 **Precio:** $659.000\n🌈 **Color:** Blanco, Azul.\n👟 **Talla Calzado:** 38, 39, 40, 41, 42, 43.\n✅ Estas zapatillas retro estilo P‑6000 combinan mesh y cuero sintético en un diseño vintage que se adapta a looks casuales y urbanos.`,
      `¿Te gusta así? 😎`,
    ];
    expect(splitChatText(input)).toEqual(expected);
  });
});

describe('Data tests - order confirmation and misc', () => {
  test('Test 20: Order confirmation messages should split at blank lines', () => {
    const input = `Tu orden fue creada exitosamente.\n*✅ ID de la orden:* 161d\n*🛍️ Productos:* 1 Zapatillas Air Max 90\n*💵 Total:* $759.950\n*📍 Dirección:* Carrera 20 a # 56 - 77, Apartamento 500, Bogotá, D.C., Bogotá, D.C.\n\nEn los próximos días estará llegando tu pedido.\nMuchas gracias por tu compra.`;
    const expected = [
      `Tu orden fue creada exitosamente.\n*✅ ID de la orden:* 161d\n*🛍️ Productos:* 1 Zapatillas Air Max 90\n*💵 Total:* $759.950\n*📍 Dirección:* Carrera 20 a # 56 - 77, Apartamento 500, Bogotá, D.C., Bogotá, D.C.`,
      `En los próximos días estará llegando tu pedido.\nMuchas gracias por tu compra.`,
    ];
    expect(splitChatText(input)).toEqual(expected);
  });

  test('Test 21: Intro with emoji before numbered list should split correctly', () => {
    const input = `Para procesar tu pedido me faltan algunos datos: 😎 1. Nombre completo 2. Email 3. Cédula 4. Dirección completa (dirección exacta con barrio y si aplican detalles del apartamento/torre/conjunto) 🚀`;
    const expected = [
      `Para procesar tu pedido me faltan algunos datos: 😎`,
      `1. Nombre completo\n2. Email\n3. Cédula\n4. Dirección completa (dirección exacta con barrio y si aplican detalles del apartamento/torre/conjunto) 🚀`,
    ];
    expect(splitChatText(input)).toEqual(expected);
  });

  test('Test 22: Inline numbered list after question mark should add line breaks', () => {
    const input = `Mira que encontré varias ciudades llamadas Cartagena. ¿Cuál es la tuya, Camila? 😎 1. Cartagena de Indias, Bolívar 2. Cartagena del Chairá, Caquetá 🏝`;
    const expected = [
      `Mira que encontré varias ciudades llamadas Cartagena. ¿Cuál es la tuya, Camila? 😎\n1. Cartagena de Indias, Bolívar\n2. Cartagena del Chairá, Caquetá 🏝`,
    ];
    expect(splitChatText(input)).toEqual(expected);
  });
});
