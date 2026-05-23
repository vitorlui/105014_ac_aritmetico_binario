// Algoritmo de división binaria sin signo con restauración
// Registros A (resto parcial), Q (dividendo → cociente), M (divisor)
window.AC = window.AC || {};

window.AC.DivisionRestoring = (function () {

  function compute(Q_str, M_str) {
    const B = window.AC.Binary;

    if (!B.isValidBinary(Q_str) || !B.isValidBinary(M_str)) {
      return { valid: false, error: 'Las entradas deben contener solo bits (0 y 1).', steps: [] };
    }

    const n = Math.max(Q_str.length, M_str.length);
    const Q_init = Q_str.padStart(n, '0');
    const M = M_str.padStart(n, '0');

    const Q_dec = B.binToDecUnsigned(Q_init);
    const M_dec = B.binToDecUnsigned(M);

    if (M_dec === 0) {
      return { valid: false, error: 'El divisor no puede ser cero.', steps: [] };
    }

    if (Q_dec < M_dec) {
      // Resultado sería 0 con residuo Q, pero procesamos igualmente
    }

    let A = '0'.repeat(n);
    let Q = Q_init;
    const steps = [];

    // Paso 0: Inicialización
    steps.push({
      stepNumber: 0,
      title: 'Inicialización',
      registers: { A, Q, M },
      operation: `A = ${'0'.repeat(n)}, Q = ${Q_init}, M = ${M}`,
      explanation: `Inicializamos el registro de resto parcial A = ${'0'.repeat(n)}. ` +
        `Q = ${Q_init} (dividendo = ${Q_dec}) y M = ${M} (divisor = ${M_dec}). ` +
        `Se realizarán ${n} iteraciones.`,
      highlight: {}
    });

    for (let i = 1; i <= n; i++) {
      // 1. Desplazamiento izquierda de A:Q
      const prevA = A, prevQ = Q;
      const shifted = B.shiftLeftAQ(A, Q);
      A = shifted.A;
      Q = shifted.Q;

      steps.push({
        stepNumber: steps.length,
        title: `Iteración ${i} — Desplazamiento izquierda`,
        registers: { A, Q, M },
        operation: `A:Q = ${prevA}:${prevQ} → ${A}:${Q}`,
        explanation: `Desplazamos conjuntamente A y Q un bit a la izquierda. ` +
          `El bit más significativo de Q pasa a A. Se introduce un 0 por la derecha de Q.`,
        highlight: {}
      });

      // 2. A = A - M
      const prevA2 = A;
      const subRes = B.binarySubtract(A, M);
      A = subRes.result;

      steps.push({
        stepNumber: steps.length,
        title: `Iteración ${i} — Resta A - M`,
        registers: { A, Q, M },
        operation: `A = ${prevA2} - ${M} = ${A}`,
        explanation: `Restamos el divisor M al registro A. ` +
          `${prevA2} - ${M} = ${A} (${B.isNegativeBin(A) ? 'negativo, MSB = 1' : 'no negativo, MSB = 0'}).`,
        highlight: { A: [0] }
      });

      // 3. Comprobación del signo
      if (B.isNegativeBin(A)) {
        // Restaurar A = A + M, Q0 = 0
        const negA = A;
        const restoreRes = B.binaryAdd(A, M);
        A = restoreRes.result;
        // Q0 = 0 (LSB de Q)
        Q = Q.slice(0, n - 1) + '0';

        steps.push({
          stepNumber: steps.length,
          title: `Iteración ${i} — Restauración (A < 0)`,
          registers: { A, Q, M },
          operation: `A = ${negA} + ${M} = ${A} (restaurado), Q₀ = 0`,
          explanation: `Como A ha quedado negativo (MSB = 1), restauramos sumando M a A: ` +
            `A = ${negA} + ${M} = ${A}. ` +
            `Ponemos Q₀ = 0, indicando que el divisor no cabe en este paso.`,
          highlight: { A: [0], Q: [n - 1] },
          action: 'restore'
        });
      } else {
        // Q0 = 1
        Q = Q.slice(0, n - 1) + '1';

        steps.push({
          stepNumber: steps.length,
          title: `Iteración ${i} — Sin restauración (A ≥ 0)`,
          registers: { A, Q, M },
          operation: `A = ${A} (no negativo), Q₀ = 1`,
          explanation: `A no es negativo (MSB = 0), por lo que el divisor sí cabe. ` +
            `No se restaura. Ponemos Q₀ = 1 en Q.`,
          highlight: { A: [0], Q: [n - 1] },
          action: 'no_restore'
        });
      }
    }

    const quotient_dec = B.binToDecUnsigned(Q);
    const remainder_dec = B.binToDecUnsigned(A);

    steps.push({
      stepNumber: steps.length,
      title: 'Resultado Final',
      registers: { A, Q, M },
      operation: `Cociente Q = ${Q} = ${quotient_dec}₁₀  |  Residuo A = ${A} = ${remainder_dec}₁₀`,
      explanation: `Después de ${n} iteraciones, el cociente se encuentra en Q y el residuo en A. ` +
        `${Q_dec} ÷ ${M_dec} = ${quotient_dec} (cociente) con residuo ${remainder_dec}. ` +
        `Verificación: ${quotient_dec} × ${M_dec} + ${remainder_dec} = ${quotient_dec * M_dec + remainder_dec} ` +
        `${quotient_dec * M_dec + remainder_dec === Q_dec ? '✓' : '(error)'}`,
      highlight: { A: 'all', Q: 'all' },
      isResult: true,
      result: {
        quotient: Q,
        remainder: A,
        quotient_dec,
        remainder_dec,
        Q_dec, M_dec
      }
    });

    return { valid: true, steps, n, Q: Q_init, M, Q_dec, M_dec };
  }

  return { compute };
})();
