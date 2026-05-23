// Multiplicación binaria — Algoritmo 2n bits
// Registros: MD (2n bits), PP (2n bits), MR (n bits), Iteración (contador)
window.AC = window.AC || {};

window.AC.Multiply1 = (function () {

  function compute(MD_str, MR_str) {
    const B = window.AC.Binary;

    if (!B.isValidBinary(MD_str) || !B.isValidBinary(MR_str)) {
      return { valid: false, error: 'Las entradas deben contener solo bits (0 y 1).', steps: [] };
    }

    const n = Math.max(MD_str.length, MR_str.length);
    const MD_init = MD_str.padStart(n, '0');
    const MR_init = MR_str.padStart(n, '0');

    const MD_dec = B.binToDecUnsigned(MD_init);
    const MR_dec = B.binToDecUnsigned(MR_init);
    const steps  = [];

    // Estado inicial
    let MD     = '0'.repeat(n) + MD_init; // 2n bits: ceros || multiplicando
    let PP     = '0'.repeat(2 * n);        // 2n bits
    let MR     = MR_init;                  // n bits
    let cuenta = n;

    // Paso 0: Inicialización
    steps.push({
      stepNumber: 0,
      title: 'Inicialización',
      registers: { Iteración: String(cuenta), MD, PP, MR },
      operation:
        `MD = ${'0'.repeat(n)} || ${MD_init} = ${MD}  (${MD_dec}₁₀)\n` +
        `PP = ${PP}\n` +
        `MR = ${MR}  (${MR_dec}₁₀)\n` +
        `Iteración = ${cuenta}`,
      explanation:
        `Inicializamos los registros:\n` +
        `  MD (2n=${2*n} bits) = ceros (${n} bits) + multiplicando = ${MD}\n` +
        `  PP (2n=${2*n} bits) = todo ceros (acumulador)\n` +
        `  MR (n=${n} bits) = multiplicador = ${MR}\n` +
        `  Iteración = n = ${n} (una iteración por cada bit de MR: procesamos un bit del multiplicador en cada paso)`,
      highlight: {}
    });

    // n iteraciones
    for (let iter = 0; iter < n; iter++) {
      const MR0 = MR[n - 1]; // LSB de MR

      if (MR0 === '1') {
        // --- Paso de suma (fila separada) ---
        const addRes = B.binaryAdd(PP, MD);
        PP = addRes.result;

        steps.push({
          stepNumber: steps.length,
          title: 'MR₀=1 → PP=PP+MD',
          registers: { Iteración: String(cuenta), MD, PP, MR },
          operation: `MR₀=1 → PP=PP+MD\nPP = ${PP}`,
          explanation:
            `El bit menos significativo de MR es 1.\n` +
            `Sumamos MD al acumulador PP: PP ← PP + MD = ${PP}`,
          highlight: { PP: 'all', MR: [n - 1] }
        });

        // --- Paso de desplazamiento ---
        const prevMD = MD, prevMR = MR;
        MD     = MD.slice(1) + '0';
        MR     = '0' + MR.slice(0, n - 1);

        steps.push({
          stepNumber: steps.length,
          title: 'Desp. Izq. MD, Desp. Dcha. MR. Iteración--',
          registers: { Iteración: String(cuenta), MD, PP, MR },
          operation:
            `MD << 1: ${prevMD} → ${MD}\n` +
            `MR >> 1: ${prevMR} → ${MR}\n` +
            `Iteración: ${cuenta} → ${cuenta - 1}`,
          explanation:
            `MD desplaza a la izquierda (×2, se pierde MSB).\n` +
            `MR desplaza a la derecha (÷2, se descarta MR₀).\n` +
            `Iteración: ${cuenta} → ${cuenta - 1}`,
          highlight: { MD: 'all', MR: 'all' }
        });
        cuenta--;

      } else {
        // --- MR₀=0: combinar en una sola fila (desp. inmediato, sin suma) ---
        const prevMD = MD, prevMR = MR;
        MD     = MD.slice(1) + '0';
        MR     = '0' + MR.slice(0, n - 1);

        steps.push({
          stepNumber: steps.length,
          title: 'MR₀=0 → Desp. Izq. MD, Desp. Dcha. MR. Iteración--',
          registers: { Iteración: String(cuenta), MD, PP, MR },
          operation:
            `MR₀=0 → no suma\n` +
            `MD << 1: ${prevMD} → ${MD}\n` +
            `MR >> 1: ${prevMR} → ${MR}\n` +
            `Iteración: ${cuenta} → ${cuenta - 1}`,
          explanation:
            `MR₀=0: no sumamos MD.\n` +
            `MD desplaza a la izquierda y MR a la derecha.\n` +
            `Iteración: ${cuenta} → ${cuenta - 1}`,
          highlight: { MD: 'all', MR: 'all' }
        });
        cuenta--;
      }
    }

    // Resultado final
    const result_dec = MD_dec * MR_dec;

    steps.push({
      stepNumber: steps.length,
      title: 'Resultado',
      registers: { Iteración: String(cuenta), MD, PP, MR },
      operation: `PP = ${PP}\n= ${result_dec}₁₀`,
      explanation:
        `Iteración = 0: algoritmo finalizado.\n` +
        `Resultado: PP = ${PP}₂ = ${result_dec}₁₀\n` +
        `Verificación: ${MD_dec} × ${MR_dec} = ${result_dec}`,
      highlight: { PP: 'all' },
      isResult: true,
      result: { binary: PP, decimal: result_dec, MD_dec, MR_dec }
    });

    return { valid: true, steps, n, MD: MD_init, MR: MR_init, MD_dec, MR_dec };
  }

  return { compute };
})();
