import { describe, expect, test } from '@jest/globals';

import { splitChatText } from '../index.js';

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
