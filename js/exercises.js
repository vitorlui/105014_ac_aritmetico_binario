// Banco de ejercicios organizado por tema
window.AC = window.AC || {};

window.AC.Exercises = [
  // ===== SUMA Y RESTA BINARIA =====
  {
    id: 'sum_bin_01',
    topic: 'suma_resta',
    topicLabel: 'Suma y Resta Binaria',
    title: 'Suma binaria de 4 bits',
    statement: 'Realiza la suma binaria de los números 0110₂ (6) y 0101₂ (5). Muestra el carry en cada posición.',
    inputs: { A: '0110', B: '0101' },
    solveWith: 'parallelAdder',
    hint: 'Suma bit a bit de derecha a izquierda. Cuando la suma en una columna supera 1, genera carry.'
  },
  {
    id: 'sum_bin_02',
    topic: 'suma_resta',
    topicLabel: 'Suma y Resta Binaria',
    title: 'Suma con overflow de 4 bits',
    statement: 'Suma 1100₂ (12) + 0111₂ (7) en 4 bits. ¿Se produce overflow?',
    inputs: { A: '1100', B: '0111' },
    solveWith: 'parallelAdder',
    hint: 'El resultado (19) no cabe en 4 bits sin signo. El carry final es 1 → overflow.'
  },
  // ===== SUMADORES =====
  {
    id: 'adder_parallel_01',
    topic: 'sumadores',
    topicLabel: 'Sumadores',
    title: 'Sumador paralelo de 4 bits',
    statement: 'Usa el sumador paralelo para sumar 1010₂ (10) y 0110₂ (6). Muestra cada sumador completo y la propagación del carry. Calcula también la latencia.',
    inputs: { A: '1010', B: '0110' },
    solveWith: 'parallelAdder',
    hint: 'Latencia = 2n·T = 8T para n=4. Cada sumador completo procesa 2T.'
  },
  {
    id: 'adder_parallel_02',
    topic: 'sumadores',
    topicLabel: 'Sumadores',
    title: 'Sumador paralelo de 8 bits',
    statement: 'Suma 11001010₂ (202) + 00110101₂ (53). ¿Cuánto tarda el sumador paralelo de 8 bits?',
    inputs: { A: '11001010', B: '00110101' },
    solveWith: 'parallelAdder',
    hint: 'Para n=8 bits, latencia = 2×8 = 16T.'
  },
  // ===== CARRY ANTICIPADO =====
  {
    id: 'carry_la_01',
    topic: 'carry_anticipado',
    topicLabel: 'Carry Anticipado',
    title: 'Sumador con carry anticipado — 1011 + 0110',
    statement: 'Usa el sumador con carry anticipado para sumar 1011₂ (11) y 0110₂ (6). Muestra Gᵢ, Pᵢ, todos los carries anticipados C₁..C₄ y las sumas Sᵢ. Compara la latencia con el sumador paralelo.',
    inputs: { A: '1011', B: '0110', C0: '0' },
    solveWith: 'carryLookahead',
    hint: 'Carry anticipado = 6T vs paralelo = 8T para 4 bits. La diferencia se amplía con más bits.'
  },
  {
    id: 'carry_la_02',
    topic: 'carry_anticipado',
    topicLabel: 'Carry Anticipado',
    title: 'Carry anticipado con C₀ = 1',
    statement: 'Suma 1001₂ + 0111₂ con carry de entrada C₀ = 1. Calcula los propagadores, generadores y carries anticipados.',
    inputs: { A: '1001', B: '0111', C0: '1' },
    solveWith: 'carryLookahead',
    hint: 'C₁ = G₀ + P₀·C₀. Cuando C₀ = 1, puede propagarse por toda la cadena si todos Pᵢ = 1.'
  },
  // ===== MULTIPLICACIÓN =====
  {
    id: 'mult1_01',
    topic: 'multiplicacion',
    topicLabel: 'Multiplicación',
    title: 'Multiplicación clásica 9 × 10',
    statement: 'Multiplica 1001₂ (9) × 1010₂ (10) usando el método de productos parciales. Muestra cada fila desplazada.',
    inputs: { M: '1001', Q: '1010' },
    solveWith: 'multiply1',
    hint: 'Hay 4 productos parciales (uno por bit del multiplicador). Dos son 0 y dos son M desplazado.'
  },
  {
    id: 'mult2_01',
    topic: 'multiplicacion',
    topicLabel: 'Multiplicación',
    title: 'Multiplicación Algoritmo 2 — 9 × 10',
    statement: 'Multiplica M = 1001₂ (9) por Q = 1010₂ (10) usando el Algoritmo 2 con registros C, A, Q, M. El resultado debe quedar en A:Q.',
    inputs: { M: '1001', Q: '1010' },
    solveWith: 'multiply2',
    hint: 'En cada iteración: si Q₀=1 suma M a A, luego desplaza C:A:Q a la derecha. Resultado en A:Q = 01011010 = 90.'
  },
  {
    id: 'mult2_02',
    topic: 'multiplicacion',
    topicLabel: 'Multiplicación',
    title: 'Multiplicación Algoritmo 2 — 5 × 3',
    statement: 'Multiplica M = 0101₂ (5) por Q = 0011₂ (3) usando el Algoritmo 2. Verifica que el resultado en A:Q sea 00001111₂ = 15.',
    inputs: { M: '0101', Q: '0011' },
    solveWith: 'multiply2',
    hint: 'Cuando Q₀=1 en las dos primeras iteraciones, se suma M a A dos veces (en distintos desplazamientos).'
  },
  // ===== DIVISIÓN =====
  {
    id: 'div_rest_01',
    topic: 'division',
    topicLabel: 'División con Restauración',
    title: 'División con restauración — 14 ÷ 2',
    statement: 'Divide Q = 1110₂ (14) entre M = 0010₂ (2) usando el algoritmo de división con restauración. Cociente en Q, residuo en A.',
    inputs: { Q: '1110', M: '0010' },
    solveWith: 'divisionRestoring',
    hint: 'Resultado esperado: cociente = 0111 (7), residuo = 0000 (0). 14 ÷ 2 = 7 sin resto.'
  },
  {
    id: 'div_rest_02',
    topic: 'division',
    topicLabel: 'División con Restauración',
    title: 'División con restauración — 11 ÷ 3',
    statement: 'Divide Q = 1011₂ (11) entre M = 0011₂ (3) usando el algoritmo de división con restauración. Indica cuándo hay restauración y cuándo no.',
    inputs: { Q: '1011', M: '0011' },
    solveWith: 'divisionRestoring',
    hint: 'Resultado esperado: cociente = 0011 (3), residuo = 0010 (2). 11 ÷ 3 = 3 con resto 2.'
  },
  // ===== REPRESENTACIÓN EN PUNTO FLOTANTE =====
  {
    id: 'float_repr_01',
    topic: 'float_repr',
    topicLabel: 'Representación en Punto Flotante',
    title: 'Representar 1.375 en formato 1-4-7 (bias=7)',
    statement: 'Convierte el número decimal 1.375 al formato de coma flotante con 1 bit de signo, 4 bits de exponente y 7 bits de mantisa (bias=7). Muestra todos los pasos.',
    inputs: { decimal: '1.375', signBits: 1, expBits: 4, mantBits: 7, bias: 7 },
    solveWith: 'floatRepr',
    hint: '1.375 = 1.011₂ × 2⁰. Exponente biased = 0 + 7 = 7 = 0111₂. Mantisa = 0110000.'
  },
  {
    id: 'float_repr_02',
    topic: 'float_repr',
    topicLabel: 'Representación en Punto Flotante',
    title: 'Representar -0.75 en formato 1-4-5 (bias=7)',
    statement: 'Convierte -0.75 al formato de coma flotante con 1 bit de signo, 4 bits de exponente y 5 bits de mantisa (bias=7).',
    inputs: { decimal: '-0.75', signBits: 1, expBits: 4, mantBits: 5, bias: 7 },
    solveWith: 'floatRepr',
    hint: '0.75 = 0.11₂ = 1.1 × 2⁻¹. Signo=1. Exponente biased = -1+7=6=0110₂. Mantisa=10000.'
  },
  // ===== SUMA EN PUNTO FLOTANTE =====
  {
    id: 'float_add_01',
    topic: 'float_addsub',
    topicLabel: 'Suma/Resta en Punto Flotante',
    title: 'Suma en punto flotante — 0.3 + 1.6 (formato 1-4-5)',
    statement: 'Suma 0.3 + 1.6 en el formato de coma flotante con 1 bit de signo, 4 bits de exponente y 5 bits de mantisa (bias=7). Explica si hay pérdida de precisión.',
    inputs: { dec1: '0.3', dec2: '1.6', op: 'add', signBits: 1, expBits: 4, mantBits: 5, bias: 7 },
    solveWith: 'floatAddSub',
    hint: '0.3 y 1.6 no tienen representación binaria exacta. Al alinear mantisas se pierden bits. El resultado aproximado es ≈ 1.875.'
  },
  {
    id: 'float_add_02',
    topic: 'float_addsub',
    topicLabel: 'Suma/Resta en Punto Flotante',
    title: 'Resta en punto flotante — 1.5 − 0.25 (formato 1-4-7)',
    statement: 'Calcula 1.5 − 0.25 en formato 1-4-7 (bias=7). ¿Es el resultado exacto?',
    inputs: { dec1: '1.5', dec2: '0.25', op: 'sub', signBits: 1, expBits: 4, mantBits: 7, bias: 7 },
    solveWith: 'floatAddSub',
    hint: 'Ambos números tienen representación binaria exacta. El resultado 1.25 también es exacto en este formato.'
  },
  // ===== MULTIPLICACIÓN EN PUNTO FLOTANTE =====
  {
    id: 'float_mul_01',
    topic: 'float_muldiv',
    topicLabel: 'Multiplicación/División en Punto Flotante',
    title: 'Multiplicación en punto flotante — 1.5 × 2.0 (formato 1-4-7)',
    statement: 'Multiplica 1.5 × 2.0 en formato 1-4-7 (bias=7). Suma los exponentes y multiplica las mantisas.',
    inputs: { dec1: '1.5', dec2: '2.0', op: 'mul', signBits: 1, expBits: 4, mantBits: 7, bias: 7 },
    solveWith: 'floatMulDiv',
    hint: '1.5 × 2.0 = 3.0. Exponentes: 0 + 1 = 1. Mantisas: 1.1 × 1.0 = 1.1.'
  },
  {
    id: 'float_div_01',
    topic: 'float_muldiv',
    topicLabel: 'Multiplicación/División en Punto Flotante',
    title: 'División en punto flotante — 3.0 ÷ 1.5 (formato 1-4-7)',
    statement: 'Divide 3.0 ÷ 1.5 en formato 1-4-7 (bias=7). Resta los exponentes y divide las mantisas.',
    inputs: { dec1: '3.0', dec2: '1.5', op: 'div', signBits: 1, expBits: 4, mantBits: 7, bias: 7 },
    solveWith: 'floatMulDiv',
    hint: '3.0 ÷ 1.5 = 2.0. Exponentes: 1 − 0 = 1. Mantisas: 1.1 ÷ 1.1 = 1.0.'
  }
];
