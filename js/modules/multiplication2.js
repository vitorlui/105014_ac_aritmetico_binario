// Algoritmo de multiplicación binaria sin signo — Algoritmo 2 (n bits)
// Registros: MD (n bits), C (carry 1 bit), PP (acumulador n bits), MR (multiplicador n bits)
window.AC = window.AC || {};

window.AC.Multiply2 = (function () {

  function compute(M_str, Q_str) {
    const B = window.AC.Binary;

    if (!B.isValidBinary(M_str) || !B.isValidBinary(Q_str)) {
      return { valid: false, error: 'Las entradas deben contener solo bits (0 y 1).', steps: [] };
    }

    const n = Math.max(M_str.length, Q_str.length);
    // Internal variable names kept as M, A, Q for algorithm clarity;
    // displayed as MD, PP, MR respectively.
    const M = M_str.padStart(n, '0');   // MD (multiplicando)
    const Q_init = Q_str.padStart(n, '0');  // MR initial

    const M_dec = B.binToDecUnsigned(M);
    const Q_dec = B.binToDecUnsigned(Q_init);

    let C = '0';
    let A = '0'.repeat(n);   // PP (producto parcial acumulador)
    let Q = Q_init;           // MR (multiplicador)
    let iteracion = n;
    const steps = [];

    // Paso 0: Inicialización
    steps.push({
      stepNumber: 0,
      title: 'Inicialización',
      registers: { Iteración: String(iteracion), MD: M, C, PP: A, MR: Q },
      operation:
        `C = 0\nPP = ${'0'.repeat(n)}\nMR = ${Q_init}\nMD = ${M}`,
      explanation:
        `Inicializamos el acumulador PP = ${'0'.repeat(n)} y el carry C = 0.\n` +
        `MD = ${M} (multiplicando = ${M_dec}₁₀)\n` +
        `MR = ${Q_init} (multiplicador = ${Q_dec}₁₀)\n` +
        `Se realizarán ${n} iteraciones (una por cada bit de MR: en cada paso se procesa un bit del multiplicador).`,
      highlight: {}
    });

    for (let i = 1; i <= n; i++) {
      const MR0 = Q[n - 1]; // bit menos significativo de MR

      if (MR0 === '1') {
        // --- Paso de suma (fila separada) ---
        const prevA = A, prevC = C;
        const addRes = B.binaryAddWithCarry(A, M, 0);
        A = addRes.result;
        C = addRes.cout.toString();

        steps.push({
          stepNumber: steps.length,
          title: 'PP=PP+MD (MR₀=1)',
          registers: { Iteración: String(iteracion), MD: M, C, PP: A, MR: Q },
          operation:
            `MR₀=1 → PP=PP+MD\n` +
            `${prevC}:${prevA}+${M}\n` +
            `= ${C}:${A}`,
          explanation:
            `MR₀=1: sumamos MD al acumulador PP.\n` +
            `PP = ${prevA} + ${M} = ${A}, carry C = ${C}.`,
          highlight: { MR: [n - 1], PP: 'all', C: [] }
        });

        // --- Paso de desplazamiento ---
        const prevC2 = C, prevA2 = A, prevQ = Q;
        const shifted = B.shiftRightCAQ(C, A, Q);
        C = shifted.C; A = shifted.A; Q = shifted.Q;

        steps.push({
          stepNumber: steps.length,
          title: 'Desp. dcha. C,PP,MR. Iteración--',
          registers: { Iteración: String(iteracion), MD: M, C, PP: A, MR: Q },
          operation:
            `Desp. dcha. C:PP:MR\n` +
            `${prevC2}:${prevA2}:${prevQ}\n` +
            `→ ${C}:${A}:${Q}`,
          explanation:
            `Desplazamos C:PP:MR un bit a la derecha (aritmético).\n` +
            `El bit que sale por la derecha de MR se descarta.\n` +
            `Iteración: ${iteracion} → ${iteracion - 1}`,
          highlight: {}
        });
        iteracion--;

      } else {
        // --- MR₀=0: combinar en una sola fila (sin suma + desp.) ---
        const prevC = C, prevA = A, prevQ = Q;
        const shifted = B.shiftRightCAQ(C, A, Q);
        C = shifted.C; A = shifted.A; Q = shifted.Q;

        steps.push({
          stepNumber: steps.length,
          title: 'MR₀=0 → Desp. dcha. C,PP,MR. Iteración--',
          registers: { Iteración: String(iteracion), MD: M, C, PP: A, MR: Q },
          operation:
            `MR₀=0, Desp. dcha. C:PP:MR\n` +
            `${prevC}:${prevA}:${prevQ}\n` +
            `→ ${C}:${A}:${Q}`,
          explanation:
            `MR₀=0: no sumamos MD.\n` +
            `Desplazamos C:PP:MR un bit a la derecha.\n` +
            `Iteración: ${iteracion} → ${iteracion - 1}`,
          highlight: { MR: [n - 1] }
        });
        iteracion--;
      }
    }

    const result_bin = A + Q;
    const result_dec = B.binToDecUnsigned(result_bin);

    steps.push({
      stepNumber: steps.length,
      title: 'Resultado Final',
      registers: { Iteración: String(iteracion), MD: M, C, PP: A, MR: Q },
      operation: `PP:MR = ${A}:${Q}\n= ${result_bin}₂ = ${result_dec}₁₀`,
      explanation:
        `Después de ${n} iteraciones, el resultado queda en PP:MR.\n` +
        `${M} × ${Q_init} = ${M_dec} × ${Q_dec} = ${result_dec}.\n` +
        `Binario: ${result_bin} (${2 * n} bits).`,
      highlight: { PP: 'all', MR: 'all' },
      isResult: true,
      result: {
        binary: result_bin,
        decimal: result_dec,
        PP: A, MR: Q,
        M_dec, Q_dec
      }
    });

    return { valid: true, steps, n, M, Q: Q_init, M_dec, Q_dec };
  }

  return { compute };
})();
