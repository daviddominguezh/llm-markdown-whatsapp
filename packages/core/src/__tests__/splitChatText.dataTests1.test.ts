import { describe, expect, test } from '@jest/globals';

import { splitChatText } from '../index.js';

describe('Data tests - numbered list normalization', () => {
  test('Test 1: Numbered lists should not split at periods', () => {
    const input = `📋 Para procesar tu pedido necesito algunos datos: 1. Nombre completo 2. Email 3. Cédula 4. Dirección completa (dirección exacta con barrio y si aplican detalles del apartamento/torre/conjunto).`;
    const expected = [
      `📋 Para procesar tu pedido necesito algunos datos:`,
      `1. Nombre completo\n2. Email\n3. Cédula\n4. Dirección completa (dirección exacta con barrio y si aplican detalles del apartamento/torre/conjunto).`,
    ];
    expect(splitChatText(input)).toEqual(expected);
  });

  test('Test 2: Bullet lists should not split within items', () => {
    const input = `Encontré estas opciones:\n\n- Nike Pegasus Plus – Zapatillas de alto rendimiento para maratones y running, con amortiguación ZoomX Foam y parte superior Flyknit que se adapta al pie. Disponibles en negro y en una combinación multicolor.\n- Nike Air Max 90 – Modelo clásico con suela tipo waffle y la icónica amortiguación Air visible, en tonos neutros como hueso claro/oliva/gris universitario.\n- Tenis de skateboarding – Zapatillas diseñadas para skate con suela vulcanizada y Zoom Air, disponibles en blanco con varios materiales (cuero, gamuza, algodón) y también en negro.\n¿Cuál de estos modelos te interesa más? 😊`;
    const expected = [
      `Encontré estas opciones:`,
      `- Nike Pegasus Plus – Zapatillas de alto rendimiento para maratones y running, con amortiguación ZoomX Foam y parte superior Flyknit que se adapta al pie. Disponibles en negro y en una combinación multicolor.`,
      `- Nike Air Max 90 – Modelo clásico con suela tipo waffle y la icónica amortiguación Air visible, en tonos neutros como hueso claro/oliva/gris universitario.`,
      `- Tenis de skateboarding – Zapatillas diseñadas para skate con suela vulcanizada y Zoom Air, disponibles en blanco con varios materiales (cuero, gamuza, algodón) y también en negro.`,
      `¿Cuál de estos modelos te interesa más? 😊`,
    ];
    expect(splitChatText(input)).toEqual(expected);
  });
});

describe('Data tests - bullet list integrity', () => {
  test('Test 3: Bullet lists should keep each item intact', () => {
    const input = `Encontré estas opciones:\n\n- Tenis de skateboarding: Zapatillas diseñadas para skateboarding con suela vulcanizada, amortiguación Zoom Air y una parte superior rediseñada para un mejor ajuste y comodidad. Disponibles en varios colores y materiales como cuero, gamuza, lona y algodón. 👟\n- Nike Pegasus Plus: Zapatillas de alto rendimiento para running con espuma ZoomX Foam de largo completo, parte superior Flyknit transpirable y suela de goma resistente para tracción. Ideales para maratones y entrenamientos diarios. 🏃‍♂️\n- Nike Air Max 90: Calzado clásico de running con suela tipo waffle y amortiguación Air visible. Ofrece ventilación y comodidad con un diseño icónico y materiales de alta calidad. 👟\n- Nike Dunk Low Retro: Modelo clásico con parte superior de cuero auténtico y sintético, entresuela de espuma ligera y suela de goma con punto de pivote. Disponible en combinaciones de colores.`;
    const expected = [
      `Encontré estas opciones:`,
      `- Tenis de skateboarding: Zapatillas diseñadas para skateboarding con suela vulcanizada, amortiguación Zoom Air y una parte superior rediseñada para un mejor ajuste y comodidad. Disponibles en varios colores y materiales como cuero, gamuza, lona y algodón. 👟`,
      `- Nike Pegasus Plus: Zapatillas de alto rendimiento para running con espuma ZoomX Foam de largo completo, parte superior Flyknit transpirable y suela de goma resistente para tracción. Ideales para maratones y entrenamientos diarios. 🏃‍♂️`,
      `- Nike Air Max 90: Calzado clásico de running con suela tipo waffle y amortiguación Air visible. Ofrece ventilación y comodidad con un diseño icónico y materiales de alta calidad. 👟`,
      `- Nike Dunk Low Retro: Modelo clásico con parte superior de cuero auténtico y sintético, entresuela de espuma ligera y suela de goma con punto de pivote. Disponible en combinaciones de colores.`,
    ];
    expect(splitChatText(input)).toEqual(expected);
  });
});

