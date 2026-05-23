// Multiplicación y división en punto flotante
window.AC = window.AC || {};

window.AC.FloatMulDiv = (function () {

  function compute(dec1, dec2, op, config) {
    const FR = window.AC.FloatRepr;
    const { expBits, mantBits } = config;
    const maxBias = Math.pow(2, expBits - 1) - 1;
    const usedBias = (config.bias !== undefined && config.bias !== '') ? parseInt(config.bias) : maxBias;
    const steps = [];

    const v1 = parseFloat(dec1), v2 = parseFloat(dec2);
    if (isNaN(v1) || isNaN(v2)) {
      return { valid: false, error: 'Los valores de entrada no son números válidos.', steps: [] };
    }
    if (op === 'div' && v2 === 0) {
      return { valid: false, error: 'División por cero.', steps: [] };
    }

    const r1 = FR.decToFloat(dec1.toString(), config);
    const r2 = FR.decToFloat(dec2.toString(), config);
    if (!r1.valid || !r2.valid) {
      return { valid: false, error: 'No se pueden representar los operandos.', steps: [] };
    }

    const bin1 = r1.result, bin2 = r2.result;
    const s1   = parseInt(bin1[0]);
    const s2   = parseInt(bin2[0]);
    const e1   = parseInt(bin1.slice(1, 1 + expBits), 2);
    const e2   = parseInt(bin2.slice(1, 1 + expBits), 2);
    const m1Bin = bin1.slice(1 + expBits);
    const m2Bin = bin2.slice(1 + expBits);

    const expBin1    = e1.toString(2).padStart(expBits, '0');
    const expBin2    = e2.toString(2).padStart(expBits, '0');
    const e1real     = e1 - usedBias;
    const e2real     = e2 - usedBias;
    const resultSign = s1 ^ s2;
    const opSymbol   = op === 'div' ? '÷' : '×';

    function withDot(bits) { return bits[0] + '.' + bits.slice(1); }

    // ── Paso 1: Representar y descomponer ──────────────────────────
    steps.push({
      stepNumber: 1,
      title: 'Representar y descomponer',
      registers: {},
      operation:
        `Op. 1: ${v1}  →  ${bin1}\n` +
        `  Signo:     ${s1}\n` +
        `  Exponente: ${expBin1}₂ = ${e1}  →  exp real = ${e1} − ${usedBias} = ${e1real}\n` +
        `  Mantisa:   ${m1Bin}\n\n` +
        `Op. 2: ${v2}  →  ${bin2}\n` +
        `  Signo:     ${s2}\n` +
        `  Exponente: ${expBin2}₂ = ${e2}  →  exp real = ${e2} − ${usedBias} = ${e2real}\n` +
        `  Mantisa:   ${m2Bin}`,
      explanation:
        `Descomponemos cada número en sus 3 campos:\n` +
        `• Signo (S): 1 bit — 0 = positivo, 1 = negativo\n` +
        `• Exponente (E): ${expBits} bits con sesgo ${usedBias}; exp real = E − ${usedBias}\n` +
        `• Mantisa (M): ${mantBits} bits; el bit 1 inicial es implícito, no se almacena`,
      highlight: {}
    });

    // ── Paso 2: Signo del resultado ────────────────────────────────
    steps.push({
      stepNumber: 2,
      title: 'Signo del resultado',
      registers: {},
      operation: `S₁ XOR S₂ = ${s1} XOR ${s2} = ${resultSign}`,
      explanation:
        `En ${op === 'div' ? 'división' : 'multiplicación'} en punto flotante el signo del ` +
        `resultado es el XOR de los signos de los operandos.\n` +
        `${resultSign === 0 ? 'Resultado positivo (0).' : 'Resultado negativo (1).'}`,
      highlight: {}
    });

    // ── Paso 3: Exponentes ─────────────────────────────────────────
    const resultExp = op === 'mul' ? e1real + e2real : e1real - e2real;
    const expOpLine = op === 'mul'
      ? `Exp = (E₁ − bias) + (E₂ − bias)\n` +
        `    = (${e1} − ${usedBias}) + (${e2} − ${usedBias})\n` +
        `    = ${e1real} + ${e2real} = ${resultExp}`
      : `Exp = (E₁ − bias) − (E₂ − bias)\n` +
        `    = (${e1} − ${usedBias}) − (${e2} − ${usedBias})\n` +
        `    = ${e1real} − ${e2real} = ${resultExp}`;

    steps.push({
      stepNumber: 3,
      title: op === 'mul' ? 'Sumar exponentes' : 'Restar exponentes',
      registers: {},
      operation: expOpLine,
      explanation:
        `Para la ${op === 'mul' ? 'multiplicación' : 'división'}, el exponente del resultado ` +
        `es la ${op === 'mul' ? 'suma' : 'resta'} de los exponentes reales.\n` +
        `Exp₁ real = ${e1real}, Exp₂ real = ${e2real} → Exp resultado = ${resultExp}.`,
      highlight: {}
    });

    // ── Paso 4: Mantisas (con bit oculto) ─────────────────────────
    const mant1 = 1 + parseInt(m1Bin, 2) / Math.pow(2, mantBits);
    const mant2 = 1 + parseInt(m2Bin, 2) / Math.pow(2, mantBits);
    const mantResult = op === 'mul' ? mant1 * mant2 : mant1 / mant2;

    const mant1bits = '1' + m1Bin;
    const mant2bits = '1' + m2Bin;

    steps.push({
      stepNumber: 4,
      title: `${op === 'mul' ? 'Multiplicar' : 'Dividir'} mantisas`,
      registers: {},
      operation:
        `Op. 1: M = ${m1Bin}\n` +
        `  + bit 1 oculto  →  ${withDot(mant1bits)}  = ${mant1.toFixed(6)}\n\n` +
        `Op. 2: M = ${m2Bin}\n` +
        `  + bit 1 oculto  →  ${withDot(mant2bits)}  = ${mant2.toFixed(6)}\n\n` +
        `${mant1.toFixed(6)} ${opSymbol} ${mant2.toFixed(6)} = ${mantResult.toFixed(6)}`,
      explanation:
        `Añadimos el bit 1 implícito a cada mantisa (forma 1.xxx).\n` +
        `${op === 'mul' ? 'Multiplicamos' : 'Dividimos'} los valores con punto flotante real:\n` +
        `${mant1.toFixed(6)} ${opSymbol} ${mant2.toFixed(6)} = ${mantResult.toFixed(6)}.`,
      highlight: {}
    });

    // ── Paso 5: Normalizar ─────────────────────────────────────────
    let normExp  = resultExp;
    let normMant = mantResult;
    if (normMant >= 2) {
      normMant /= 2; normExp += 1;
    } else if (normMant < 1 && normMant > 0) {
      while (normMant < 1) { normMant *= 2; normExp -= 1; }
    }

    const mantFracBits  = normMant - 1;
    const mantBinVal    = Math.round(mantFracBits * Math.pow(2, mantBits));
    const mantFinal     = mantBinVal.toString(2).padStart(mantBits, '0').slice(0, mantBits);
    const biasedExp     = normExp + usedBias;
    const expBinFinal   = biasedExp >= 0 ? biasedExp.toString(2).padStart(expBits, '0') : '0'.repeat(expBits);
    const resultBin     = resultSign.toString() + expBinFinal + mantFinal;

    steps.push({
      stepNumber: 5,
      title: 'Normalizar resultado',
      registers: {},
      operation:
        `1.${mantFinal} × 2^${normExp}\n` +
        `Exp. con bias = ${normExp} + ${usedBias} = ${biasedExp} = ${expBinFinal}₂\n` +
        `Mantisa (sin bit oculto): ${mantFinal}`,
      explanation:
        `Normalizamos la mantisa a la forma 1.xxx.\n` +
        `Exponente final: ${normExp} + sesgo ${usedBias} = ${biasedExp} = ${expBinFinal}₂.\n` +
        `Mantisa almacenada (quitando el 1 implícito): ${mantFinal}.`,
      highlight: {}
    });

    // ── Paso 6: Resultado final ────────────────────────────────────
    const realValue = (resultSign ? -1 : 1) *
      (1 + parseInt(mantFinal, 2) / Math.pow(2, mantBits)) * Math.pow(2, normExp);

    steps.push({
      stepNumber: 6,
      title: 'Resultado final',
      registers: {},
      operation:
        `[${resultSign}][${expBinFinal}][${mantFinal}]\n` +
        `= ${resultBin}`,
      explanation:
        `${v1} ${opSymbol} ${v2} ≈ ${realValue.toPrecision(6)}.\n` +
        `Representación: ${resultBin}.`,
      highlight: {},
      isResult: true,
      result: { decimal: realValue, binary: resultBin }
    });

    return { valid: true, steps };
  }

  return { compute };
})();
