// Módulo de sumadores: semi-sumador, sumador completo, sumador paralelo
window.AC = window.AC || {};

window.AC.Adders = (function () {
  const B = () => window.AC.Binary;

  // Sumador paralelo paso a paso
  function parallelAdderSteps(a_str, b_str) {
    const B_ = B();
    if (!B_.isValidBinary(a_str) || !B_.isValidBinary(b_str)) {
      return { valid: false, error: 'Las entradas deben contener solo bits (0 y 1).', steps: [] };
    }

    const n = Math.max(a_str.length, b_str.length);
    const A = a_str.padStart(n, '0');
    const Bv = b_str.padStart(n, '0');
    const A_dec = B_.binToDecUnsigned(A);
    const B_dec = B_.binToDecUnsigned(Bv);

    const steps = [];
    let carries = ['0'];
    let sums = [];

    steps.push({
      stepNumber: 0,
      title: 'Inicialización',
      registers: { A, B: Bv, 'C₋₁': '0' },
      operation: `Cin = 0, A = ${A} (${A_dec}), B = ${Bv} (${B_dec})`,
      explanation: `Iniciamos el sumador paralelo de ${n} bits. El carry de entrada es 0. ` +
        `Procesaremos cada par de bits de derecha a izquierda.`,
      highlight: {}
    });

    // Procesar cada bit de derecha a izquierda
    for (let i = n - 1; i >= 0; i--) {
      const pos = n - 1 - i; // posición desde LSB
      const Ai = A[i];
      const Bi = Bv[i];
      const Cin = carries[carries.length - 1];
      const fa = B_.fullAdder(Ai, Bi, Cin);
      const S = fa.S;
      const Cout = fa.Cout;
      carries.push(Cout);
      sums.unshift(S);

      steps.push({
        stepNumber: steps.length,
        title: `Bit ${pos} (posición ${i})`,
        registers: {
          [`A[${i}]`]: Ai,
          [`B[${i}]`]: Bi,
          Cin,
          S: S,
          Cout
        },
        operation: `A[${i}]=${Ai}, B[${i}]=${Bi}, Cin=${Cin} → S=${S}, Cout=${Cout}`,
        explanation: `Sumador completo en posición ${i}: S = ${Ai} XOR ${Bi} XOR ${Cin} = ${S}. ` +
          `Cout = (${Ai}·${Bi}) + (${Ai}·${Cin}) + (${Bi}·${Cin}) = ${Cout}. ` +
          `El carry ${Cout} se propaga a la siguiente posición.`,
        highlight: {}
      });
    }

    const sumResult = sums.join('');
    const finalCarry = carries[carries.length - 1];
    const resultWithCarry = finalCarry + sumResult;
    const result_dec = B_.binToDecUnsigned(resultWithCarry);
    const overflow = finalCarry === '1';
    const latency = `Latencia del sumador paralelo de ${n} bits = 2n·T = ${2 * n}T (cada sumador completo tarda 2T y los carries se propagan en serie).`;

    steps.push({
      stepNumber: steps.length,
      title: 'Resultado Final',
      registers: {
        A,
        B: Bv,
        Suma: sumResult,
        Cout: finalCarry
      },
      operation: `${A} + ${Bv} = ${overflow ? '1:' : ''}${sumResult} = ${result_dec}₁₀${overflow ? ' (OVERFLOW)' : ''}`,
      explanation: `Suma completada. Resultado = ${resultWithCarry}₂ = ${result_dec}₁₀. ` +
        `${overflow ? '⚠️ Hay overflow: el carry final es 1, el resultado no cabe en ' + n + ' bits. ' : ''}` +
        latency,
      highlight: {},
      isResult: true,
      result: {
        sum: sumResult, carry: finalCarry, decimal: result_dec,
        A_dec, B_dec, overflow, n
      }
    });

    return { valid: true, steps, n, A, B: Bv, A_dec, B_dec };
  }

  // Pasos didácticos del sumador con carry anticipado (n bits)
  function carryLookaheadSteps(a_str, b_str, c0_str) {
    const B_ = B();

    const n = Math.max(a_str.length, b_str.length);
    if (n < 1 || n > 16) {
      return { valid: false, error: 'El sumador soporta entre 1 y 16 bits.', steps: [] };
    }
    const A  = a_str.padStart(n, '0');
    const Bv = b_str.padStart(n, '0');
    const c0 = parseInt((c0_str || '0')[0] || '0');

    if (!B_.isValidBinary(A) || !B_.isValidBinary(Bv)) {
      return { valid: false, error: 'Las entradas deben contener solo bits (0 y 1).', steps: [] };
    }

    const steps = [];
    const A_dec = B_.binToDecUnsigned(A);
    const B_dec = B_.binToDecUnsigned(Bv);

    // ── Calcular G, P, C, S ──────────────────────────────────────
    const G = [], P = [], C = [c0], S = [];
    for (let i = 0; i < n; i++) {
      const ai = parseInt(A[n - 1 - i]);
      const bi = parseInt(Bv[n - 1 - i]);
      G[i] = ai & bi;
      P[i] = ai ^ bi;
    }
    for (let i = 0; i < n; i++) {
      C[i + 1] = G[i] | (P[i] & C[i]);
      S[i]     = P[i] ^ C[i];
    }

    // ── Paso 0: Inicialización ───────────────────────────────────
    steps.push({
      stepNumber: 0,
      title: 'Inicialización',
      registers: { A, B: Bv, 'C₀': c0.toString() },
      operation: `A  = ${A}  (${A_dec}₁₀)\nB  = ${Bv}  (${B_dec}₁₀)\nC₀ = ${c0}`,
      explanation: `Sumador con carry anticipado de ${n} bits.\n` +
        `Calcularemos: generadores Gᵢ, propagadores Pᵢ, carries anticipados Cᵢ y sumas Sᵢ.`,
      highlight: {}
    });

    // ── Paso 1: Generadores G ────────────────────────────────────
    const gLines = G.map((g, i) =>
      `G${i} = A${i} · B${i} = ${A[n-1-i]} · ${Bv[n-1-i]} = ${g}`
    );
    steps.push({
      stepNumber: 1,
      title: 'Calcular generadores  Gᵢ = Aᵢ · Bᵢ  (2T)',
      registers: {},
      operation: gLines.join('\n'),
      explanation: `Gᵢ = Aᵢ AND Bᵢ — el bit GENERA carry si ambos operandos son 1.\n\n` + gLines.join('\n'),
      highlight: {}
    });

    // ── Paso 2: Propagadores P ───────────────────────────────────
    const pLines = P.map((p, i) =>
      `P${i} = A${i} ⊕ B${i} = ${A[n-1-i]} ⊕ ${Bv[n-1-i]} = ${p}`
    );
    steps.push({
      stepNumber: 2,
      title: 'Calcular propagadores  Pᵢ = Aᵢ ⊕ Bᵢ  (2T, en paralelo)',
      registers: {},
      operation: pLines.join('\n'),
      explanation: `Pᵢ = Aᵢ XOR Bᵢ — el bit PROPAGA carry si exactamente uno es 1.\n\n` + pLines.join('\n'),
      highlight: {}
    });

    // ── Paso 3: Carries anticipados ──────────────────────────────
    const cLines = [`C0 = ${c0}`];
    for (let i = 0; i < n; i++) {
      cLines.push(
        `C${i+1} = G${i} + P${i} · C${i} = ${G[i]} + ${P[i]} · ${C[i]} = ${C[i+1]}`
      );
    }
    steps.push({
      stepNumber: 3,
      title: 'Calcular carries anticipados  Cᵢ₊₁ = Gᵢ + Pᵢ · Cᵢ  (2T)',
      registers: {},
      operation: cLines.join('\n'),
      explanation: `En hardware todos los carries se calculan en paralelo (2T).\n` +
        `Cᵢ₊₁ = Gᵢ + Pᵢ · Cᵢ\n\n` + cLines.join('\n'),
      highlight: {}
    });

    // ── Paso 4: Sumas ────────────────────────────────────────────
    const sLines = [`Sᵢ = Pᵢ ⊕ Cᵢ`];
    for (let i = 0; i < n; i++) {
      sLines.push(`S${i} = P${i} ⊕ C${i} = ${P[i]} ⊕ ${C[i]} = ${S[i]}`);
    }
    const sumBin = S.slice().reverse().join('');
    steps.push({
      stepNumber: 4,
      title: 'Calcular sumas  Sᵢ = Pᵢ ⊕ Cᵢ  (2T)',
      registers: {},
      operation: sLines.join('\n'),
      explanation: `Con todos los carries conocidos, las sumas se calculan en paralelo (2T).\n\n` + sLines.join('\n'),
      highlight: {}
    });

    // ── Paso 5: Resultado ────────────────────────────────────────
    const cn = C[n];
    const resultWithCarry = cn.toString() + sumBin;
    const result_dec = B_.binToDecUnsigned(resultWithCarry);
    const bitsDisplay = sumBin.split('').join(' ');
    const regs5 = { A, B: Bv, Suma: sumBin };
    regs5[`C${n}`] = cn.toString();

    steps.push({
      stepNumber: 5,
      title: 'Resultado final',
      registers: regs5,
      operation: `Solución: S${n-1}…S0 = ${bitsDisplay}\n` +
        `${cn ? `Carry C${n} = 1\n` : ''}` +
        `\n${A} + ${Bv} + ${c0} = ${cn ? '1:' : ''}${sumBin} = ${result_dec}₁₀`,
      explanation: `Resultado: ${cn ? '1:' : ''}${sumBin}₂ = ${result_dec}₁₀\n\n` +
        `Latencia total: 6T\n` +
        `  Gᵢ, Pᵢ  en 2T\n` +
        `  Cᵢ      en 2T\n` +
        `  Sᵢ      en 2T\n\n` +
        `Sumador paralelo de ${n} bits tardaría ${2*n}T — CLA siempre 6T.`,
      highlight: {},
      isResult: true,
      result: { sum: sumBin, carry: cn.toString(), decimal: result_dec, A_dec, B_dec }
    });

    return {
      valid: true, steps, A, B: Bv, C0: c0.toString(),
      G: G.map(v => v.toString()), P: P.map(v => v.toString()),
      C: C.map(v => v.toString()), S: S.map(v => v.toString()),
      A_dec, B_dec
    };
  }

  return { parallelAdderSteps, carryLookaheadSteps };
})();
