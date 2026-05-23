// Representación en coma flotante — conversión decimal ↔ binario
window.AC = window.AC || {};

window.AC.FloatRepr = (function () {

  // Convierte entero a binario mostrando divisiones sucesivas
  function intDivSteps(n, padBits) {
    if (n === 0) return { bin: '0'.repeat(padBits || 1), lines: ['0 ÷ 2 = 0  R 0'], result: `0₁₀ ≅ ${'0'.repeat(padBits || 1)}₂` };
    const lines = [];
    let val = n;
    while (val > 0) {
      lines.push(`${String(val).padStart(5)}  ÷ 2 = ${String(Math.floor(val / 2)).padStart(4)}  R ${val % 2}`);
      val = Math.floor(val / 2);
    }
    const bin = padBits ? n.toString(2).padStart(padBits, '0') : n.toString(2);
    return { bin, lines, result: `${n}₁₀ ≅ ${bin}₂` };
  }

  // Convierte parte fraccionaria a binario mostrando cada ×2
  function fracMulSteps(frac, maxBits) {
    const lines = [];
    let val = frac;
    let bits = '';
    for (let i = 0; i < maxBits; i++) {
      if (val <= 0) break;
      const doubled = val * 2;
      const bit = Math.floor(doubled);
      val = doubled - bit;
      lines.push(`  ${(doubled / 2).toPrecision(6).replace(/\.?0+$/, '')}  × 2 = ${doubled.toPrecision(6).replace(/\.?0+$/, '')}  → bit = ${bit}`);
      bits += bit;
    }
    return { bits, lines, exact: val === 0 };
  }

  // config: { signBits:1, expBits, mantBits, bias }
  function decToFloat(decStr, config) {
    const steps = [];
    const decimal = parseFloat(decStr);
    if (isNaN(decimal)) return { valid: false, error: 'El número no es válido.', steps: [] };

    const { expBits, mantBits } = config;
    const maxBias = Math.pow(2, expBits - 1) - 1;
    const usedBias = (config.bias !== undefined && config.bias !== '') ? parseInt(config.bias) : maxBias;
    const sign = decimal < 0 ? 1 : 0;
    const absVal = Math.abs(decimal);

    // Helper: partial assembly notation
    const dot = '·';
    function asm(s, e, m) {
      return `[${s}] [${e}] [${m}]`;
    }
    const unknownExp  = dot.repeat(expBits);
    const unknownMant = dot.repeat(mantBits);

    // ── Paso 1: Signo ──────────────────────────────────────────────
    steps.push({
      stepNumber: 1,
      title: 'Determinar el bit de signo',
      registers: { Signo: sign.toString() },
      operation: `${decimal} es ${sign ? 'negativo' : 'positivo'} → S = ${sign}\n` +
        `► ${asm(sign, unknownExp, unknownMant)}`,
      explanation: `El bit de signo es 0 para números positivos y 1 para negativos. ` +
        `Como ${decimal} es ${sign ? 'negativo, S = 1.' : 'positivo (o cero), S = 0.'}\n\n` +
        `Los campos de exponente y mantisa se calcularán en los pasos siguientes.`,
      highlight: {}
    });

    if (absVal === 0) {
      const zeroBin = '0'.repeat(1 + expBits + mantBits);
      steps.push({
        stepNumber: 2, title: 'Caso especial: cero',
        registers: { Resultado: zeroBin },
        operation: `► ${asm('0', '0'.repeat(expBits), '0'.repeat(mantBits))}\n  = ${zeroBin}`,
        explanation: 'El cero se representa con todos los bits a 0 en IEEE 754.',
        highlight: {}, isResult: true,
        result: { binary: zeroBin, decimal: 0, config }
      });
      return { valid: true, steps, config };
    }

    const intPart = Math.floor(absVal);
    const fracPart = absVal - intPart;

    // ── Paso 2: Parte entera ───────────────────────────────────────
    const intBin = intPart === 0 ? '0' : intPart.toString(2);
    const intD = intDivSteps(intPart, 0);
    const intExpl = intPart === 0
      ? '0₁₀ ≅ 0₂  (la parte entera es cero)'
      : `Divisiones sucesivas por 2 (leer residuos de abajo arriba):\n${intD.lines.join('\n')}\n\n${intD.result}`;

    steps.push({
      stepNumber: 2,
      title: 'Convertir parte entera a binario',
      registers: { 'Parte entera': `${intPart}₁₀ ≅ ${intBin}₂` },
      operation: `${intPart}₁₀ ≅ ${intBin}₂`,
      explanation: intExpl,
      highlight: {}
    });

    // ── Paso 3: Parte fraccionaria ─────────────────────────────────
    const maxFracBits = mantBits + 8;
    const fracR = fracMulSteps(fracPart, maxFracBits);
    const fracBin = fracR.bits || '0';
    const fracExpl = fracPart === 0
      ? 'La parte fraccionaria es 0. No hay bits adicionales.'
      : `Multiplicaciones sucesivas por 2 (tomar el dígito entero como siguiente bit):\n` +
        fracR.lines.join('\n') +
        `\n\n0.${fracPart.toString().slice(2)}₁₀ ≅ 0.${fracBin}${fracR.exact ? '' : '...'}₂` +
        (fracR.exact ? '\n→ Representación exacta.' : '\n→ Periódica o truncada (pérdida de precisión posible).');

    steps.push({
      stepNumber: 3,
      title: 'Convertir parte fraccionaria a binario',
      registers: { 'Parte frac.': `0.${fracBin}${fracR.exact ? '' : '...'}` },
      operation: `0.${fracPart.toFixed(8).slice(2)}₁₀ ≅ 0.${fracBin}${fracR.exact ? '' : '...'}₂`,
      explanation: fracExpl,
      highlight: {}
    });

    // ── Paso 4: Unir ───────────────────────────────────────────────
    const fullBin = fracPart > 0 ? `${intBin}.${fracBin}` : intBin;
    steps.push({
      stepNumber: 4,
      title: 'Unir parte entera y fraccionaria',
      registers: { Binario: fullBin },
      operation: `${absVal}₁₀ ≅ ${fullBin}₂`,
      explanation: `Concatenamos la parte entera (${intBin}₂) y la fraccionaria (.${fracBin}₂):\n${absVal}₁₀ ≅ ${fullBin}₂`,
      highlight: {}
    });

    // ── Paso 5: Normalizar ─────────────────────────────────────────
    let exponent, mantissa;

    if (intPart >= 1) {
      exponent = intBin.length - 1;
      mantissa = intBin.slice(1) + fracBin;
    } else {
      const leadingZeros = fracBin.indexOf('1');
      if (leadingZeros === -1) { exponent = 0; mantissa = ''; }
      else { exponent = -(leadingZeros + 1); mantissa = fracBin.slice(leadingZeros + 1); }
    }

    const normalForm = `1.${mantissa || '0'}`;
    steps.push({
      stepNumber: 5,
      title: 'Normalizar (mover el punto binario)',
      registers: { Normalizado: `${normalForm} × 2^${exponent}` },
      operation: `${fullBin}₂ = ${normalForm} × 2^${exponent}`,
      explanation: `Desplazamos el punto para que haya exactamente un 1 antes de él.\n` +
        `${fullBin}₂ = ${normalForm} × 2^${exponent}\n\n` +
        `La mantisa implícita (el 1 inicial no se almacena) es: ${mantissa || '0'}\n` +
        `El exponente real es: ${exponent}`,
      highlight: {}
    });

    // ── Paso 6: Exponente con sesgo ───────────────────────────────
    let biasedExp = exponent + usedBias;
    if (biasedExp < 0 || biasedExp >= Math.pow(2, expBits)) {
      steps.push({
        stepNumber: 6, title: 'Error: desbordamiento del exponente',
        registers: { Exponente: '—' },
        operation: `${exponent} + ${usedBias} = ${biasedExp} (fuera de rango para ${expBits} bits)`,
        explanation: `El exponente con sesgo ${biasedExp} está fuera del rango [0, ${Math.pow(2, expBits) - 1}].`,
        highlight: {}
      });
      return { valid: true, steps, overflow: true, config };
    }

    let biasedExpBin = biasedExp.toString(2).padStart(expBits, '0');
    const expD = intDivSteps(biasedExp, expBits);
    const expExpl = biasedExp === 0
      ? `Sesgo + exponente real: ${usedBias} + (${exponent}) = 0\n0₁₀ ≅ ${'0'.repeat(expBits)}₂`
      : `Sesgo + exponente real: ${usedBias} + (${exponent}) = ${biasedExp}\n\n` +
        `Convertir ${biasedExp} a binario en ${expBits} bits:\n${expD.lines.join('\n')}\n\n${expD.result}`;

    steps.push({
      stepNumber: 6,
      title: `Calcular exponente con sesgo (sesgo = ${usedBias})`,
      registers: { 'Exp. real': exponent.toString(), Sesgo: usedBias.toString(), 'Exp. almacenado': biasedExpBin },
      operation: `${usedBias} + (${exponent}) = ${biasedExp}  →  ${biasedExpBin}₂\n` +
        `► ${asm(sign, biasedExpBin, unknownMant)}`,
      explanation: expExpl,
      highlight: {}
    });

    // ── Paso 7: Mantisa con redondeo IEEE 754 round-to-nearest-even ──
    const mantPadded = mantissa.padEnd(mantBits + 4, '0');
    const mantRaw    = mantPadded.slice(0, mantBits);
    const guardBit   = mantPadded[mantBits] || '0';
    const stickyStr  = mantPadded.slice(mantBits + 1);
    const stickyBit  = stickyStr.includes('1') || mantissa.length > mantPadded.length;
    const lsbBit     = mantRaw[mantBits - 1] || '0';

    // Round-to-nearest-even: sube si guardián=1 y (sticky≠0 o LSB=1)
    const shouldRoundUp = guardBit === '1' && (stickyBit || lsbBit === '1');

    let mantTrunc = mantRaw;
    let mantExpAdj = 0;
    if (shouldRoundUp) {
      const bits = mantRaw.split('').map(Number);
      let carry = 1;
      for (let i = bits.length - 1; i >= 0 && carry; i--) {
        bits[i] += carry;
        carry = bits[i] >> 1;
        bits[i] &= 1;
      }
      if (carry) {
        mantExpAdj = 1;
        mantTrunc = '0'.repeat(mantBits);
        biasedExp += 1;
        biasedExpBin = biasedExp.toString(2).padStart(expBits, '0');
      } else {
        mantTrunc = bits.join('');
      }
    }

    const lostBits = (guardBit + stickyStr).replace(/0+$/, '');
    const precLoss  = lostBits.length > 0;

    const roundExpl = !precLoss
      ? `\nNo se pierden bits: la representación es exacta en este formato.`
      : shouldRoundUp
        ? `\nBit guardián = "${guardBit}", sticky = "${stickyStr || '0'}" → **redondeo hacia arriba** (IEEE 754 round-to-nearest-even): se suma 1 a la mantisa.` +
          (mantExpAdj ? `\nLa mantisa desbordó al redondear → el exponente se incrementa en 1 (nuevo exp. almacenado: ${biasedExpBin}₂).` : '')
        : `\nBit guardián = "${guardBit}", sticky = "${stickyStr || '0'}" → no se redondea hacia arriba. Los bits sobrantes se descartan.`;

    steps.push({
      stepNumber: 7,
      title: `Ajustar mantisa a ${mantBits} bits`,
      registers: { 'Mantisa completa': mantissa || '(vacía)', [`Mantisa ${mantBits}b`]: mantTrunc },
      operation: `${mantissa || '0'} → ${mantTrunc}` +
        (shouldRoundUp ? ` (+1 redondeo${mantExpAdj ? ', exp++' : ''})` : '') + '\n' +
        `► ${asm(sign, biasedExpBin, mantTrunc)}`,
      explanation: `La mantisa implícita se ajusta a ${mantBits} bits.${roundExpl}`,
      highlight: {}
    });

    // ── Paso 8: Ensamblado ─────────────────────────────────────────
    const resultBin = sign.toString() + biasedExpBin + mantTrunc;
    const realMant = 1 + parseInt(mantTrunc || '0', 2) / Math.pow(2, mantBits);
    const realValue = (sign ? -1 : 1) * realMant * Math.pow(2, biasedExp - usedBias);
    const error = realValue - decimal;

    steps.push({
      stepNumber: 8,
      title: 'Ensamblado final',
      registers: { S: sign.toString(), Exponente: biasedExpBin, Mantisa: mantTrunc, Resultado: resultBin },
      operation: `[${sign}] [${biasedExpBin}] [${mantTrunc}]\n  = ${resultBin}`,
      explanation: `Ensamblamos los tres campos:\n` +
        `  Signo      (1 bit):       ${sign}\n` +
        `  Exponente  (${expBits} bits):  ${biasedExpBin}\n` +
        `  Mantisa    (${mantBits} bits): ${mantTrunc}\n\n` +
        `Resultado: ${resultBin}\n` +
        `Valor representado: ${realValue.toPrecision(8)} ` +
        (Math.abs(error) > 1e-10 ? `(error de redondeo: ${error.toExponential(3)})` : '(exacto)'),
      highlight: {},
      isResult: true,
      result: { binary: resultBin, sign: sign.toString(), exponentBin: biasedExpBin, mantissaBin: mantTrunc, realValue, originalDecimal: decimal, config }
    });

    return { valid: true, steps, config, result: resultBin };
  }

  // ──────────────────────────────────────────────────────────────────
  //  CONVERSIÓN INVERSA: binario IEEE 754 → decimal
  //  Pasos didácticos: desensamblar, decodificar exponente,
  //  reconstruir mantisa, parte entera, parte fraccionaria, suma, signo
  // ──────────────────────────────────────────────────────────────────
  function floatToDec(binStr, config) {
    const { expBits, mantBits } = config;
    const maxBias = Math.pow(2, expBits - 1) - 1;
    const usedBias = (config.bias !== undefined && config.bias !== '') ? parseInt(config.bias) : maxBias;
    const totalBits = 1 + expBits + mantBits;
    const steps = [];

    const bin = binStr.replace(/\s/g, '');
    if (bin.length !== totalBits) {
      return { valid: false, error: `Se esperan ${totalBits} bits (1+${expBits}+${mantBits}). Se recibieron ${bin.length}.`, steps: [] };
    }
    if (!/^[01]+$/.test(bin)) return { valid: false, error: 'Solo se permiten bits 0 y 1.', steps: [] };

    const signBit = parseInt(bin[0]);
    const expBin  = bin.slice(1, 1 + expBits);
    const mantBin = bin.slice(1 + expBits);
    const biasedExp = parseInt(expBin, 2);
    const realExp   = biasedExp - usedBias;
    const mantVal   = parseInt(mantBin, 2) / Math.pow(2, mantBits);
    const mantFull  = 1 + mantVal;
    const absValue  = mantFull * Math.pow(2, realExp);
    const value     = signBit ? -absValue : absValue;

    // ── Paso 1: Separar campos ────────────────────────────────────
    steps.push({
      stepNumber: 1,
      title: 'Separar los tres campos de la representación',
      registers: {},
      operation: `[S=${signBit}] [Exp=${expBin}] [Mant=${mantBin}]`,
      explanation: `Los ${totalBits} bits se dividen en tres campos:\n` +
        `  Signo      (1 bit):       ${signBit}  → número ${signBit ? 'negativo' : 'positivo'}\n` +
        `  Exponente  (${expBits} bits):  ${expBin}  (almacenado con sesgo = ${usedBias})\n` +
        `  Mantisa    (${mantBits} bits): ${mantBin}  (sin el 1 implícito)`,
      highlight: {}
    });

    // ── Paso 2: Decodificar exponente ────────────────────────────
    // Mostrar conversión binario → decimal bit a bit
    const expBitLines = [];
    for (let i = 0; i < expBits; i++) {
      const power = expBits - 1 - i;
      const bit   = parseInt(expBin[i]);
      if (bit) expBitLines.push(`  ${expBin[i]} × 2^${power} = ${Math.pow(2, power)}`);
    }
    expBitLines.push(`  ${'─'.repeat(26)}`);
    expBitLines.push(`  Suma = ${biasedExp}`);

    // ── Paso 3 & 4: Contribución de cada bit '1' ─────────────────
    // allBits[0] = 1 implícito (siempre presente), allBits[1..] = bits de mantisa almacenada
    const allBits = '1' + mantBin;
    const intContribs  = [];
    const fracContribs = [];

    for (let i = 0; i < allBits.length; i++) {
      if (allBits[i] !== '1') continue;
      const power  = realExp - i;
      const contrib = Math.pow(2, power);
      (power >= 0 ? intContribs : fracContribs).push({ power, contrib, bitPos: i });
    }

    // Expanded binary: move decimal point by realExp positions to show the full number
    const buildExpandedBin = (bits, expReal) => {
      const p = 1 + expReal;
      let intP, fracP;
      if (p <= 0) { intP = '0'; fracP = '0'.repeat(-p) + bits; }
      else if (p >= bits.length) { intP = bits.padEnd(p, '0'); fracP = ''; }
      else { intP = bits.slice(0, p); fracP = bits.slice(p); }
      fracP = fracP.replace(/0+$/, '');
      return fracP ? `${intP}.${fracP}` : intP;
    };
    const expandedBinStr = buildExpandedBin(allBits, realExp);

    function boldBin(s) { return String(s).replace(/1/g, '**1**'); }

    steps.push({
      stepNumber: 2,
      title: 'Decodificar el exponente: binario → decimal y quitar el sesgo',
      registers: {},
      operation: `Decodificando:\n  ${expBin}₂ = ${biasedExp}₁₀\n\nQuitando el sesgo del exponente:\n  ${biasedExp} − ${usedBias} = ${realExp}\n\nReconstruyendo binario con parte entera y decimal:\n  **1**.${boldBin(mantBin)}₂ × 2^${realExp}  =  ${boldBin(expandedBinStr)}₂`,
      explanation: `Convertir exponente almacenado a decimal (peso de cada bit 1):\n${expBitLines.join('\n')}\n\n` +
        `Quitar el sesgo para obtener el exponente real:\n` +
        `  Exp. real = Exp. almacenado − sesgo\n` +
        `  Exp. real = ${biasedExp} − ${usedBias} = ${realExp}\n\n` +
        `Desplazar el punto binario ${Math.abs(realExp)} posición(es) ` +
        `${realExp >= 0 ? 'a la derecha' : 'a la izquierda'}:\n` +
        `  **1**.${boldBin(mantBin)}₂ × 2^${realExp}  =  ${boldBin(expandedBinStr)}₂`,
      highlight: {}
    });

    const mantDisp = mantBin;

    // Separar parte entera y fraccionaria del binario expandido
    const dotIdx2 = expandedBinStr.indexOf('.');
    const intPartStr  = dotIdx2 >= 0 ? expandedBinStr.slice(0, dotIdx2) : expandedBinStr;
    const fracPartStr = dotIdx2 >= 0 ? expandedBinStr.slice(dotIdx2 + 1) : '';

    // Etiqueta legible para cada bit de allBits (los 1s siempre en negrita)
    function bitLabel(bitPos) {
      if (bitPos === 0) return '**1** implícito';
      const idx = bitPos - 1;
      return `Mant[${String(idx).padEnd(2)}] = **1**`;
    }

    // ── Paso 3: Parte entera ─────────────────────────────────────
    let intSum = 0;
    intContribs.forEach(c => { intSum += c.contrib; });

    const binLine = `  ${boldBin(expandedBinStr)}₂`;

    let intOp, intExpl;
    if (intContribs.length === 0) {
      intOp =
        `Número en binario (punto desplazado ${Math.abs(realExp)} pos.):\n${binLine}\n\n` +
        `Parte entera → dígitos ANTES del punto: ${boldBin(intPartStr)}\n` +
        `  (ningún bit alcanza peso ≥ 1)\n\n` +
        `  parte entera = 0`;
      intExpl =
        `Del paso 2 sabemos que:\n` +
        `  **1**.${boldBin(mantDisp)}₂ × 2^${realExp}  =  ${boldBin(expandedBinStr)}₂\n\n` +
        `Los dígitos a la IZQUIERDA del punto binario forman la parte entera.\n` +
        `En ${boldBin(expandedBinStr)}₂ la parte entera es "${boldBin(intPartStr)}".\n\n` +
        `Con exp_real = ${realExp}, el 1 implícito tiene peso 2^${realExp} = ${Math.pow(2, realExp)},\n` +
        `que es < 1 → ningún bit contribuye a la parte entera.\n\n` +
        `  Parte entera del valor = 0`;
    } else {
      const opLines = intContribs.map(c =>
        `  ${bitLabel(c.bitPos).trimEnd()} → 2^${c.power} = ${c.contrib}`
      );
      opLines.push(`  ${'─'.repeat(36)}`);
      opLines.push(`  parte entera = ${intSum}`);
      intOp =
        `Número en binario (punto desplazado ${Math.abs(realExp)} pos.):\n${binLine}\n\n` +
        `Parte entera → dígitos ANTES del punto: ${boldBin(intPartStr)}\n` +
        `  Valor de cada bit con peso ≥ 1:\n` +
        opLines.join('\n');
      intExpl =
        `Del paso 2 sabemos que:\n` +
        `  **1**.${boldBin(mantDisp)}₂ × 2^${realExp}  =  ${boldBin(expandedBinStr)}₂\n\n` +
        `Los dígitos a la IZQUIERDA del punto binario forman la parte entera.\n` +
        `En ${boldBin(expandedBinStr)}₂ la parte entera es "${boldBin(intPartStr)}".\n\n` +
        `Con exp_real = ${realExp}, el peso de cada bit i es 2^(${realExp} − i).\n` +
        `Los bits con peso ≥ 1:\n` +
        intContribs.map(c =>
          `  ${bitLabel(c.bitPos).trimEnd()} → 2^${c.power} = ${c.contrib}`
        ).join('\n') +
        `\n  ${'─'.repeat(36)}\n  Suma parte entera = ${intSum}`;
    }

    steps.push({
      stepNumber: 3,
      title: 'Parte entera del valor',
      registers: {},
      operation: intOp,
      explanation: intExpl,
      highlight: {}
    });

    // ── Paso 4: Parte fraccionaria ────────────────────────────────
    let fracSum = 0;
    fracContribs.forEach(c => { fracSum += c.contrib; });

    let fracOp, fracExpl;
    if (fracContribs.length === 0) {
      fracOp =
        `Número en binario (punto desplazado ${Math.abs(realExp)} pos.):\n${binLine}\n\n` +
        `Parte fraccionaria → dígitos DESPUÉS del punto: (ninguno)\n` +
        `  (todos los bits tienen peso ≥ 1)\n\n` +
        `  parte fraccionaria = 0`;
      fracExpl =
        `Del paso 2 sabemos que:\n` +
        `  **1**.${boldBin(mantDisp)}₂ × 2^${realExp}  =  ${boldBin(expandedBinStr)}₂\n\n` +
        `Los dígitos a la DERECHA del punto binario forman la parte fraccionaria.\n` +
        `En ${boldBin(expandedBinStr)}₂ no hay dígitos tras el punto.\n\n` +
        `Con exp_real = ${realExp}, todos los bits tienen peso 2^k con k ≥ 0.\n` +
        `  Parte fraccionaria del valor = 0`;
    } else {
      const opLines = fracContribs.map(c =>
        `  ${bitLabel(c.bitPos).trimEnd()} → 1/2^${Math.abs(c.power)} = ${c.contrib}`
      );
      opLines.push(`  ${'─'.repeat(36)}`);
      opLines.push(`  parte fraccionaria = ${fracSum}`);
      fracOp =
        `Número en binario (punto desplazado ${Math.abs(realExp)} pos.):\n${binLine}\n\n` +
        `Parte fraccionaria → dígitos DESPUÉS del punto: .${boldBin(fracPartStr)}\n` +
        `  Valor de cada bit con peso < 1:\n` +
        opLines.join('\n');
      fracExpl =
        `Del paso 2 sabemos que:\n` +
        `  **1**.${boldBin(mantDisp)}₂ × 2^${realExp}  =  ${boldBin(expandedBinStr)}₂\n\n` +
        `Los dígitos a la DERECHA del punto binario forman la parte fraccionaria.\n` +
        `En ${boldBin(expandedBinStr)}₂ la parte fraccionaria es ".${boldBin(fracPartStr)}".\n\n` +
        `Los bits con peso < 1, expresados como 1/2^k:\n` +
        fracContribs.map(c =>
          `  ${bitLabel(c.bitPos).trimEnd()} → 1/2^${Math.abs(c.power)} = ${c.contrib}`
        ).join('\n') +
        `\n  ${'─'.repeat(36)}\n  Suma parte fraccionaria = ${fracSum}`;
    }

    steps.push({
      stepNumber: 4,
      title: 'Parte fraccionaria: bits cuyo peso es 1/2^k',
      registers: {},
      operation: fracOp,
      explanation: fracExpl,
      highlight: {}
    });

    // ── Paso 5: Sumar parte entera + fraccionaria ─────────────────
    steps.push({
      stepNumber: 5,
      title: 'Valor absoluto = parte entera + parte fraccionaria',
      registers: {},
      operation: `${intSum} + ${fracSum} = ${absValue.toPrecision(8)}`,
      explanation: `Sumamos los dos grupos:\n` +
        `  Parte entera:       ${intSum}\n` +
        `  Parte fraccionaria: ${fracSum}\n` +
        `  ${'─'.repeat(34)}\n` +
        `  Valor absoluto    = ${absValue.toPrecision(8)}\n\n` +
        `(El signo se aplica en el paso siguiente.)`,
      highlight: {}
    });

    // ── Paso 6: Aplicar signo ─────────────────────────────────────
    steps.push({
      stepNumber: 6,
      title: 'Aplicar el signo y obtener el resultado final',
      registers: {},
      operation: `(-1)^${signBit} × ${absValue.toPrecision(8)} = ${value.toPrecision(8)}`,
      explanation: `Bit de signo = ${signBit} → número ${signBit ? 'negativo' : 'positivo'}.\n\n` +
        `  Valor = (-1)^${signBit} × ${absValue.toPrecision(8)}\n` +
        `        = ${value.toPrecision(8)}`,
      highlight: {},
      isResult: true,
      result: { decimal: value, binary: bin, config }
    });

    return { valid: true, steps, result: value };
  }

  // ──────────────────────────────────────────────────────────────────
  //  ENTRADA BINARIA: parseo + conversión directa al formato flotante
  // ──────────────────────────────────────────────────────────────────

  /**
   * Parsea un string binario en dos formatos:
   *   - Punto: "110011.01"  o "-110011.01"
   *   - Científico: "1.10011e5", "1.10011×2^5", "1.10011*2^-3", "1.10011·2^0"
   * Devuelve { valid, sign, intBin, fracBin, expOffset, mode } o { valid:false, error }
   */
  function parseBinaryInput(str) {
    const s = (str || '').trim().replace(/\s/g, '');
    if (!s) return { valid: false, error: 'Introduce un número binario.' };

    let sign = 0;
    let rest = s;
    if (rest.startsWith('-')) { sign = 1; rest = rest.slice(1); }
    else if (rest.startsWith('+')) { rest = rest.slice(1); }

    // Notación científica: 1.101e5, 1.101×2^5, 1.101*2^-3, 1.101·2^0, 1.101x2^2
    const sciRe = /^([01]+(?:\.[01]*)?)\s*(?:[×xX*·e]\s*(?:2\^)?\s*)([+\-]?\d+)$/i;
    const sciMatch = rest.match(sciRe);
    if (sciMatch) {
      const mantStr = sciMatch[1];
      const expOffset = parseInt(sciMatch[2]);
      const dotIdx = mantStr.indexOf('.');
      const intBin = dotIdx >= 0 ? (mantStr.slice(0, dotIdx) || '0') : mantStr;
      const fracBin = dotIdx >= 0 ? mantStr.slice(dotIdx + 1) : '';
      if (!/^[01]*$/.test(intBin) || !/^[01]*$/.test(fracBin))
        return { valid: false, error: 'La mantisa solo puede contener bits 0 y 1.' };
      return { valid: true, sign, mode: 'sci', intBin, fracBin, expOffset };
    }

    // Notación con punto: 110011.01, 0.001, 1, etc.
    if (/^[01]*\.?[01]*$/.test(rest) && rest.replace('.', '').length > 0) {
      const dotIdx = rest.indexOf('.');
      const intBin = dotIdx >= 0 ? (rest.slice(0, dotIdx) || '0') : rest;
      const fracBin = dotIdx >= 0 ? rest.slice(dotIdx + 1) : '';
      return { valid: true, sign, mode: 'point', intBin, fracBin, expOffset: 0 };
    }

    return { valid: false, error: 'Formato no reconocido. Usa notación con punto (110011.01) o científica (1.10011e5 / 1.10011×2^5).' };
  }

  /**
   * Convierte un número binario (notación con punto o científica) al formato flotante.
   * Produce pasos didácticos similares a decToFloat pero sin las conversiones decimal→binario.
   */
  function binToFloat(binStr, config) {
    const steps = [];
    const { expBits, mantBits } = config;
    const maxBias = Math.pow(2, expBits - 1) - 1;
    const usedBias = (config.bias !== undefined && config.bias !== '') ? parseInt(config.bias) : maxBias;

    const parsed = parseBinaryInput(binStr);
    if (!parsed.valid) return { valid: false, error: parsed.error, steps: [] };

    const { sign, intBin, fracBin, expOffset, mode } = parsed;

    const dot = '·';
    const unknownExp  = dot.repeat(expBits);
    const unknownMant = dot.repeat(mantBits);
    function asm(s, e, m) { return `[${s}] [${e}] [${m}]`; }

    const fracDisp = fracBin ? `.${fracBin}` : '';
    const inputDisplay = mode === 'sci'
      ? `${intBin}${fracDisp}₂ × 2^${expOffset}`
      : `${intBin}${fracDisp}₂`;
    const inputExpl = mode === 'sci'
      ? `Notación científica binaria:\n  Mantisa: ${intBin}.${fracBin || '0'}₂\n  Exponente de desplazamiento: ${expOffset}`
      : `Número binario con coma:\n  Parte entera:       ${intBin}₂\n  Parte fraccionaria: ${fracBin || '0'}₂`;

    // ── Paso 1: Signo ──────────────────────────────────────────────
    steps.push({
      stepNumber: 1,
      title: 'Bit de signo',
      registers: { Signo: sign.toString() },
      operation: `${sign ? '-' : '+'}${inputDisplay}  →  S = ${sign}\n► ${asm(sign, unknownExp, unknownMant)}`,
      explanation: `El número ${sign ? 'es negativo' : 'es positivo o cero'} → S = ${sign}.\n\nNúmero de entrada: ${inputDisplay}`,
      highlight: {}
    });

    // ── Paso 2: Número binario reconocido ─────────────────────────
    steps.push({
      stepNumber: 2,
      title: 'Número binario de entrada',
      registers: { Binario: inputDisplay },
      operation: inputDisplay,
      explanation: inputExpl,
      highlight: {}
    });

    // ── Verificar cero ────────────────────────────────────────────
    const allConcat = intBin + fracBin;
    const firstOne = allConcat.indexOf('1');

    if (firstOne === -1) {
      const zeroBin = '0'.repeat(1 + expBits + mantBits);
      steps.push({
        stepNumber: 3, title: 'Caso especial: cero',
        registers: { Resultado: zeroBin },
        operation: `► ${asm('0', '0'.repeat(expBits), '0'.repeat(mantBits))}\n  = ${zeroBin}`,
        explanation: 'El número binario es cero: todos los campos a 0.',
        highlight: {}, isResult: true,
        result: { binary: zeroBin, decimal: 0, config }
      });
      return { valid: true, steps, config };
    }

    // ── Paso 3: Normalizar ─────────────────────────────────────────
    // Peso del bit en posición i de allConcat = 2^(len(intBin) + expOffset - 1 - i)
    const exponent = intBin.length + expOffset - 1 - firstOne;
    const mantissa = allConcat.slice(firstOne + 1);
    const normalForm = `1.${mantissa || '0'}`;

    const normalExpl = mode === 'sci'
      ? `Entrada: ${inputDisplay}\n` +
        `Concatenación de bits: "${allConcat}"\n` +
        `Primer bit '1' en posición ${firstOne}.\n\n` +
        `Exponente real = len("${intBin}") + ${expOffset} − 1 − ${firstOne}\n` +
        `              = ${intBin.length} + ${expOffset} − 1 − ${firstOne} = ${exponent}\n\n` +
        `Forma normalizada: ${normalForm} × 2^${exponent}`
      : `Movemos el punto binario hasta que haya exactamente un 1 a su izquierda.\n\n` +
        `Número: ${inputDisplay}\n` +
        `Bits concatenados: "${allConcat}"\n` +
        `Primer '1' en posición ${firstOne} → mover ${Math.abs(exponent)} posición(es) ` +
        `${exponent >= 0 ? 'a la izquierda' : 'a la derecha'}\n\n` +
        `${inputDisplay} = ${normalForm} × 2^${exponent}`;

    steps.push({
      stepNumber: 3,
      title: 'Normalizar → 1.bbb...b × 2^e',
      registers: { Normalizado: `${normalForm} × 2^${exponent}` },
      operation: `${inputDisplay} = ${normalForm} × 2^${exponent}`,
      explanation: normalExpl,
      highlight: {}
    });

    // ── Paso 4: Exponente con sesgo ───────────────────────────────
    const biasedExp = exponent + usedBias;
    if (biasedExp < 0 || biasedExp >= Math.pow(2, expBits)) {
      steps.push({
        stepNumber: 4, title: 'Error: desbordamiento del exponente',
        registers: { Exponente: '—' },
        operation: `${exponent} + ${usedBias} = ${biasedExp} (fuera de rango para ${expBits} bits)`,
        explanation: `El exponente con sesgo ${biasedExp} está fuera del rango [0, ${Math.pow(2, expBits) - 1}].`,
        highlight: {}
      });
      return { valid: true, steps, overflow: true, config };
    }

    const biasedExpBin = biasedExp.toString(2).padStart(expBits, '0');
    const expD = intDivSteps(biasedExp, expBits);
    const expExpl = biasedExp === 0
      ? `Exp. real (${exponent}) + sesgo (${usedBias}) = 0\n0₁₀ ≅ ${'0'.repeat(expBits)}₂`
      : `Exp. real:         ${exponent}\nSesgo:             ${usedBias}\n` +
        `Exp. almacenado =  ${exponent} + ${usedBias} = ${biasedExp}\n\n` +
        `Convertir ${biasedExp} a binario en ${expBits} bits:\n${expD.lines.join('\n')}\n\n${expD.result}`;

    steps.push({
      stepNumber: 4,
      title: `Exponente con sesgo (sesgo = ${usedBias})`,
      registers: { 'Exp. real': exponent.toString(), Sesgo: usedBias.toString(), 'Exp. almacenado': biasedExpBin },
      operation: `${usedBias} + (${exponent}) = ${biasedExp}  →  ${biasedExpBin}₂\n► ${asm(sign, biasedExpBin, unknownMant)}`,
      explanation: expExpl,
      highlight: {}
    });

    // ── Paso 5: Ajustar mantisa ───────────────────────────────────
    const mantFull  = mantissa.padEnd(mantBits + 4, '0');
    const mantTrunc = mantFull.slice(0, mantBits);
    const lostBits  = mantFull.slice(mantBits).replace(/0+$/, '');
    const precLoss  = lostBits.length > 0;

    steps.push({
      stepNumber: 5,
      title: `Mantisa: ajustar a ${mantBits} bits`,
      registers: { 'Mantisa implícita': mantissa || '(vacía)', [`Mantisa ${mantBits}b`]: mantTrunc },
      operation: `${mantissa || '0'} → ${mantTrunc}${precLoss ? ` (perdidos: ${lostBits})` : ''}\n► ${asm(sign, biasedExpBin, mantTrunc)}`,
      explanation: `Bits tras el 1 implícito: "${mantissa || '(vacía)'}" → ajustados a ${mantBits} bits: ${mantTrunc}` +
        (precLoss ? `\nBits descartados: "${lostBits}" → pérdida de precisión.` : '\nSin pérdida de precisión.'),
      highlight: {}
    });

    // ── Paso 6: Ensamblado ─────────────────────────────────────────
    const resultBin = sign.toString() + biasedExpBin + mantTrunc;
    const realMant  = 1 + parseInt(mantTrunc || '0', 2) / Math.pow(2, mantBits);
    const realValue = (sign ? -1 : 1) * realMant * Math.pow(2, biasedExp - usedBias);

    steps.push({
      stepNumber: 6,
      title: 'Ensamblado final',
      registers: { S: sign.toString(), Exponente: biasedExpBin, Mantisa: mantTrunc, Resultado: resultBin },
      operation: `[${sign}] [${biasedExpBin}] [${mantTrunc}]\n  = ${resultBin}`,
      explanation: `Ensamblamos los tres campos:\n` +
        `  Signo      (1 bit):       ${sign}\n` +
        `  Exponente  (${expBits} bits):  ${biasedExpBin}\n` +
        `  Mantisa    (${mantBits} bits): ${mantTrunc}\n\n` +
        `Resultado: ${resultBin}\n` +
        `Valor representado: ${realValue.toPrecision(8)}`,
      highlight: {},
      isResult: true,
      result: { binary: resultBin, sign: sign.toString(), exponentBin: biasedExpBin, mantissaBin: mantTrunc, realValue, config }
    });

    return { valid: true, steps, config, result: resultBin };
  }

  return { decToFloat, floatToDec, parseBinaryInput, binToFloat };
})();