describe('Data tests - emoji and product descriptions', () => {
  test('Test 4: emoji with question splitting', () => {
    const input = `Lamentablemente, el Nike Pegasus Plus no está disponible en algodón. Sin embargo, tenemos tenis de skateboarding en algodón (color blanco) y otras opciones en este material. 😊 ¿Te gustaría continuar con alguna de estas alternativas o buscar otro producto?`;
    const expected = [
      'Lamentablemente, el Nike Pegasus Plus no está disponible en algodón.',
      'Sin embargo, tenemos tenis de skateboarding en algodón (color blanco) y otras opciones en este material.',
      '😊 ¿Te gustaría continuar con alguna de estas alternativas o buscar otro producto?',
    ];
    expect(splitChatText(input)).toEqual(expected);
  });

  test('Test 5: product description with question', () => {
    const input = `Encontré esta opción: Tenis de skateboarding (Algodón, Color: Blanco) – Zapatillas diseñadas para skateboarding con suela vulcanizada, amortiguación Zoom Air y una parte superior rediseñada para un mejor ajuste y comodidad. 👍 ¿Te gusta el producto Tenis de skateboarding?`;
    const expected = [
      'Encontré esta opción: Tenis de skateboarding (Algodón, Color: Blanco) – Zapatillas diseñadas para skateboarding con suela vulcanizada, amortiguación Zoom Air y una parte superior rediseñada para un mejor ajuste y comodidad.',
      '👍 ¿Te gusta el producto Tenis de skateboarding?',
    ];
    expect(splitChatText(input)).toEqual(expected);
  });
});

describe('Data tests - small chunk merging', () => {
  test('Test 6: Small chunks should merge with next chunk', () => {
    const input = `Mónica, ¿qué te parece la Nike Pegasus Plus? 👟 Precio: $1.015.000. Tall. 38, 41, 43. Colores: Negro, Azul/Espuma/Verde/Negro. Amortiguación ligera y transpirable. ¿Te gusta?`;
    const expected = [
      'Mónica, ¿qué te parece la Nike Pegasus Plus? 👟 Precio: $1.015.000.',
      'Tall. 38, 41, 43. Colores: Negro, Azul/Espuma/Verde/Negro. Amortiguación ligera y transpirable. ¿Te gusta?',
    ];
    expect(splitChatText(input)).toEqual(expected);
  });

  test('Test 8: Small chunks with price should merge with next chunk', () => {
    const input = `Nike Air Max 90 – $724.950. Tallas: 40‑43. Colores: Blanco, Gris, Rojo, Hueso, Oliva, Cueva. Suela waffle y Air visible. ¿Qué talla? 👟`;
    const expected = [
      `Nike Air Max 90 – $724.950.`,
      `Tallas: 40‑43. Colores: Blanco, Gris, Rojo, Hueso, Oliva, Cueva. Suela waffle y Air visible. ¿Qué talla? 👟`,
    ];
    expect(splitChatText(input)).toEqual(expected);
  });

  test('Test 11: Small chunks with tallas should merge', () => {
    const input = `Kiara, Nike Dunk Low Retro: $724.950. Tallas 39-43. Colores: Burdeos/Vinotinto, Azul, Oliva neutro/Caqui claro, Blanco/Blanco/Negro. Diseño icónico. Gusta o quieres otro color? 👟✨`;
    const expected = [
      `Kiara, Nike Dunk Low Retro: $724.950.`,
      `Tallas 39-43. Colores: Burdeos/Vinotinto, Azul, Oliva neutro/Caqui claro, Blanco/Blanco/Negro. Diseño icónico. Gusta o quieres otro color? 👟✨`,
    ];
    expect(splitChatText(input)).toEqual(expected);
  });
});

