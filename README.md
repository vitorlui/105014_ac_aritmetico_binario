# Procesamiento Aritmético — Arquitectura de Computadores

Herramienta educativa interactiva para la asignatura **Arquitectura de Computadores** de la **Universitat de Lleida · Campus Igualada**. Permite ejecutar algoritmos de aritmética binaria paso a paso, con explicaciones didácticas en cada etapa.

**🌐 Acceso online:** https://vitorlui.github.io/105014_ac_aritmetico_binario/

---

## Contenido

### 2. Sumadores
| Sección | Descripción |
|---------|-------------|
| 2.1 Calculadora CLA | Suma paso a paso con carry look-ahead (CLA) |

### 3. Multiplicación y División
| Sección | Descripción |
|---------|-------------|
| 3.1 Multiplicación 2n bits | Algoritmo de productos parciales con registros MD, PP, MR |
| 3.3 Multiplicación n bits | Algoritmo 2 con registros C:PP:MR:MD |
| 3.4 División con restauración | Algoritmo iterativo con registros A, Q, M |

### 4. Punto Flotante (IEEE 754)
| Sección | Descripción |
|---------|-------------|
| 4.1 Representación | Conversión decimal ↔ IEEE 754 con redondeo round-to-nearest-even |
| 4.2 Suma / Resta | Algoritmo de suma/resta en coma flotante paso a paso |
| 4.3 Multiplicación / División | Algoritmo de mult./div. en coma flotante |

### Ejercicios
Banco de problemas organizados por tema para practicar.

---

## Características

- **Paso a paso**: avanza de un paso en otro con los botones Anterior / Siguiente
- **Tabla completa**: visualiza todos los pasos de una vez en formato tabla
- **Exportar PDF**: genera un documento imprimible con cabecera adaptada a cada calculadora
- **Copiar tabla**: copia el contenido al portapapeles
- **Ejemplos precargados**: valores de ejemplo para probar cada calculadora
- **Verificación IEEE 754**: comprobación inversa (flotante → decimal) con cálculo de error de precisión
- **Formatos configurables**: IEEE 754 simple (1-8-23), doble (1-11-52) y formatos personalizados S-E-M
- **Responsive**: funciona en escritorio y móvil

---

## Uso local

No requiere servidor ni instalación. Basta con abrir `index.html` en cualquier navegador moderno:

```
Doble clic en index.html
```

O desde terminal:

```bash
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

---

## Tecnología

- HTML5 + CSS3 + JavaScript ES6 puro — sin frameworks ni dependencias externas
- Arquitectura de módulos bajo el namespace `window.AC`
- Enrutador basado en hash (`#seccion/subseccion`)
- Desplegado en GitHub Pages (rama `master`)

### Estructura de ficheros

```
AC Aritmetico/
├── index.html                        ← Punto de entrada
├── css/
│   └── styles.css
├── js/
│   ├── utils/
│   │   ├── binary.js                 ← Aritmética binaria (AC.Binary)
│   │   └── format.js                 ← Renderizado HTML (AC.Format)
│   ├── modules/
│   │   ├── adders.js                 ← Sumadores (AC.Adders)
│   │   ├── carryLookahead.js         ← CLA didáctico
│   │   ├── multiplication1.js        ← Mult. 2n bits (AC.Multiply1)
│   │   ├── multiplication2.js        ← Mult. n bits — Alg. 2 (AC.Multiply2)
│   │   ├── divisionRestoring.js      ← División con restauración
│   │   ├── floatingRepresentation.js ← Conversión IEEE 754 (AC.FloatRepr)
│   │   ├── floatingAddSub.js         ← Suma/Resta flotante
│   │   └── floatingMulDiv.js         ← Mult./Div. flotante
│   ├── exercises.js                  ← Banco de ejercicios
│   ├── router.js                     ← Enrutador hash
│   └── app.js                        ← Controlador principal y vistas
└── docs/
    └── *.pdf                         ← Materiales de referencia
```

---

## Autor

**Dr. Vitor Luiz da Silva Verbel**  
Universitat de Lleida · Campus Igualada  
Asignatura: Arquitectura de Computadores (105014)

---

## Licencia

[![CC BY-ND 4.0](https://licensebuttons.net/l/by-nd/4.0/88x31.png)](https://creativecommons.org/licenses/by-nd/4.0/)

Este trabajo está bajo una licencia **[Creative Commons Atribución-SinDerivadas 4.0 Internacional (CC BY-ND 4.0)](https://creativecommons.org/licenses/by-nd/4.0/)**.

**Puedes:**
- Copiar y redistribuir el material en cualquier medio o formato

**Bajo las siguientes condiciones:**
- **Atribución** — Debes dar crédito al autor (Dr. Vitor Luiz da Silva Verbel, Universitat de Lleida), proporcionar un enlace a la licencia e indicar si se han realizado cambios.
- **Sin Derivadas** — Si modificas o transformas el material, no puedes distribuir la versión modificada sin permiso explícito del autor.

© 2026 Dr. Vitor Luiz da Silva Verbel
