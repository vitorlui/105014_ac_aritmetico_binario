// Manual de uso — contenido en Markdown
window.AC = window.AC || {};

window.AC.Help = {
  content: `
# Manual de Uso — Procesamiento Aritmético

> **Arquitectura de Computadores · Universitat de Lleida, Campus Igualada**
> Dr. Vitor Luiz da Silva Verbel

---

## 1. Navegación general

La aplicación se divide en cuatro bloques temáticos accesibles desde el **menú lateral izquierdo**:

- **2. Sumadores** — semi-sumador, sumador completo, paralelo y carry anticipado (CLA).
- **3. Multiplicación y División** — algoritmos clásicos y paso a paso.
- **4. Punto Flotante** — representación IEEE 754, suma/resta y multiplicación/división.
- **Ejercicios** — banco de problemas con solución guiada.

En pantallas pequeñas el menú se oculta; pulsa el botón **☰** (arriba a la izquierda) para abrirlo.

---

## 2. Sumadores

### 2.1 Suma y resta binaria

Repaso teórico de las operaciones básicas: suma directa, complemento a 1 (C₁) y complemento a 2 (C₂).

Introduce un valor binario en el campo **A** (hasta 8 bits) y pulsa **Calcular** para ver C₁(A), C₂(A) y la tabla de verdad del semi-sumador.

---

### 2.2 Semi-sumador

Muestra la tabla de verdad del semi-sumador (HA): entradas A, B → salidas Suma (S) y Acarreo (Cout).

No hay campos de entrada; la tabla se genera automáticamente.

---

### 2.3 Sumador completo

Igual que el semi-sumador pero con tres entradas (A, B, Cin). Muestra todas las combinaciones posibles.

---

### 2.4 Calculadora — Sumador paralelo

**Entradas:** dos números binarios A y B (hasta 16 bits cada uno).

1. Escribe A y B en los campos correspondientes.
2. Pulsa **Inicializar** para empezar el modo **paso a paso**.
3. Navega con los botones **◀ Anterior** / **Siguiente ▶**.
4. Pulsa **Resolver completo** para ver la tabla completa de una vez.

Cada fila de la tabla muestra la posición del bit, los valores A[i], B[i], Cin, la suma parcial S y el acarreo Cout.

El último paso indica si hay **overflow** y la latencia total (2n·T).

---

### 2.5 Carry anticipado (CLA) — Teoría

Página teórica sobre el sumador con carry anticipado: fórmulas de generadores (Gᵢ), propagadores (Pᵢ), carries anticipados (Cᵢ) y sumas (Sᵢ). Latencia constante de **6T** independientemente del número de bits.

---

### 2.6 Calculadora — Carry anticipado (CLA)

**Entradas:** A (binario), B (binario), C₀ (carry de entrada: 0 o 1). Soporta de 1 a 16 bits.

Los pasos muestran:
1. Inicialización
2. Generadores Gᵢ = Aᵢ · Bᵢ (2T)
3. Propagadores Pᵢ = Aᵢ ⊕ Bᵢ (2T)
4. Carries anticipados Cᵢ₊₁ = Gᵢ + Pᵢ·Cᵢ (2T)
5. Sumas Sᵢ = Pᵢ ⊕ Cᵢ (2T)
6. Resultado final

Los **botones de ejemplo** en la parte inferior cargan valores precargados para comenzar rápidamente.

---

## 3. Multiplicación y División

### 3.1 Multiplicación clásica por productos parciales

Página teórica. Muestra el método manual de multiplicación binaria con desplazamiento y suma de productos parciales.

---

### 3.2 Calculadora — Multiplicación 1

Algoritmo basado en desplazamiento del registro Q y acumulación en A.

**Entradas:** M (multiplicando) y Q (multiplicador), ambos en binario (hasta 8 bits).

Los registros mostrados en cada paso son **M**, **Q** y **Resultado** parcial.

---

### 3.3 Calculadora — Multiplicación 2 (C, A, Q, M)

Algoritmo de multiplicación con registros C (acarreo), A (acumulador), Q (multiplicador) y M (multiplicando).

**Entradas:** M y Q en binario.

Cada paso muestra el estado de los cuatro registros y la operación realizada (suma + desplazamiento).

---

### 3.4 Calculadora — División con restauración

**Entradas:** Q (dividendo) y M (divisor) en binario (hasta 8 bits).

El algoritmo sigue el método de **restauración**: en cada iteración resta M de A y, si el resultado es negativo, restaura A sumando M de nuevo.

Los registros mostrados son **A**, **Q** y **M**.

---

## 4. Punto Flotante IEEE 754

### 4.1 Representación IEEE 754

Convierte un número decimal (o binario) al formato IEEE 754 con cualquier configuración S-E-M.

#### Campos de entrada

| Campo | Descripción |
|---|---|
| Tipo de entrada | Decimal, Binario con punto o Binario × 2ⁿ |
| Valor | El número a convertir |
| Formato rápido | Simple (1-8-23), Media (1-5-10), Doble (1-11-52) o formatos custom |
| Bits de exponente | Número de bits del campo exponente |
| Bits de mantisa | Número de bits del campo mantisa |
| Sesgo (bias) | Valor del sesgo; IEEE: 2^(E-1)−1 |

#### Pasos del algoritmo

1. **Signo** — bit 0 (positivo) o 1 (negativo).
2. **Conversión** — número decimal → binario con punto.
3. **Normalización** — forma 1.xxx × 2^n.
4. **Exponente con sesgo** — E_biased = n + bias, convertido a binario.
5. **Ensamblado** — concatenar [S][Exp][Mantisa].
6. **Resultado** — bits finales y verificación inversa opcional.

#### Verificación inversa

Si la casilla **"Verificar con conversión inversa"** está marcada (por defecto), al resolver se muestra la tabla completa de la conversión inversa (flotante → decimal) y se indica si hay **imprecisión de representación** (error ≠ 0).

#### Exportar PDF

Pulsa **Exportar PDF** (visible en la vista "Tabla completa") para abrir una ventana con la tabla lista para imprimir o guardar como PDF desde el diálogo del navegador.

---

### 4.2 Suma / Resta en Punto Flotante

Opera dos números en cualquier formato IEEE 754.

#### Tipos de entrada

- **Decimal** — ej. \`1.5\`
- **Binario con punto** — ej. \`1.1\` (representa 1.1₂)
- **Binario × 2ⁿ** — ej. \`1.1e0\` (representa 1.1₂ × 2⁰)
- **IEEE 754 binario** — ej. \`0-01111111-10000000000000000000000\`
  - Formato: **Signo-Exponente-Mantisa** separados por guión.
  - Al escribir el número, la aplicación detecta automáticamente el número de bits y actualiza los campos de formato.

#### Pasos del algoritmo

1. **Representar y descomponer** — convierte cada operando y muestra S, E (binario + valor real), M.
2. **Comparar exponentes** — calcula exp real de cada uno y muestra el desplazamiento necesario (antes/después).
3. **Bit oculto y alineación** — añade el 1 implícito a cada mantisa y aplica el desplazamiento.
4. **Suma/Resta de mantisas** — operación con signo de los valores alineados.
5. **Normalizar** — ajusta a la forma 1.xxx × 2^n.
6. **Resultado final** — [S][Exp][Mantisa] y valor decimal.

---

### 4.3 Multiplicación / División en Punto Flotante

Opera dos números en cualquier formato IEEE 754.

#### Pasos del algoritmo

1. **Representar y descomponer** — S, E y M de cada operando.
2. **Signo del resultado** — S₁ XOR S₂.
3. **Exponentes** — suma (×) o resta (÷) de los exponentes reales.
4. **Mantisas** — multiplica o divide las mantisas con bit 1 oculto.
5. **Normalizar** — ajusta a 1.xxx × 2^n.
6. **Resultado final** — [S][Exp][Mantisa].

---

## 5. Ejercicios

El banco de ejercicios agrupa problemas por categoría. Selecciona un tema en el desplegable.

Para cada ejercicio:
1. Lee el enunciado.
2. Pulsa **Mostrar solución** para ver la resolución paso a paso en formato tabla.

Los ejercicios están diseñados para repasar los algoritmos vistos en las secciones anteriores.

---

## 6. Consejos de uso

- **Paso a paso vs. Tabla completa** — usa "Paso a paso" para entender el algoritmo y "Tabla completa" para revisar o exportar.
- **Botones de ejemplo** — cada calculadora tiene ejemplos precargados. Úsalos para explorar el funcionamiento antes de introducir tus propios valores.
- **Formato de entrada** — los campos de texto aceptan solo bits (0 y 1); cualquier carácter inválido provoca un mensaje de error.
- **Overflow en sumadores** — si el carry final del sumador paralelo es 1, el resultado no cabe en n bits y se señala como overflow.
- **Imprecisión en flotante** — números como 0.1 o 0.3 no tienen representación exacta en binario. La casilla de verificación inversa lo detecta y muestra el error.
- **Exportar PDF** — disponible en la vista "Tabla completa" de todas las calculadoras de punto flotante.

---

*Manual generado para la asignatura Arquitectura de Computadores — UdL, Campus Igualada.*
`
};
