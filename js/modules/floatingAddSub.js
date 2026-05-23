// Suma y resta en punto flotante
window.AC = window.AC || {};

window.AC.FloatAddSub = (function () {

  function compute(val1, val2, op, config, modes) {
    const FR = window.AC.FloatRepr;
    const steps = [];
    const { expBits, mantBits } = config;
    const maxBias = Math.pow(2, expBits - 1) - 1;
    const usedBias = (config.bias !== undefined && config.bias !== '') ? parseInt(config.bias) : maxBias;

    const mode1 = (modes && modes.mode1) || 'dec';
    const mode2 = (modes && modes.mode2) || 'dec';
    const opSymbol = op === 'sub' ? '−' : '+';

    function negateBinStr(s) {
      const t = (s || '').trim();
      return t.startsWith('-') ? t.slice(1) : '-' + t;
    }

    function convertOp(val, mode, negate) {
      if (mode === 'dec') {
        const v = parseFloat((val || '').replace(',', '.'));
        if (isNaN(v)) return { valid: false, error: `"${val}" no es un número decimal válido.` };
        return FR.decToFloat((negate ? -v : v).toString(), config);
      }
      if (mode === 'ieee754bin') {
        const parts = (val || '').trim().split('-');
        if (parts.length !== 3)
          return { valid: false, error: 'Formato IEEE 754 inválido. Use: S-Exponente-Mantisa  (ej: 0-01111111-10000000000000000000000)' };
        const [signBit, expPart, mantPart] = parts;
        if (!/^[01]$/.test(signBit))
          return { valid: false, error: 'El bit de signo debe ser 0 o 1.' };
        if (!/^[01]+$/.test(expPart) || expPart.length !== expBits)
          return { valid: false, error: `El exponente debe tener exactamente ${expBits} bits para este formato.` };
        if (!/^[01]+$/.test(mantPart) || mantPart.length !== mantBits)
          return { valid: false, error: `La mantisa debe tener exactamente ${mantBits} bits para este formato.` };
        const effectiveSign = negate ? (signBit === '0' ? '1' : '0') : signBit;
        return { valid: true, result: effectiveSign + expPart + mantPart };
      }
      return FR.binToFloat(negate ? negateBinStr(val) : val, config);
    }

    const r1 = convertOp(val1, mode1, false);
    const r2 = convertOp(val2, mode2, op === 'sub');
    if (!r1.valid) return { valid: false, error: r1.error, steps: [] };
    if (!r2.valid) return { valid: false, error: r2.error, steps: [] };

    const bin1 = r1.result;
    const bin2 = r2.result;

    const sfx = { dec: '', binpoint: '₂', binsci: '₂', ieee754bin: '' };
    const disp1    = val1 + (sfx[mode1] || '');
    const disp2raw = val2 + (sfx[mode2] || '');
    const disp2    = op === 'sub' ? `−(${disp2raw})` : disp2raw;

    // Extraer campos
    function extractFields(bin) {
      const s = parseInt(bin[0]);
      const e = parseInt(bin.slice(1, 1 + expBits), 2);
      const m = bin.slice(1 + expBits);
      return { sign: s, expBiased: e, expReal: e - usedBias, mantBin: m };
    }

    const f1 = extractFields(bin1);
    const f2 = extractFields(bin2);
    const expBin1 = f1.expBiased.toString(2).padStart(expBits, '0');
    const expBin2 = f2.expBiased.toString(2).padStart(expBits, '0');

    // Calcular alineación (necesario para los pasos)
    const expDiff    = f1.expReal - f2.expReal;
    const alignedExp = Math.max(f1.expReal, f2.expReal);
    const rawMant1   = '1' + f1.mantBin;
    const rawMant2   = '1' + f2.mantBin;

    let m1 = rawMant1;
    let m2 = rawMant2;
    let lostBits = '';
    if (expDiff > 0) {
      lostBits = m2.slice(Math.max(0, m2.length - expDiff));
      m2 = '0'.repeat(expDiff) + m2.slice(0, Math.max(0, m2.length - expDiff));
    } else if (expDiff < 0) {
      const sh = -expDiff;
      lostBits = m1.slice(Math.max(0, m1.length - sh));
      m1 = '0'.repeat(sh) + m1.slice(0, Math.max(0, m1.length - sh));
    }

    // Ayuda: representación con punto binario
    function withDot(bits) { return bits[0] + '.' + bits.slice(1); }

    // ── Paso 1: Representar y descomponer ──────────────────────────
    steps.push({
      stepNumber: 1,
      title: 'Representar y descomponer',
      registers: {},
      operation:
        `Op. 1: ${disp1}  →  ${bin1}\n` +
        `  Signo:     ${f1.sign}\n` +
        `  Exponente: ${expBin1}₂ = ${f1.expBiased}  →  exp real = ${f1.expBiased} − ${usedBias} = ${f1.expReal}\n` +
        `  Mantisa:   ${f1.mantBin}\n\n` +
        `Op. 2: ${disp2}  →  ${bin2}\n` +
        `  Signo:     ${f2.sign}\n` +
        `  Exponente: ${expBin2}₂ = ${f2.expBiased}  →  exp real = ${f2.expBiased} − ${usedBias} = ${f2.expReal}\n` +
        `  Mantisa:   ${f2.mantBin}`,
      explanation:
        `Descomponemos cada número en sus 3 campos:\n` +
        `• Signo (S): 1 bit — 0 = positivo, 1 = negativo\n` +
        `• Exponente (E): ${expBits} bits almacenados con sesgo ${usedBias}\n` +
        `  Exp real = E_biased − ${usedBias}\n` +
        `• Mantisa (M): ${mantBits} bits; el bit 1 inicial es implícito y no se almacena`,
      highlight: {}
    });

    // ── Paso 2: Comparar exponentes + mostrar desplazamiento ───────
    let step2Op =
      `Exp₁ = ${expBin1}₂ = ${f1.expBiased} − ${usedBias} = ${f1.expReal}\n` +
      `Exp₂ = ${expBin2}₂ = ${f2.expBiased} − ${usedBias} = ${f2.expReal}`;

    let step2Expl = `Exp₁ = ${f1.expReal}, Exp₂ = ${f2.expReal}. Diferencia = ${Math.abs(expDiff)}.`;

    if (expDiff !== 0) {
      const shift      = Math.abs(expDiff);
      const shiftName  = expDiff > 0 ? 'Op. 2' : 'Op. 1';
      const shiftMant  = expDiff > 0 ? rawMant2 : rawMant1;
      const shiftExp   = expDiff > 0 ? f2.expReal : f1.expReal;
      const afterBits  = ('0'.repeat(shift) + shiftMant).slice(0, mantBits + 1);

      step2Op +=
        `\n\nDiferencia = ${shift} → ${shiftName} desplaza ${shift} pos. a la derecha:\n` +
        `  Antes:   ${withDot(shiftMant)} × 2^${shiftExp}\n` +
        `  Después: ${withDot(afterBits)} × 2^${alignedExp}`;

      step2Expl +=
        `\n${shiftName} tiene el menor exponente y se desplaza ${shift} posición(es) a la ` +
        `derecha para igualar el exponente ${alignedExp}.` +
        (lostBits && lostBits.includes('1')
          ? `\n⚠ Al desplazar se pierden los bits "${lostBits}" → pérdida de precisión.`
          : '\nNo se pierden bits significativos.');
    } else {
      step2Expl += '\nExponentes iguales: no hace falta desplazamiento.';
    }

    steps.push({
      stepNumber: 2,
      title: 'Comparar exponentes',
      registers: {},
      operation: step2Op,
      explanation: step2Expl,
      highlight: {}
    });

    // ── Paso 3: Bit oculto y mantisas alineadas ────────────────────
    const shift3 = Math.abs(expDiff);

    function buildMantLine(rawMant, expR, isShifted) {
      let s = `  + bit 1 oculto  →  ${withDot(rawMant)} × 2^${expR}`;
      if (isShifted && shift3 > 0) {
        const afterBits = ('0'.repeat(shift3) + rawMant).slice(0, mantBits + 1);
        s += `\n  Desplazar ${shift3} bits a la derecha  →  ${withDot(afterBits)} × 2^${alignedExp}`;
      }
      return s;
    }

    const op1Shifted = expDiff < 0;
    const op2Shifted = expDiff > 0;

    const step3Op =
      `Op. 1: M = ${f1.mantBin}\n` +
      buildMantLine(rawMant1, f1.expReal, op1Shifted) + '\n' +
      `  Entero alineado: ${m1}\n\n` +
      `Op. 2: M = ${f2.mantBin}\n` +
      buildMantLine(rawMant2, f2.expReal, op2Shifted) + '\n' +
      `  Entero alineado: ${m2}`;

    const step3Expl =
      `El bit 1 implícito (hidden bit) se añade delante de la mantisa almacenada.\n` +
      `En IEEE 754 normalizado, la mantisa siempre tiene la forma 1.xxx, ` +
      `por lo que ese 1 inicial no se almacena (se ahorra un bit).\n\n` +
      (expDiff !== 0
        ? `El operando con menor exponente se desplaza ${shift3} bit(s) a la derecha ` +
          `para que ambas mantisas queden referidas al exponente ${alignedExp}.\n` +
          `Exponente del resultado: ${alignedExp}.`
        : `Exponentes iguales: no hay desplazamiento. Exponente del resultado: ${alignedExp}.`);

    steps.push({
      stepNumber: 3,
      title: 'Bit oculto y alineación',
      registers: {},
      operation: step3Op,
      explanation: step3Expl,
      highlight: {}
    });

    // ── Paso 4: Suma/resta de mantisas ────────────────────────────
    const m1Val    = f1.sign === 1 ? -parseInt(m1, 2) : parseInt(m1, 2);
    const m2Val    = f2.sign === 1 ? -parseInt(m2, 2) : parseInt(m2, 2);
    const mantSum    = m1Val + m2Val;
    const mantSumAbs = Math.abs(mantSum);
    const resultSign = mantSum < 0 ? 1 : 0;
    const mantBits_count = mantBits + 1;
    const mantSumBin = mantSumAbs.toString(2).padStart(mantBits_count, '0');

    steps.push({
      stepNumber: 4,
      title: `${op === 'sub' ? 'Resta' : 'Suma'} de mantisas`,
      registers: {},
      operation:
        `${f1.sign ? '−' : ' '}${m1}\n` +
        `${f2.sign ? '−' : ' '}${m2}\n` +
        `${'─'.repeat(mantBits_count + 1)}\n` +
        `${mantSum < 0 ? '−' : ' '}${mantSumBin}`,
      explanation:
        `Sumamos con signo las mantisas alineadas.\n` +
        `Resultado: ${mantSum < 0 ? 'negativo ' : ''}${mantSumBin}₂.`,
      highlight: {}
    });

    // ── Paso 5: Normalizar ─────────────────────────────────────────
    let normMant = mantSumBin;
    let normExp  = alignedExp;

    if (mantSumAbs === 0) {
      steps.push({
        stepNumber: 5, title: 'Resultado: cero',
        registers: {},
        operation: 'Mantisa = 0 → resultado = 0',
        explanation: 'La suma de mantisas dio cero. El resultado es exactamente 0.',
        highlight: {}, isResult: true,
        result: { decimal: 0, binary: '0'.repeat(1 + expBits + mantBits) }
      });
      return { valid: true, steps };
    }

    const firstOne = normMant.indexOf('1');
    if (firstOne === -1) {
      normMant = '0'.repeat(mantBits); normExp = 0;
    } else if (firstOne > 0) {
      normExp  -= firstOne;
      normMant  = normMant.slice(firstOne);
    }
    if (normMant.length > mantBits_count) {
      normExp  += (normMant.length - mantBits_count);
      normMant  = normMant.slice(0, mantBits_count);
    }

    const mantFinal      = normMant.slice(1).padEnd(mantBits, '0').slice(0, mantBits);
    const biasedExpFinal = normExp + usedBias;
    const expBinFinal    = biasedExpFinal.toString(2).padStart(expBits, '0');
    const resultBin      = resultSign.toString() + expBinFinal + mantFinal;
    const realValue      = (resultSign ? -1 : 1) *
      (1 + parseInt(mantFinal, 2) / Math.pow(2, mantBits)) * Math.pow(2, normExp);

    steps.push({
      stepNumber: 5,
      title: 'Normalizar resultado',
      registers: {},
      operation:
        `${withDot(normMant)} × 2^${normExp}\n` +
        `Exp. con bias = ${normExp} + ${usedBias} = ${biasedExpFinal} = ${expBinFinal}₂\n` +
        `Mantisa (sin bit oculto): ${mantFinal}`,
      explanation:
        `Normalizamos para que la mantisa tenga la forma 1.xxx.\n` +
        `Exponente final: ${normExp} + sesgo ${usedBias} = ${biasedExpFinal} = ${expBinFinal}₂.\n` +
        `Mantisa almacenada (quitando el 1 implícito): ${mantFinal}.`,
      highlight: {}
    });

    // ── Paso 6: Resultado ─────────────────────────────────────────
    steps.push({
      stepNumber: 6,
      title: 'Resultado final',
      registers: {},
      operation:
        `[${resultSign}][${expBinFinal}][${mantFinal}]\n` +
        `= ${resultBin}`,
      explanation:
        `${disp1} ${opSymbol} ${disp2raw} ≈ ${realValue.toPrecision(6)}.\n` +
        `Representación: ${resultBin}.`,
      highlight: {},
      isResult: true,
      result: { decimal: realValue, binary: resultBin }
    });

    return { valid: true, steps };
  }

  return { compute };
})();