describe('Data tests - numbered list item splitting', () => {
  test('Test 7: Numbered lists should not split items', () => {
    const input = `Encontré dos opciones geniales para correr, Sebastián 👟:\n1. Nike Air Max 90 – $724.950, tallas 40-43. Colores variados, suela waffle.\n2. Nike Pegasus Plus – $1.015.000, tallas 38, 41, 43. Negro, azul y verde. ¿Cuál te gusta más?`;
    const expected = [
      `Encontré dos opciones geniales para correr, Sebastián 👟:`,
      `1. Nike Air Max 90 – $724.950, tallas 40-43. Colores variados, suela waffle.`,
      `2. Nike Pegasus Plus – $1.015.000, tallas 38, 41, 43. Negro, azul y verde. ¿Cuál te gusta más?`,
    ];
    expect(splitChatText(input)).toEqual(expected);
  });

  test('Test 9: Long list items (> 150 chars) should split by items', () => {
    const input = `Encontré estas opciones:\nNike Trail – Chaqueta de running impermeable con acabado repelente al agua, ajuste holgado y tonos tierra. Disponible en color multicolor y tallas XS, S, M. Es ideal para correr en el bosque o en la montaña y mantenerse seco. 🏃‍♂️\nNike Sportswear Breaking Windrunner – Chaqueta amplia con acabado repelente al agua en color negro, con gráficos de átomos giratorios. Disponible en tallas XS, S, M. Perfecta para actividades urbanas o al aire libre, manteniendo la comodidad y la protección contra la lluvia. ☔\n\n¿Cuál de estas chaquetas te interesa más?`;
    const expected = [
      `Encontré estas opciones:`,
      `Nike Trail – Chaqueta de running impermeable con acabado repelente al agua, ajuste holgado y tonos tierra. Disponible en color multicolor y tallas XS, S, M. Es ideal para correr en el bosque o en la montaña y mantenerse seco. 🏃‍♂️`,
      `Nike Sportswear Breaking Windrunner – Chaqueta amplia con acabado repelente al agua en color negro, con gráficos de átomos giratorios. Disponible en tallas XS, S, M. Perfecta para actividades urbanas o al aire libre, manteniendo la comodidad y la protección contra la lluvia. ☔`,
      `¿Cuál de estas chaquetas te interesa más?`,
    ];
    expect(splitChatText(input)).toEqual(expected);
  });
});

describe('Data tests - long product list and emoji merge', () => {
  test('Test 10: Long product list with bullet items', () => {
    const input = `¡Perfecto, Leydi! Encontré varias opciones de zapatos deportivos que podrían interesarte. Aquí te detallo algunas:\n\n- Tenis de skateboarding Janoski por 430.000: Son ideales para un estilo casual y dinámico, con excelente agarre para actividades como el skate o uso diario, ofreciendo comodidad y flexibilidad gracias a su diseño vulcanizado y amortiguación Zoom Air.\n\n- Nike Pegasus Plus por 1.015.000: Perfectos para running y entrenamientos intensos, con espuma ZoomX para un retorno de energía superior y una parte superior Flyknit transpirable que se adapta perfectamente al pie.\n\n- Nike Air Max 90 por 724.950: Un clásico con amortiguación Air visible para comodidad todo el día, suela waffle para tracción y un diseño versátil que combina estilo retro con rendimiento en running o uso casual.\n\n- Nike Air Force 1 por 749.950: Icónicos y duraderos, con cuero premium y amortiguación Nike Air para un confort excepcional, ideales para la calle o la cancha con un toque atemporal.\n\n¿Cuál de estos te gusta más, o prefieres que busque algo específico como color o talla?`;
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

  test('Test 12: Small emoji-only chunks should merge backward', () => {
    const input = `¡Perfecto! ✅❤️\n\nDe las dos opciones, la *Nike Trail* es ideal si buscas algo ligero y con ajuste holgado para terrenos complicados, mientras que la *Nike Sportswear Breaking Windrunner* te ofrece un tejido más absorbente y un diseño más clásico en negro.\n\n¿Te inclinas por alguna de ellas?\n\nY, si ya sabes la talla, dime cuál prefieres para que pueda confirmar disponibilidad y enviarte los detalles de envío. 🚚💨`;
    const expected = [
      `¡Perfecto! ✅❤️\n\nDe las dos opciones, la *Nike Trail* es ideal si buscas algo ligero y con ajuste holgado para terrenos complicados, mientras que la *Nike Sportswear Breaking Windrunner* te ofrece un tejido más absorbente y un diseño más clásico en negro.\n\n¿Te inclinas por alguna de ellas?`,
      `Y, si ya sabes la talla, dime cuál prefieres para que pueda confirmar disponibilidad y enviarte los detalles de envío. 🚚💨`,
    ];
    expect(splitChatText(input)).toEqual(expected);
  });
});
