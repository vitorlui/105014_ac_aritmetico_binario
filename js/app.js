// Aplicación principal — Procesamiento Aritmético
window.AC = window.AC || {};

(function () {
  'use strict';

  const R = window.AC.Router;
  const F = () => window.AC.Format;
  const content = () => document.getElementById('content');
  const pageTitle = () => document.getElementById('page-title');

  // ====== ESTADO GLOBAL DEL CALCULADOR ======
  const calcState = {
    steps: [],
    stepIndex: -1,
    mode: 'step', // 'step' o 'full'
    initialized: false,
    showExplanation: true  // toggle de columna explicación en la tabla
  };

  function resetCalc() {
    calcState.steps = [];
    calcState.stepIndex = -1;
    calcState.initialized = false;
  }

  // Normaliza separador decimal: acepta coma o punto
  function nd(str) { return (str || '').trim().replace(',', '.'); }

  // ====== UTILIDAD: renderiza HTML en #content ======
  function render(html, title) {
    content().innerHTML = html;
    if (title) pageTitle().textContent = title;
  }

  // ====== CONTROLADOR GENÉRICO DE CALCULADORA PASO A PASO ======
  function setupStepController(containerId, options) {
    const { steps, registerNames } = options;
    calcState.steps = steps;
    calcState.stepIndex = 0;
    calcState.initialized = true;

    renderStepView(containerId, registerNames);
    updateNavButtons(containerId);
  }

  function renderStepView(containerId, registerNames) {
    const step = calcState.steps[calcState.stepIndex];
    if (!step) return;

    const stepPanel = document.getElementById(containerId + '-step');
    if (stepPanel) {
      const esc = F().escapeHtml;
      const escNl = F().escNl;
      // Tabla acumulada: muestra todas las filas desde 0 hasta el paso actual
      const shown = calcState.steps.slice(0, calcState.stepIndex + 1);

      const hideExplClass = calcState.showExplanation ? '' : 'hide-explanation';
      let html = `<div class="accumulated-table ${hideExplClass}"><table class="algorithm-table"><thead><tr>`;
      html += '<th>#</th><th>Título</th>';
      registerNames.forEach(r => { html += `<th>${esc(r)}</th>`; });
      html += '<th>Operación</th><th>Explicación</th>';
      html += '</tr></thead><tbody>';

      shown.forEach((s, idx) => {
        const isCurrent = idx === calcState.stepIndex;
        const rowClass = [
          s.isResult ? 'row-result' : '',
          isCurrent ? 'row-current' : ''
        ].filter(Boolean).join(' ');

        html += `<tr class="${rowClass}">`;
        html += `<td class="mono">${s.stepNumber}</td>`;
        html += `<td class="title-cell">${esc(s.title)}</td>`;
        registerNames.forEach(reg => {
          const val = s.registers && s.registers[reg] !== undefined ? s.registers[reg] : '—';
          const isResultHl = s.isResult && s.highlight && s.highlight[reg] !== undefined;
          html += `<td class="mono${isResultHl ? ' td-result-hl' : ''}">${esc(val)}</td>`;
        });
        html += `<td class="mono step-op-cell">${escNl(s.operation || '')}</td>`;
        html += `<td class="explanation-cell">${escNl(s.explanation || '')}</td>`;
        html += '</tr>';
      });

      html += '</tbody></table></div>';

      // Panel de explicación arriba, tabla acumulada abajo
      const explanationHtml = `<div class="step-current-panel ${step.isResult ? 'step-current-panel--result' : ''}">
        <div class="step-current-header">
          <span class="badge-step">Paso ${step.stepNumber}</span>
          <strong>${esc(step.title)}</strong>
        </div>
        <div class="step-current-op">
          <span class="label-op">Operación:</span>
          <span class="mono">${escNl(step.operation || '')}</span>
        </div>
        <div class="step-current-expl">
          <span class="label-expl">Explicación:</span>
          <p>${escNl(step.explanation || '')}</p>
        </div>
      </div>`;

      // Toggle de explicación
      const toggleBar = `<div class="table-toggle-bar">
        <label class="toggle-expl-label">
          <input type="checkbox" id="${containerId}-show-expl" ${calcState.showExplanation ? 'checked' : ''}>
          Mostrar explicación en tabla
        </label>
      </div>`;

      // Explicación arriba, toggle + tabla abajo
      stepPanel.innerHTML = explanationHtml + toggleBar + html;

      // Binding dinámico del checkbox — no requiere re-render
      const toggleEl = document.getElementById(containerId + '-show-expl');
      if (toggleEl) {
        toggleEl.addEventListener('change', () => {
          calcState.showExplanation = toggleEl.checked;
          const tableEl = stepPanel.querySelector('.accumulated-table');
          if (tableEl) tableEl.classList.toggle('hide-explanation', !calcState.showExplanation);
        });
      }

      // Auto-scroll a la fila actual dentro de la tabla acumulada
      const currentRow = stepPanel.querySelector('tr.row-current');
      if (currentRow) {
        currentRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    const counter = document.getElementById(containerId + '-counter');
    if (counter) {
      counter.textContent = `Paso ${calcState.stepIndex + 1} de ${calcState.steps.length}`;
    }

    const progress = document.getElementById(containerId + '-progress');
    if (progress) {
      const pct = ((calcState.stepIndex + 1) / calcState.steps.length * 100).toFixed(0);
      progress.style.width = pct + '%';
    }
  }

  function updateNavButtons(containerId) {
    const btnPrev = document.getElementById(containerId + '-prev');
    const btnNext = document.getElementById(containerId + '-next');
    if (btnPrev) btnPrev.disabled = calcState.stepIndex <= 0;
    if (btnNext) btnNext.disabled = calcState.stepIndex >= calcState.steps.length - 1;
  }

  function bindStepControls(containerId, registerNames) {
    document.getElementById(containerId + '-prev')?.addEventListener('click', () => {
      if (calcState.stepIndex > 0) {
        calcState.stepIndex--;
        renderStepView(containerId, registerNames);
        updateNavButtons(containerId);
      }
    });
    document.getElementById(containerId + '-next')?.addEventListener('click', () => {
      if (calcState.stepIndex < calcState.steps.length - 1) {
        calcState.stepIndex++;
        renderStepView(containerId, registerNames);
        updateNavButtons(containerId);
      }
    });
    document.getElementById(containerId + '-reinit')?.addEventListener('click', () => {
      calcState.stepIndex = 0;
      renderStepView(containerId, registerNames);
      updateNavButtons(containerId);
    });
  }

  function showAlert(containerId, msg, type) {
    const el = document.getElementById(containerId + '-error');
    if (el) {
      el.innerHTML = `<div class="alert alert-${type || 'error'}">${F().escapeHtml(msg)}</div>`;
      el.style.display = 'block';
    }
  }

  function clearAlert(containerId) {
    const el = document.getElementById(containerId + '-error');
    if (el) { el.innerHTML = ''; el.style.display = 'none'; }
  }

  // ====== GENERADOR DE TABLA COMPLETA ======
  function renderFullTable(containerId, steps, registerNames) {
    const el = document.getElementById(containerId + '-table');
    if (el) {
      const backBtn = `<button class="btn btn-outline full-back-btn"
        onclick="document.querySelector('[data-tab=\\"${containerId}-tab-step\\"]').click()">
        ◀ Volver al paso a paso
      </button>`;
      const copyBtn = `<button class="copy-btn" onclick="copyTable('${containerId}-table-inner')">Copiar tabla</button>`;
      const pdfBtn  = `<button class="pdf-export-btn" onclick="exportFloatPDF('${containerId}')">Exportar PDF</button>`;
      el.innerHTML = backBtn + pdfBtn + copyBtn + `<div id="${containerId}-table-inner">` + F().renderAlgorithmTable(steps, registerNames) + '</div>';
    }
  }

  window.copyTable = function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    const text = el.innerText;
    navigator.clipboard.writeText(text).then(() => alert('Tabla copiada al portapapeles.')).catch(() => {});
  };

  window.exportFloatPDF = function (containerId) {
    const tableEl   = document.getElementById(containerId + '-table-inner');
    const reverseEl = document.getElementById(containerId + '-reverse');
    if (!tableEl || !tableEl.querySelector('table')) {
      alert('Primero pulsa "Resolver completo" para generar la tabla.');
      return;
    }

    function eid(suffix) { return document.getElementById(containerId + '-' + suffix); }
    function binDec(s) { return s && /^[01]+$/.test(s) ? parseInt(s, 2) : '—'; }

    const expBits   = eid('exp')?.value  || '?';
    const mantBits  = eid('mant')?.value || '?';
    const bias      = eid('bias')?.value || '?';
    const modeVal   = eid('mode')?.value || 'dec';
    const modeMap   = { dec: 'Decimal', binpoint: 'Binario (punto)', binsci: 'Binario (científico)', ieee754bin: 'IEEE 754 binario' };
    const modeLabel = modeMap[modeVal] || modeVal;
    const formatStr = `1-${expBits}-${mantBits} bits &nbsp;·&nbsp; Sesgo ${bias}`;

    const dec1El = eid('dec1');
    const decEl  = eid('dec');
    const mdEl   = eid('MD');
    const mrEl   = eid('MR');
    const mEl    = eid('M');
    const aEl    = eid('A');
    const c0El   = eid('C0');

    let pdfTitle, pdfH2, metaRows, h3Title;

    if (dec1El) {
      // Punto flotante: suma/resta o mult/div
      const op1  = dec1El.value || '—';
      const op2  = eid('dec2')?.value || '—';
      const opVal  = eid('op')?.value || 'add';
      const opName = opVal === 'sub' ? 'Resta (−)' : opVal === 'mul' ? 'Multiplicación (×)' : opVal === 'div' ? 'División (÷)' : 'Suma (+)';
      const opSym  = opVal === 'sub' ? '−' : opVal === 'mul' ? '×' : opVal === 'div' ? '÷' : '+';
      const sectionName = (opVal === 'mul' || opVal === 'div') ? 'Mult./Div. en Punto Flotante' : 'Suma/Resta en Punto Flotante';
      pdfTitle = `${sectionName} — ${op1} ${opSym} ${op2}`;
      pdfH2    = sectionName;
      h3Title  = 'Conversión paso a paso';
      metaRows =
        `<tr><td>Operación:</td><td>${F().escapeHtml(opName)}</td></tr>` +
        `<tr><td>Operando 1:</td><td>${F().escapeHtml(op1)}</td></tr>` +
        `<tr><td>Operando 2:</td><td>${F().escapeHtml(op2)}</td></tr>` +
        `<tr><td>Tipo de entrada:</td><td>${F().escapeHtml(modeLabel)}</td></tr>` +
        `<tr><td>Formato:</td><td>${formatStr}</td></tr>`;

    } else if (decEl) {
      // Punto flotante: representación
      const decVal = decEl.value || '—';
      pdfTitle = `Representación IEEE 754 — ${decVal}`;
      pdfH2    = 'Representación en Coma Flotante IEEE 754';
      h3Title  = 'Conversión paso a paso';
      metaRows =
        `<tr><td>Valor a convertir:</td><td>${F().escapeHtml(decVal)}</td></tr>` +
        `<tr><td>Tipo de entrada:</td><td>${F().escapeHtml(modeLabel)}</td></tr>` +
        `<tr><td>Formato:</td><td>${formatStr}</td></tr>`;

    } else if (mdEl) {
      // Multiplicación 2n bits (mult1): inputs MD y MR
      const mdVal = mdEl.value || '—';
      const mrVal = mrEl?.value || '—';
      const mdDec = binDec(mdVal);
      const mrDec = binDec(mrVal);
      const resDec = (typeof mdDec === 'number' && typeof mrDec === 'number') ? mdDec * mrDec : '—';
      pdfTitle = `Multiplicación 2n bits — ${mdVal}₂ × ${mrVal}₂`;
      pdfH2    = 'Multiplicación Binaria — Algoritmo 2n bits';
      h3Title  = 'Pasos del algoritmo';
      metaRows =
        `<tr><td>MD — Multiplicando:</td><td class="mono">${F().escapeHtml(mdVal)}₂ = ${mdDec}₁₀</td></tr>` +
        `<tr><td>MR — Multiplicador:</td><td class="mono">${F().escapeHtml(mrVal)}₂ = ${mrDec}₁₀</td></tr>` +
        `<tr><td>Resultado:</td><td>${mdDec} × ${mrDec} = ${resDec}₁₀</td></tr>`;

    } else if (mEl && !aEl) {
      // Multiplicación n bits (mult2) o División — ambas tienen M y Q
      const mVal = mEl.value || '—';
      const qVal = eid('Q')?.value || '—';
      const mDec = binDec(mVal);
      const qDec = binDec(qVal);
      if (containerId === 'div') {
        const cociente = (typeof qDec === 'number' && typeof mDec === 'number' && mDec !== 0) ? Math.floor(qDec / mDec) : '—';
        const residuo  = (typeof qDec === 'number' && typeof mDec === 'number' && mDec !== 0) ? qDec % mDec : '—';
        pdfTitle = `División con Restauración — ${qVal}₂ ÷ ${mVal}₂`;
        pdfH2    = 'División Binaria con Restauración';
        h3Title  = 'Pasos del algoritmo';
        metaRows =
          `<tr><td>Q — Dividendo:</td><td class="mono">${F().escapeHtml(qVal)}₂ = ${qDec}₁₀</td></tr>` +
          `<tr><td>M — Divisor:</td><td class="mono">${F().escapeHtml(mVal)}₂ = ${mDec}₁₀</td></tr>` +
          `<tr><td>Resultado:</td><td>Cociente = ${cociente}₁₀ &nbsp;·&nbsp; Residuo = ${residuo}₁₀</td></tr>`;
      } else {
        const resDec = (typeof mDec === 'number' && typeof qDec === 'number') ? mDec * qDec : '—';
        pdfTitle = `Multiplicación n bits — ${mVal}₂ × ${qVal}₂`;
        pdfH2    = 'Multiplicación Binaria — Algoritmo n bits (C:PP:MR:MD)';
        h3Title  = 'Pasos del algoritmo';
        metaRows =
          `<tr><td>MD — Multiplicando:</td><td class="mono">${F().escapeHtml(mVal)}₂ = ${mDec}₁₀</td></tr>` +
          `<tr><td>MR — Multiplicador:</td><td class="mono">${F().escapeHtml(qVal)}₂ = ${qDec}₁₀</td></tr>` +
          `<tr><td>Resultado:</td><td>${mDec} × ${qDec} = ${resDec}₁₀</td></tr>`;
      }

    } else if (aEl) {
      // Sumador Paralelo o Carry Anticipado — ambos tienen A y B
      const aVal   = aEl.value || '—';
      const bVal   = eid('B')?.value || '—';
      const c0Val  = c0El?.value || '0';
      const aDec   = binDec(aVal);
      const bDec   = binDec(bVal);
      const sumDec = (typeof aDec === 'number' && typeof bDec === 'number') ? aDec + bDec + parseInt(c0Val) : '—';
      if (c0El) {
        pdfTitle = `Carry Anticipado — ${aVal}₂ + ${bVal}₂ (C₀=${c0Val})`;
        pdfH2    = 'Sumador con Carry Anticipado';
        h3Title  = 'Pasos del algoritmo';
        metaRows =
          `<tr><td>A:</td><td class="mono">${F().escapeHtml(aVal)}₂ = ${aDec}₁₀</td></tr>` +
          `<tr><td>B:</td><td class="mono">${F().escapeHtml(bVal)}₂ = ${bDec}₁₀</td></tr>` +
          `<tr><td>C₀ (carry entrada):</td><td>${F().escapeHtml(c0Val)}</td></tr>` +
          `<tr><td>Resultado:</td><td>${aDec} + ${bDec} + ${c0Val} = ${sumDec}₁₀</td></tr>`;
      } else {
        pdfTitle = `Sumador Paralelo — ${aVal}₂ + ${bVal}₂`;
        pdfH2    = 'Sumador Paralelo';
        h3Title  = 'Pasos del algoritmo';
        metaRows =
          `<tr><td>A:</td><td class="mono">${F().escapeHtml(aVal)}₂ = ${aDec}₁₀</td></tr>` +
          `<tr><td>B:</td><td class="mono">${F().escapeHtml(bVal)}₂ = ${bDec}₁₀</td></tr>` +
          `<tr><td>Resultado:</td><td>${aDec} + ${bDec} = ${sumDec}₁₀</td></tr>`;
      }

    } else {
      pdfTitle = 'Calculadora de Aritmética Binaria';
      pdfH2    = 'Resultado';
      h3Title  = 'Pasos del algoritmo';
      metaRows = '';
    }

    const css = `
      body{font-family:'Segoe UI',system-ui,sans-serif;font-size:10.5pt;margin:20pt;color:#222}
      .pdf-header{border-bottom:2pt solid #1a3a6a;margin-bottom:14pt;padding-bottom:10pt}
      .pdf-header h2{color:#1a3a6a;font-size:15pt;margin:0 0 6pt}
      .pdf-meta{border-collapse:collapse;font-size:9.5pt}
      .pdf-meta td{padding:2pt 10pt 2pt 0}
      .pdf-meta td:first-child{font-weight:600;color:#444}
      table.algorithm-table{width:100%;border-collapse:collapse;font-size:8.5pt;margin-top:6pt}
      .algorithm-table th{background:#1a3a6a;color:#fff;padding:5pt 8pt;text-align:left;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .algorithm-table td{padding:4pt 8pt;border-bottom:.5pt solid #ccc;vertical-align:top}
      .algorithm-table tr.row-result td{background:#e8f5e9;font-weight:600;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .algorithm-table .title-cell{width:11%;word-break:break-word}
      .algorithm-table .step-op-cell{width:35%}
      .algorithm-table .explanation-cell{font-size:7.5pt;color:#555;width:40%}
      .mono{font-family:'Consolas','Courier New',monospace}
      .text-muted{color:#666;font-size:9pt}
      .reverse-section{margin-top:16pt;border-top:1pt solid #ccc;padding-top:10pt}
      .reverse-section h4{color:#1a3a6a;margin:0 0 6pt;font-size:11pt}
      .precision-ok{margin-top:8pt;padding:5pt 10pt;background:#d4edda;border:.5pt solid #28a745;border-radius:4pt;color:#155724;font-size:9pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .precision-warn{margin-top:8pt;padding:5pt 10pt;background:#fff3cd;border:.5pt solid #ffc107;border-radius:4pt;color:#856404;font-size:9pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      h3{color:#1a3a6a;font-size:12pt;margin:0 0 6pt}
      @media print{button{display:none}}
    `;

    const reverseHtml = reverseEl && reverseEl.innerHTML.trim()
      ? `<div class="reverse-section">${reverseEl.innerHTML}</div>` : '';

    const w = window.open('', '_blank');
    if (!w) { alert('El navegador bloqueó la ventana emergente. Permite ventanas emergentes para este sitio.'); return; }
    w.document.write(`<!DOCTYPE html><html lang="es"><head>
      <meta charset="UTF-8">
      <title>${F().escapeHtml(pdfTitle)}</title>
      <style>${css}</style>
    </head><body>
      <div class="pdf-header">
        <h2>${F().escapeHtml(pdfH2)}</h2>
        <table class="pdf-meta">${metaRows}</table>
      </div>
      <h3>${F().escapeHtml(h3Title)}</h3>
      ${tableEl.innerHTML}
      ${reverseHtml}
    </body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 400);
  };

  // ====== PLANTILLA GENÉRICA DE CALCULADORA ======
  function calcTemplate(id, title, desc, inputsHtml, registerNames, examples) {
    const examplesHtml = examples ? `<div class="example-preloads">
      <p>Ejemplos precargados:</p>
      ${examples.map((e, i) => `<button class="example-btn" data-ex="${id}-${i}">${F().escapeHtml(e.label)}</button>`).join('')}
    </div>` : '';

    return `<div class="calc-page">
      <h2>${title}</h2>
      <p class="description">${desc}</p>
      <div class="legend">
        <div class="legend-item"><div class="legend-dot" style="background:#e84e4e"></div>Bit resaltado</div>
        <div class="legend-item"><div class="legend-dot" style="background:#d4380d"></div>Q₀ (LSB)</div>
        <div class="legend-item"><div class="legend-dot" style="background:#2d7d46"></div>Resultado</div>
        <div class="legend-item"><div class="legend-dot" style="background:#7c3aed"></div>Bits finales</div>
      </div>
      <div class="calc-layout">
        <div class="calc-inputs">
          <h3>Entradas</h3>
          ${inputsHtml}
          <div id="${id}-error" style="display:none;margin-top:8px;"></div>
          <div class="btn-group">
            <button id="${id}-init" class="btn btn-primary">Inicializar</button>
            <button id="${id}-solve" class="btn btn-success">Resolver completo</button>
            <button id="${id}-reset" class="btn btn-outline">Reiniciar</button>
          </div>
          ${examplesHtml}
        </div>
        <div class="calc-output">
          <div class="output-tabs">
            <button class="tab-btn active" data-tab="${id}-tab-step">Paso a paso</button>
            <button class="tab-btn" data-tab="${id}-tab-full">Tabla completa</button>
          </div>
          <div id="${id}-tab-step" class="tab-panel active">
            <div class="step-controls">
              <button id="${id}-prev" class="btn btn-outline" disabled>◀ Anterior</button>
              <span id="${id}-counter" class="step-counter">—</span>
              <button id="${id}-next" class="btn btn-primary" disabled>Siguiente ▶</button>
            </div>
            <div class="progress-bar-wrap"><div id="${id}-progress" class="progress-bar" style="width:0%"></div></div>
            <div id="${id}-step"><p class="text-muted" style="margin-top:12px">Introduce los datos y pulsa "Inicializar".</p></div>
            <div style="margin-top:10px">
              <button id="${id}-reinit" class="btn btn-outline" style="width:auto;font-size:.82rem" disabled>⏮ Ir al inicio</button>
            </div>
          </div>
          <div id="${id}-tab-full" class="tab-panel">
            <div id="${id}-table"><p class="text-muted">Pulsa "Resolver completo" para ver todos los pasos.</p></div>
          </div>
        </div>
      </div>
    </div>`;
  }

  function bindTabs(prefix) {
    document.querySelectorAll(`.tab-btn[data-tab^="${prefix}"]`).forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        btn.closest('.output-tabs').querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll(`[id^="${prefix}-tab-"]`).forEach(p => p.classList.remove('active'));
        document.getElementById(tabId)?.classList.add('active');
      });
    });
  }

  // ====== SECCIONES ======

  // --- INICIO ---
  function viewInicio() {
    render(`<div>
      <div class="inicio-hero">
        <h2>Procesamiento Aritmético — Arquitectura de Computadores</h2>
        <p>Site educativo interactivo para estudiar operaciones aritméticas en binario paso a paso, siguiendo la metodología de clase.</p>
      </div>
      <div class="cards-grid">
        <div class="info-card">
          <h3>Modo paso a paso</h3>
          <p><span class="mode-badge step">Paso a paso</span> Avanza iteración a iteración, con el estado de todos los registros y una explicación de cada operación.</p>
        </div>
        <div class="info-card">
          <h3>Modo resolver completo</h3>
          <p><span class="mode-badge full">Resolver</span> Muestra de una vez la tabla completa del algoritmo, igual que en las resoluciones de clase.</p>
        </div>
        <div class="info-card" style="border-left-color:#e07b22">
          <h3>Aviso didáctico</h3>
          <p>Todas las operaciones se muestran con fines docentes. El objetivo es entender el <em>procedimiento</em>, no solo el resultado.</p>
        </div>
      </div>
      <div class="theory-content">
        <h3>Contenidos disponibles</h3>
        <ul>
          <li><strong>2. Sumadores</strong> — Calculadora con carry anticipado (CLA): suma binaria paso a paso con cálculo explícito de G, P y C.</li>
          <li><strong>3. Multiplicación y División</strong>
            <ul>
              <li>Multiplicación 2n bits — registros MD, PP, MR.</li>
              <li>Multiplicación n bits — Algoritmo con registros C, A, Q, M.</li>
              <li>División con restauración — registros A, Q, M.</li>
            </ul>
          </li>
          <li><strong>4. Punto Flotante (IEEE 754)</strong>
            <ul>
              <li>Representación — conversión decimal ↔ IEEE 754 con redondeo round-to-nearest-even.</li>
              <li>Suma y resta — algoritmo paso a paso con alineación de exponentes.</li>
            </ul>
          </li>
        </ul>
        <h3>Cómo usar las calculadoras</h3>
        <p>1. Introduce los operandos en el panel de la izquierda.<br>
        2. Pulsa <strong>Inicializar</strong> para preparar el algoritmo.<br>
        3. Usa <strong>Siguiente ▶</strong> para ver el siguiente paso o <strong>Resolver completo</strong> para ver toda la tabla.<br>
        4. Cada paso incluye el estado de los registros, la operación realizada y una explicación didáctica.</p>
      </div>
    </div>`, 'Inicio');
  }

  // --- SUMADORES: REPASO ---
  function viewRepaso() {
    render(`<div class="theory-content">
      <h2>2.1 Repaso de Suma y Resta Binaria</h2>
      <p>La suma binaria sigue las mismas reglas que la suma decimal, pero con base 2.</p>
      <h3>Reglas de suma binaria</h3>
      <div class="formula-box">0 + 0 = 0        carry = 0
0 + 1 = 1        carry = 0
1 + 0 = 1        carry = 0
1 + 1 = 0        carry = 1  (1 + 1 = 10₂)</div>
      <h3>Complemento a 1</h3>
      <p>Invierte todos los bits. Ejemplo: C₁(1010) = 0101.</p>
      <h3>Complemento a 2</h3>
      <p>C₂ = C₁ + 1. Se usa para representar negativos y para la resta: A − B = A + C₂(B).</p>
      <h3>Prueba interactiva</h3>
      <div class="interactive-demo">
        <div class="form-group"><label>A (binario)</label><input id="rep-a" type="text" value="1010" maxlength="8" placeholder="ej. 1010"></div>
        <div class="form-group"><label>B (binario)</label><input id="rep-b" type="text" value="0110" maxlength="8" placeholder="ej. 0110"></div>
        <button class="btn btn-primary" style="width:auto" onclick="calcRepaso()">Calcular</button>
      </div>
      <div id="rep-result" class="demo-result" style="min-width:200px">—</div>
    </div>`, 'Suma y Resta Binaria');

    window.calcRepaso = function () {
      const B = window.AC.Binary;
      const a = document.getElementById('rep-a').value.trim();
      const b = document.getElementById('rep-b').value.trim();
      if (!B.isValidBinary(a) || !B.isValidBinary(b)) {
        document.getElementById('rep-result').textContent = 'Error: solo bits 0 y 1';
        return;
      }
      const r = B.binaryAdd(a, b);
      const rEl = document.getElementById('rep-result');
      rEl.innerHTML = `<strong>${a} + ${b}</strong><br>
        = ${r.cout ? '1:' : ''}${r.result} (${B.binToDecUnsigned(r.result)}₁₀)<br>
        C₁(${a}) = ${B.onesComplement(a)}<br>
        C₂(${a}) = ${B.twosComplementBin(a)}`;
    };
  }

  // --- SEMI-SUMADOR ---
  function viewSemiSumador() {
    const B = window.AC.Binary;
    const rows = B.halfAdderTable();
    render(`<div class="theory-content">
      <h2>2.2 Semi-sumador</h2>
      <p>El semi-sumador suma dos bits A y B, produciendo la suma S y el carry C. No tiene carry de entrada.</p>
      <div class="formula-box">S = A XOR B
C = A AND B</div>
      <h3>Tabla de verdad</h3>
      ${F().renderTruthTable(rows, ['A', 'B', 'S', 'C'])}
      <h3>Prueba interactiva</h3>
      <div class="interactive-demo">
        <div class="form-group"><label>A</label><input id="ha-a" type="number" min="0" max="1" value="1" style="width:60px"></div>
        <div class="form-group"><label>B</label><input id="ha-b" type="number" min="0" max="1" value="1" style="width:60px"></div>
        <button class="btn btn-primary" style="width:auto" onclick="calcHA()">Calcular</button>
        <div id="ha-res" class="demo-result">—</div>
      </div>
    </div>`, 'Semi-sumador');

    window.calcHA = function () {
      const a = document.getElementById('ha-a').value;
      const b = document.getElementById('ha-b').value;
      const r = B.halfAdder(a, b);
      document.getElementById('ha-res').textContent = `S=${r.S}, C=${r.C}`;
    };
  }

  // --- SUMADOR COMPLETO ---
  function viewSumadorCompleto() {
    const B = window.AC.Binary;
    const rows = B.fullAdderTable();
    render(`<div class="theory-content">
      <h2>2.3 Sumador completo</h2>
      <p>El sumador completo suma tres bits: A, B y el carry de entrada Cin.</p>
      <div class="formula-box">S    = A XOR B XOR Cin
Cout = A·B + A·Cin + B·Cin</div>
      <h3>Tabla de verdad</h3>
      ${F().renderTruthTable(rows, ['A', 'B', 'Cin', 'S', 'Cout'])}
      <h3>Prueba interactiva</h3>
      <div class="interactive-demo">
        <div class="form-group"><label>A</label><input id="fa-a" type="number" min="0" max="1" value="1" style="width:60px"></div>
        <div class="form-group"><label>B</label><input id="fa-b" type="number" min="0" max="1" value="1" style="width:60px"></div>
        <div class="form-group"><label>Cin</label><input id="fa-c" type="number" min="0" max="1" value="1" style="width:60px"></div>
        <button class="btn btn-primary" style="width:auto" onclick="calcFA()">Calcular</button>
        <div id="fa-res" class="demo-result">—</div>
      </div>
    </div>`, 'Sumador Completo');

    window.calcFA = function () {
      const a = document.getElementById('fa-a').value;
      const b = document.getElementById('fa-b').value;
      const c = document.getElementById('fa-c').value;
      const r = B.fullAdder(a, b, c);
      document.getElementById('fa-res').textContent = `S=${r.S}, Cout=${r.Cout}`;
    };
  }

  // --- SUMADOR PARALELO ---
  function viewSumadorParalelo() {
    const id = 'parallel';
    const examples = [
      { label: '1010 + 0110 (10+6=16)', A: '1010', B: '0110' },
      { label: '1100 + 0111 (12+7, overflow)', A: '1100', B: '0111' },
      { label: '11001010 + 00110101 (202+53)', A: '11001010', B: '00110101' }
    ];
    render(calcTemplate(id, '2.4 Sumador Paralelo',
      'Suma dos números binarios de n bits mostrando la propagación del carry bit a bit. La latencia es 2n·T.',
      `<div class="form-group"><label>A (binario)</label><input id="${id}-A" type="text" value="1010" placeholder="ej. 1010" maxlength="16"></div>
       <div class="form-group"><label>B (binario)</label><input id="${id}-B" type="text" value="0110" placeholder="ej. 0110" maxlength="16"></div>`,
      ['A', 'B', 'S', 'Cout'],
      examples
    ), 'Sumador Paralelo');
    bindTabs(id);

    const regNames = ['A[i]', 'B[i]', 'Cin', 'S', 'Cout'];
    bindStepControls(id, regNames);
    document.getElementById(id + '-init').addEventListener('click', () => {
      clearAlert(id);
      const A = document.getElementById(id + '-A').value.trim();
      const B_ = document.getElementById(id + '-B').value.trim();
      const res = window.AC.Adders.parallelAdderSteps(A, B_);
      if (!res.valid) { showAlert(id, res.error); return; }
      setupStepController(id, { steps: res.steps, registerNames: regNames });
      document.getElementById(id + '-reinit').disabled = false;
    });

    document.getElementById(id + '-solve').addEventListener('click', () => {
      clearAlert(id);
      const A = document.getElementById(id + '-A').value.trim();
      const B_ = document.getElementById(id + '-B').value.trim();
      const res = window.AC.Adders.parallelAdderSteps(A, B_);
      if (!res.valid) { showAlert(id, res.error); return; }
      renderFullTable(id, res.steps, regNames);
      document.querySelector(`[data-tab="${id}-tab-full"]`).click();
    });

    document.getElementById(id + '-reset').addEventListener('click', () => {
      resetCalc();
      document.getElementById(id + '-step').innerHTML = '<p class="text-muted">Introduce los datos y pulsa "Inicializar".</p>';
      document.getElementById(id + '-table').innerHTML = '<p class="text-muted">Pulsa "Resolver completo" para ver todos los pasos.</p>';
      document.getElementById(id + '-counter').textContent = '—';
      document.getElementById(id + '-progress').style.width = '0%';
      document.getElementById(id + '-prev').disabled = true;
      document.getElementById(id + '-next').disabled = true;
      document.getElementById(id + '-reinit').disabled = true;
    });

    examples.forEach((ex, i) => {
      document.querySelector(`[data-ex="${id}-${i}"]`)?.addEventListener('click', () => {
        document.getElementById(id + '-A').value = ex.A;
        document.getElementById(id + '-B').value = ex.B;
      });
    });
  }

  // --- CARRY ANTICIPADO ---
  function viewCarryAnticipado() {
    const id = 'cla';
    const examples = [
      { label: '1011 + 0110 + C₀=0 (4b)', A: '1011', B: '0110', C0: '0' },
      { label: '1001 + 0111 + C₀=1 (4b)', A: '1001', B: '0111', C0: '1' },
      { label: '101101 + 011010 + C₀=0 (6b)', A: '101101', B: '011010', C0: '0' }
    ];
    render(calcTemplate(id, '2.1 Calculadora — Sumador con Carry Anticipado',
      'Calcula las sumas usando Gᵢ (generadores), Pᵢ (propagadores) y carries anticipados en paralelo. Latencia total siempre 6T (independiente del número de bits).',
      `<div class="form-group"><label>A (binario)</label><input id="${id}-A" type="text" value="1011" maxlength="16" placeholder="ej. 1011"></div>
       <div class="form-group"><label>B (binario)</label><input id="${id}-B" type="text" value="0110" maxlength="16" placeholder="ej. 0110"></div>
       <div class="form-group"><label>C₀ (carry entrada)</label>
         <select id="${id}-C0"><option value="0">0</option><option value="1">1</option></select>
       </div>`,
      [],
      examples
    ), 'Carry Anticipado');
    bindTabs(id);

    const regNames = [];
    bindStepControls(id, regNames);

    document.getElementById(id + '-init').addEventListener('click', () => {
      clearAlert(id);
      const A = document.getElementById(id + '-A').value.trim();
      const B_ = document.getElementById(id + '-B').value.trim();
      const C0 = document.getElementById(id + '-C0').value;
      const res = window.AC.Adders.carryLookaheadSteps(A, B_, C0);
      if (!res.valid) { showAlert(id, res.error); return; }
      setupStepController(id, { steps: res.steps, registerNames: regNames });
      document.getElementById(id + '-reinit').disabled = false;
    });

    document.getElementById(id + '-solve').addEventListener('click', () => {
      clearAlert(id);
      const A = document.getElementById(id + '-A').value.trim();
      const B_ = document.getElementById(id + '-B').value.trim();
      const C0 = document.getElementById(id + '-C0').value;
      const res = window.AC.Adders.carryLookaheadSteps(A, B_, C0);
      if (!res.valid) { showAlert(id, res.error); return; }
      renderFullTable(id, res.steps, regNames);
      document.querySelector(`[data-tab="${id}-tab-full"]`).click();
    });

    document.getElementById(id + '-reset').addEventListener('click', () => resetCalcUI(id));

    examples.forEach((ex, i) => {
      document.querySelector(`[data-ex="${id}-${i}"]`)?.addEventListener('click', () => {
        document.getElementById(id + '-A').value = ex.A;
        document.getElementById(id + '-B').value = ex.B;
        document.getElementById(id + '-C0').value = ex.C0;
      });
    });
  }

  // --- MULTIPLICACIÓ 1 (CALCULADORA 2n BITS) ---
  function viewMultClasica() { viewMult1(); }

  function viewMult1() {
    const id = 'mult1';
    const examples = [
      { label: '10 × 9 (1010 × 1001)', MD: '1010', MR: '1001' },
      { label: '5 × 3 (0101 × 0011)', MD: '0101', MR: '0011' },
      { label: '7 × 6 (0111 × 0110)', MD: '0111', MR: '0110' }
    ];
    render(calcTemplate(id, '3.1 Calculadora — Multiplicación 2n bits (MD, PP, MR)',
      'Registros de 2n bits. En cada iteración: si MR₀ = 1 se suma MD al acumulador PP; siempre: MD despl. izquierda (×2), MR despl. derecha (÷2), Iteración--. Resultado en PP (2n bits).',
      `<div class="form-group"><label>MD — Multiplicando (binario)</label><input id="${id}-MD" type="text" value="1010" placeholder="ej. 1010" maxlength="8"></div>
       <div class="form-group"><label>MR — Multiplicador (binario)</label><input id="${id}-MR" type="text" value="1001" placeholder="ej. 1001" maxlength="8"></div>`,
      ['Iteración', 'MD', 'PP', 'MR'],
      examples
    ), 'Multiplicación 2n bits');
    bindTabs(id);
    bindCalcMult1(id, examples);
  }

  function bindCalcMult1(id, examples) {
    const regNames = ['Iteración', 'MD', 'PP', 'MR'];
    bindStepControls(id, regNames);

    document.getElementById(id + '-init').addEventListener('click', () => {
      clearAlert(id);
      const MD = document.getElementById(id + '-MD').value.trim();
      const MR = document.getElementById(id + '-MR').value.trim();
      const res = window.AC.Multiply1.compute(MD, MR);
      if (!res.valid) { showAlert(id, res.error); return; }
      setupStepController(id, { steps: res.steps, registerNames: regNames });
      document.getElementById(id + '-reinit').disabled = false;
    });

    document.getElementById(id + '-solve').addEventListener('click', () => {
      clearAlert(id);
      const MD = document.getElementById(id + '-MD').value.trim();
      const MR = document.getElementById(id + '-MR').value.trim();
      const res = window.AC.Multiply1.compute(MD, MR);
      if (!res.valid) { showAlert(id, res.error); return; }
      renderFullTable(id, res.steps, regNames);
      document.querySelector(`[data-tab="${id}-tab-full"]`).click();
    });

    document.getElementById(id + '-reset').addEventListener('click', () => resetCalcUI(id));

    examples.forEach((ex, i) => {
      document.querySelector(`[data-ex="${id}-${i}"]`)?.addEventListener('click', () => {
        document.getElementById(id + '-MD').value = ex.MD;
        document.getElementById(id + '-MR').value = ex.MR;
      });
    });
  }

  // --- MULTIPLICACIÓN 2 (CALCULADORA n BITS) ---
  function viewMult2() {
    const id = 'mult2';
    const examples = [
      { label: '9 × 10 (M=1001, Q=1010)', M: '1001', Q: '1010' },
      { label: '5 × 3 (M=0101, Q=0011)', M: '0101', Q: '0011' },
      { label: '7 × 6 (M=0111, Q=0110)', M: '0111', Q: '0110' }
    ];
    render(calcTemplate(id, '3.3 Calculadora — Multiplicación n bits (Algoritmo 2, C:A:Q:M)',
      'Registros de n bits. En cada iteración: si Q₀ = 1 se suma M a A (con acarreo en C); luego se desplaza C:A:Q una posición a la derecha. Al final el resultado queda en A:Q (2n bits).',
      `<div class="form-group"><label>M — Multiplicando (binario)</label><input id="${id}-M" type="text" value="1001" placeholder="ej. 1001" maxlength="8"></div>
       <div class="form-group"><label>Q — Multiplicador (binario)</label><input id="${id}-Q" type="text" value="1010" placeholder="ej. 1010" maxlength="8"></div>`,
      ['Iteración', 'MD', 'C', 'PP', 'MR'],
      examples
    ), 'Multiplicación n bits — Algoritmo 2');
    bindTabs(id);
    bindCalcMult2(id, examples);
  }

  function bindCalcMult2(id, examples) {
    const regNames = ['Iteración', 'MD', 'C', 'PP', 'MR'];
    bindStepControls(id, regNames);

    document.getElementById(id + '-init').addEventListener('click', () => {
      clearAlert(id);
      const M = document.getElementById(id + '-M').value.trim();
      const Q = document.getElementById(id + '-Q').value.trim();
      const res = window.AC.Multiply2.compute(M, Q);
      if (!res.valid) { showAlert(id, res.error); return; }
      setupStepController(id, { steps: res.steps, registerNames: regNames });
      document.getElementById(id + '-reinit').disabled = false;
    });

    document.getElementById(id + '-solve').addEventListener('click', () => {
      clearAlert(id);
      const M = document.getElementById(id + '-M').value.trim();
      const Q = document.getElementById(id + '-Q').value.trim();
      const res = window.AC.Multiply2.compute(M, Q);
      if (!res.valid) { showAlert(id, res.error); return; }
      renderFullTable(id, res.steps, regNames);
      document.querySelector(`[data-tab="${id}-tab-full"]`).click();
    });

    document.getElementById(id + '-reset').addEventListener('click', () => resetCalcUI(id));

    examples.forEach((ex, i) => {
      document.querySelector(`[data-ex="${id}-${i}"]`)?.addEventListener('click', () => {
        document.getElementById(id + '-M').value = ex.M;
        document.getElementById(id + '-Q').value = ex.Q;
      });
    });
  }

  // --- DIVISIÓN CON RESTAURACIÓN ---
  function viewDivision() {
    const id = 'div';
    const examples = [
      { label: '14 ÷ 2 (Q=1110, M=0010)', Q: '1110', M: '0010' },
      { label: '11 ÷ 3 (Q=1011, M=0011)', Q: '1011', M: '0011' },
      { label: '13 ÷ 4 (Q=1101, M=0100)', Q: '1101', M: '0100' }
    ];
    render(calcTemplate(id, '3.4 División Binaria con Restauración',
      'Algoritmo iterativo: desplaza A:Q izquierda, resta M. Si A queda negativo → restaura (A+=M) y Q₀=0; si no → Q₀=1. Cociente en Q, residuo en A.',
      `<div class="form-group"><label>Q — Dividendo (binario)</label><input id="${id}-Q" type="text" value="1110" placeholder="ej. 1110" maxlength="8"></div>
       <div class="form-group"><label>M — Divisor (binario)</label><input id="${id}-M" type="text" value="0010" placeholder="ej. 0010" maxlength="8"></div>`,
      ['A', 'Q', 'M'],
      examples
    ), 'División con Restauración');
    bindTabs(id);
    bindCalcDiv(id, examples);
  }

  function bindCalcDiv(id, examples) {
    const regNames = ['A', 'Q', 'M'];
    bindStepControls(id, regNames);

    document.getElementById(id + '-init').addEventListener('click', () => {
      clearAlert(id);
      const Q = document.getElementById(id + '-Q').value.trim();
      const M = document.getElementById(id + '-M').value.trim();
      const res = window.AC.DivisionRestoring.compute(Q, M);
      if (!res.valid) { showAlert(id, res.error); return; }
      setupStepController(id, { steps: res.steps, registerNames: regNames });
      document.getElementById(id + '-reinit').disabled = false;
    });

    document.getElementById(id + '-solve').addEventListener('click', () => {
      clearAlert(id);
      const Q = document.getElementById(id + '-Q').value.trim();
      const M = document.getElementById(id + '-M').value.trim();
      const res = window.AC.DivisionRestoring.compute(Q, M);
      if (!res.valid) { showAlert(id, res.error); return; }
      renderFullTable(id, res.steps, regNames);
      document.querySelector(`[data-tab="${id}-tab-full"]`).click();
    });

    document.getElementById(id + '-reset').addEventListener('click', () => resetCalcUI(id));

    examples.forEach((ex, i) => {
      document.querySelector(`[data-ex="${id}-${i}"]`)?.addEventListener('click', () => {
        document.getElementById(id + '-Q').value = ex.Q;
        document.getElementById(id + '-M').value = ex.M;
      });
    });
  }

  // --- PUNTO FLOTANTE: REPRESENTACIÓN ---
  function viewFloatRepr() {
    const id = 'frepr';
    const examples = [
      { label: '51.25  — IEEE Simple',         value: '51.25',      mode: 'dec',      expBits: '8', mantBits: '23', bias: '127' },
      { label: '1.375  — formato 1-4-7',        value: '1.375',      mode: 'dec',      expBits: '4', mantBits: '7',  bias: '7'   },
      { label: '-0.1   — IEEE Simple (periódico)', value: '-0.1',    mode: 'dec',      expBits: '8', mantBits: '23', bias: '127' },
      { label: '110011.01₂ — binario con punto', value: '110011.01', mode: 'binpoint', expBits: '8', mantBits: '23', bias: '127' },
      { label: '1.010000110111₂ × 2⁰ — 1-4-11', value: '1.010000110111e0', mode: 'binsci', expBits: '4', mantBits: '11', bias: '7' },
      { label: '-1.00111100100₂ × 2⁰ — 1-4-11', value: '-1.0011110010e0',  mode: 'binsci', expBits: '4', mantBits: '11', bias: '7' },
    ];

    const MODE_CFG = {
      dec:      { label: 'Número decimal',            ph: 'ej. 0.75 o -51.25',           hint: 'Número en base 10.' },
      binpoint: { label: 'Binario con punto',          ph: 'ej. 110011.01 o -0.00110011', hint: 'Solo bits 0/1; usa el punto para la parte fraccionaria.' },
      binsci:   { label: 'Binario × 2ⁿ',             ph: 'ej. 1.10011e5  o  1.01×2^-3', hint: 'Mantisa binaria × 2^exponente. También: 1.10011×2^5.' },
    };

    render(`<div class="calc-page">
      <h2>4.1 Representación IEEE 754</h2>
      <p class="description">Convierte un número (decimal o binario) al formato IEEE 754 o cualquier formato S-E-M configurable. Muestra cada paso: signo, conversión, normalización, exponente con sesgo y ensamblado.</p>
      <div class="calc-layout">
        <div class="calc-inputs">
          <h3>Entradas</h3>
          <div class="form-group">
            <label>Tipo de entrada</label>
            <select id="${id}-mode" style="width:100%;padding:6px 8px;border:1.5px solid var(--color-border);border-radius:6px;font-size:.9rem">
              <option value="dec">Decimal</option>
              <option value="binpoint">Binario con punto  (ej: 110011.01)</option>
              <option value="binsci">Binario × 2ⁿ  (ej: 1.10011e5 / 1.10011×2^5)</option>
            </select>
          </div>
          <div class="form-group">
            <label id="${id}-input-label">Número decimal</label>
            <input id="${id}-dec" type="text" value="0.75" placeholder="ej. 0.75">
            <small id="${id}-input-hint" style="color:var(--color-text-muted)">Número en base 10.</small>
          </div>
          <div class="form-group">
            <label>Formato rápido  <span style="font-size:.78rem;font-weight:400;color:var(--color-text-muted)">(S-E-M)</span></label>
            <div class="format-quick-btns">
              <button class="fmt-btn active" data-exp="8"  data-mant="23" data-bias="127">Simple  (1-8-23)</button>
              <button class="fmt-btn"        data-exp="4"  data-mant="5"  data-bias="7"  >1-4-5</button>
              <button class="fmt-btn"        data-exp="4"  data-mant="7"  data-bias="7"  >1-4-7</button>
              <button class="fmt-btn"        data-exp="4"  data-mant="11" data-bias="7"  >1-4-11</button>
              <button class="fmt-btn"        data-exp="11" data-mant="52" data-bias="1023">Doble  (1-11-52)</button>
            </div>
          </div>
          <div class="form-group"><label>Bits de exponente</label>
            <input id="${id}-exp" type="number" value="8" min="2" max="15">
          </div>
          <div class="form-group"><label>Bits de mantisa</label>
            <input id="${id}-mant" type="number" value="23" min="1" max="52">
          </div>
          <div class="form-group"><label>Sesgo (bias)</label>
            <input id="${id}-bias" type="number" value="127" min="0" max="2047">
            <small>IEEE simple: 127 · 1-4-x: 7 · Doble: 1023</small>
          </div>
          <div class="form-group">
            <label class="toggle-expl-label" style="font-size:.85rem;font-weight:600">
              <input type="checkbox" id="${id}-show-inv" checked style="accent-color:var(--color-primary)">
              Verificar con conversión inversa (flotante → decimal)
            </label>
          </div>
          <div id="${id}-error" style="display:none;margin-top:8px;"></div>
          <div class="btn-group">
            <button id="${id}-init"  class="btn btn-primary">Inicializar</button>
            <button id="${id}-solve" class="btn btn-success">Resolver completo</button>
            <button id="${id}-reset" class="btn btn-outline">Reiniciar</button>
          </div>
          <div class="example-preloads">
            <p>Ejemplos precargados:</p>
            ${examples.map((e, i) => `<button class="example-btn" data-ex="${id}-${i}">${F().escapeHtml(e.label)}</button>`).join('')}
          </div>
        </div>
        <div class="calc-output">
          <div class="output-tabs">
            <button class="tab-btn active" data-tab="${id}-tab-step">Paso a paso</button>
            <button class="tab-btn" data-tab="${id}-tab-full">Tabla completa</button>
          </div>
          <div id="${id}-tab-step" class="tab-panel active">
            <div class="step-controls">
              <button id="${id}-prev" class="btn btn-outline" disabled>◀ Anterior</button>
              <span id="${id}-counter" class="step-counter">—</span>
              <button id="${id}-next" class="btn btn-primary" disabled>Siguiente ▶</button>
            </div>
            <div class="progress-bar-wrap"><div id="${id}-progress" class="progress-bar" style="width:0%"></div></div>
            <div id="${id}-step"><p class="text-muted" style="margin-top:12px">Introduce los datos y pulsa "Inicializar".</p></div>
            <div style="margin-top:10px"><button id="${id}-reinit" class="btn btn-outline" style="width:auto;font-size:.82rem" disabled>⏮ Ir al inicio</button></div>
          </div>
          <div id="${id}-tab-full" class="tab-panel">
            <div id="${id}-table"><p class="text-muted">Pulsa "Resolver completo".</p></div>
          </div>
          <div id="${id}-reverse"></div>
        </div>
      </div>
    </div>`, 'Representación en Punto Flotante');

    bindTabs(id);
    const regNames = [];

    function getConfig() {
      return {
        signBits: 1,
        expBits:  parseInt(document.getElementById(id + '-exp').value)  || 8,
        mantBits: parseInt(document.getElementById(id + '-mant').value) || 23,
        bias:     document.getElementById(id + '-bias').value
      };
    }

    function getInputMode() {
      return document.getElementById(id + '-mode').value;
    }

    function runCalc() {
      const mode = getInputMode();
      const val  = document.getElementById(id + '-dec').value;
      const cfg  = getConfig();
      if (mode === 'dec') return window.AC.FloatRepr.decToFloat(nd(val), cfg);
      return window.AC.FloatRepr.binToFloat(val, cfg);
    }

    function showReverse(resultBin, cfg) {
      const showInv = document.getElementById(id + '-show-inv')?.checked;
      const revEl = document.getElementById(id + '-reverse');
      if (!revEl) return;
      if (!showInv || !resultBin) { revEl.innerHTML = ''; return; }
      const rev = window.AC.FloatRepr.floatToDec(resultBin, cfg);
      if (!rev.valid) { revEl.innerHTML = `<div class="alert alert-error">${F().escapeHtml(rev.error)}</div>`; return; }

      let precisionHtml = '';
      const mode = getInputMode();
      if (mode === 'dec' && typeof rev.result === 'number') {
        const originalVal = parseFloat(nd(document.getElementById(id + '-dec').value));
        if (!isNaN(originalVal)) {
          const err = Math.abs(originalVal - rev.result);
          if (err < 1e-9) {
            precisionHtml = `<div class="precision-ok">Representación exacta — no hay pérdida de precisión. Valor reconstruido: ${rev.result.toPrecision(8)}</div>`;
          } else {
            precisionHtml = `<div class="precision-warn">Imprecisión de representación: valor original <strong>${originalVal}</strong>, reconstruido <strong>${rev.result.toPrecision(8)}</strong>, error ≈ <strong>${err.toExponential(3)}</strong></div>`;
          }
        }
      }

      revEl.innerHTML = `<div class="reverse-section">
        <h4>Verificación: conversión inversa (flotante → decimal)</h4>
        <p class="text-muted" style="margin-bottom:10px">Partiendo del resultado binario <span class="mono">${F().escapeHtml(resultBin)}</span>, reconstruimos el valor decimal.</p>
        ${F().renderAlgorithmTable(rev.steps, [])}
        ${precisionHtml}
      </div>`;
    }

    // Selector de modo: actualiza etiqueta, placeholder y hint
    document.getElementById(id + '-mode').addEventListener('change', () => {
      const mode = getInputMode();
      const mc   = MODE_CFG[mode];
      document.getElementById(id + '-input-label').textContent   = mc.label;
      document.getElementById(id + '-dec').placeholder           = mc.ph;
      document.getElementById(id + '-input-hint').textContent    = mc.hint;
      document.getElementById(id + '-dec').value                 = '';
    });

    bindStepControls(id, regNames);

    document.getElementById(id + '-init').addEventListener('click', () => {
      clearAlert(id);
      const res = runCalc();
      if (!res.valid) { showAlert(id, res.error); return; }
      setupStepController(id, { steps: res.steps, registerNames: regNames });
      document.getElementById(id + '-reinit').disabled = false;
      showReverse(res.result, getConfig());
    });

    document.getElementById(id + '-solve').addEventListener('click', () => {
      clearAlert(id);
      const res = runCalc();
      if (!res.valid) { showAlert(id, res.error); return; }
      renderFullTable(id, res.steps, regNames);
      document.querySelector(`[data-tab="${id}-tab-full"]`).click();
      showReverse(res.result, getConfig());
    });

    document.getElementById(id + '-reset').addEventListener('click', () => {
      resetCalcUI(id);
      const revEl = document.getElementById(id + '-reverse');
      if (revEl) revEl.innerHTML = '';
    });

    // Botones de formato rápido
    document.querySelectorAll('.fmt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.fmt-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(id + '-exp').value  = btn.dataset.exp;
        document.getElementById(id + '-mant').value = btn.dataset.mant;
        document.getElementById(id + '-bias').value = btn.dataset.bias;
      });
    });

    // Deseleccionar botón activo al cambiar campos manualmente
    ['exp', 'mant', 'bias'].forEach(f => {
      document.getElementById(`${id}-${f}`)?.addEventListener('input', () => {
        document.querySelectorAll('.fmt-btn').forEach(b => b.classList.remove('active'));
      });
    });

    examples.forEach((ex, i) => {
      document.querySelector(`[data-ex="${id}-${i}"]`)?.addEventListener('click', () => {
        // Cambiar modo si el ejemplo lo especifica
        if (ex.mode) {
          document.getElementById(id + '-mode').value = ex.mode;
          const mc = MODE_CFG[ex.mode];
          document.getElementById(id + '-input-label').textContent = mc.label;
          document.getElementById(id + '-dec').placeholder        = mc.ph;
          document.getElementById(id + '-input-hint').textContent  = mc.hint;
        }
        document.getElementById(id + '-dec').value  = ex.value;
        document.getElementById(id + '-exp').value  = ex.expBits;
        document.getElementById(id + '-mant').value = ex.mantBits;
        document.getElementById(id + '-bias').value = ex.bias;
        document.querySelectorAll('.fmt-btn').forEach(b => {
          b.classList.toggle('active',
            b.dataset.exp === ex.expBits && b.dataset.mant === ex.mantBits && b.dataset.bias === ex.bias);
        });
      });
    });
  }

  // --- PUNTO FLOTANTE: SUMA/RESTA ---
  function viewFloatAddSub() {
    const id = 'fas';

    const MODE_CFG = {
      dec:       { lbl: 'decimal',          ph: 'ej. 1.5',              hint: 'Número en base 10.' },
      binpoint:  { lbl: 'binario₂',        ph: 'ej. 1.1  o  110.01',   hint: 'Solo bits 0/1; punto para la parte fraccionaria.' },
      binsci:    { lbl: 'bin × 2ⁿ',        ph: 'ej. 1.1e0  o  1.01e2', hint: 'Mantisa binaria × 2^exponente.' },
      ieee754bin:{ lbl: 'IEEE 754 binario', ph: null,                   hint: 'Formato: Signo-Exponente-Mantisa separados por guión. Ej: 0-01111111-10000000000000000000000' },
    };

    const examples = [
      { label: '1.5 + 0.25 — IEEE Simple',            dec1: '1.5',        dec2: '0.25',       op: 'add', expBits: '8',  mantBits: '23', bias: '127',  mode: 'dec'      },
      { label: '0.1 + 0.2 — IEEE Simple',             dec1: '0.1',        dec2: '0.2',        op: 'add', expBits: '8',  mantBits: '23', bias: '127',  mode: 'dec'      },
      { label: '0.1 + 0.2 — IEEE Doble',              dec1: '0.1',        dec2: '0.2',        op: 'add', expBits: '11', mantBits: '52', bias: '1023', mode: 'dec'      },
      { label: '1.5 − 0.75 — IEEE Media',             dec1: '1.5',        dec2: '0.75',       op: 'sub', expBits: '5',  mantBits: '10', bias: '15',   mode: 'dec'      },
      { label: '0.3 + 1.6 — 1-4-5',                  dec1: '0.3',        dec2: '1.6',        op: 'add', expBits: '4',  mantBits: '5',  bias: '7',    mode: 'dec'      },
      { label: '1.1₂ + 10.01₂ — 1-4-7',             dec1: '1.1',        dec2: '10.01',      op: 'add', expBits: '4',  mantBits: '7',  bias: '7',    mode: 'binpoint' },
    ];

    render(`<div class="calc-page">
      <h2>4.3 Suma y Resta en Punto Flotante</h2>
      <p class="description">Suma o resta dos números en punto flotante (decimal o binario). Muestra alineación de mantisas y pérdida de bits.</p>
      <div class="calc-layout">
        <div class="calc-inputs">
          <h3>Entradas</h3>
          <div class="form-group">
            <label>Tipo de entrada</label>
            <select id="${id}-mode" style="width:100%;padding:6px 8px;border:1.5px solid var(--color-border);border-radius:6px;font-size:.9rem">
              <option value="dec">Decimal</option>
              <option value="binpoint">Binario con punto  (ej: 1.1₂)</option>
              <option value="binsci">Binario × 2ⁿ  (ej: 1.1e0 / 1.1×2^0)</option>
              <option value="ieee754bin">IEEE 754 binario  (ej: 0-01111111-10000000000000000000000)</option>
            </select>
          </div>
          <div class="form-group">
            <label id="${id}-lbl1">Operando 1 — decimal</label>
            <input id="${id}-dec1" type="text" value="1.5" placeholder="ej. 1.5">
          </div>
          <div class="form-group"><label>Operación</label>
            <select id="${id}-op"><option value="add">Suma (+)</option><option value="sub">Resta (−)</option></select>
          </div>
          <div class="form-group">
            <label id="${id}-lbl2">Operando 2 — decimal</label>
            <input id="${id}-dec2" type="text" value="0.25" placeholder="ej. 0.25">
            <small id="${id}-mode-hint" style="color:var(--color-text-muted)">Número en base 10.</small>
          </div>
          <div class="form-group">
            <label>Formato rápido  <span style="font-size:.78rem;font-weight:400;color:var(--color-text-muted)">(S-E-M)</span></label>
            <div class="format-quick-btns" id="${id}-fmts">
              <button class="fmt-btn active" data-exp="8"  data-mant="23" data-bias="127" >Simple (1-8-23)</button>
              <button class="fmt-btn"        data-exp="5"  data-mant="10" data-bias="15"  >Media  (1-5-10)</button>
              <button class="fmt-btn"        data-exp="11" data-mant="52" data-bias="1023">Doble  (1-11-52)</button>
              <button class="fmt-btn"        data-exp="4"  data-mant="5"  data-bias="7"   >1-4-5</button>
              <button class="fmt-btn"        data-exp="4"  data-mant="7"  data-bias="7"   >1-4-7</button>
              <button class="fmt-btn"        data-exp="4"  data-mant="11" data-bias="7"   >1-4-11</button>
            </div>
          </div>
          <div class="form-group"><label>Bits exponente</label><input id="${id}-exp"  type="number" value="8"   min="2" max="15"></div>
          <div class="form-group"><label>Bits mantisa</label>  <input id="${id}-mant" type="number" value="23"  min="1" max="52"></div>
          <div class="form-group"><label>Bias</label>           <input id="${id}-bias" type="number" value="127" min="0" max="1023"></div>
          <div id="${id}-error" style="display:none;margin-top:8px;"></div>
          <div class="btn-group">
            <button id="${id}-init"  class="btn btn-primary">Inicializar</button>
            <button id="${id}-solve" class="btn btn-success">Resolver completo</button>
            <button id="${id}-reset" class="btn btn-outline">Reiniciar</button>
          </div>
          <div class="example-preloads"><p>Ejemplos:</p>
            ${examples.map((e, i) => `<button class="example-btn" data-ex="${id}-${i}">${F().escapeHtml(e.label)}</button>`).join('')}
          </div>
        </div>
        <div class="calc-output">
          <div class="output-tabs">
            <button class="tab-btn active" data-tab="${id}-tab-step">Paso a paso</button>
            <button class="tab-btn" data-tab="${id}-tab-full">Tabla completa</button>
          </div>
          <div id="${id}-tab-step" class="tab-panel active">
            <div class="step-controls">
              <button id="${id}-prev" class="btn btn-outline" disabled>◀ Anterior</button>
              <span id="${id}-counter" class="step-counter">—</span>
              <button id="${id}-next" class="btn btn-primary" disabled>Siguiente ▶</button>
            </div>
            <div class="progress-bar-wrap"><div id="${id}-progress" class="progress-bar" style="width:0%"></div></div>
            <div id="${id}-step"><p class="text-muted" style="margin-top:12px">Introduce los datos y pulsa "Inicializar".</p></div>
            <div style="margin-top:10px"><button id="${id}-reinit" class="btn btn-outline" style="width:auto;font-size:.82rem" disabled>⏮ Ir al inicio</button></div>
          </div>
          <div id="${id}-tab-full" class="tab-panel">
            <div id="${id}-table"><p class="text-muted">Pulsa "Resolver completo".</p></div>
          </div>
        </div>
      </div>
    </div>`, 'Suma/Resta en Punto Flotante');

    bindTabs(id);
    const regNames = [];

    function getConfig() {
      return { signBits: 1, expBits: parseInt(document.getElementById(id + '-exp').value), mantBits: parseInt(document.getElementById(id + '-mant').value), bias: document.getElementById(id + '-bias').value };
    }

    function getMode() { return document.getElementById(id + '-mode').value; }

    function getInputs() {
      const mode = getMode();
      const raw1 = document.getElementById(id + '-dec1').value;
      const raw2 = document.getElementById(id + '-dec2').value;
      return {
        v1: mode === 'dec' ? nd(raw1) : raw1,
        v2: mode === 'dec' ? nd(raw2) : raw2,
        modes: { mode1: mode, mode2: mode }
      };
    }

    // Placeholder dinámico para modo ieee754bin
    function ieee754Ph() {
      const e = parseInt(document.getElementById(id + '-exp').value)  || 8;
      const m = parseInt(document.getElementById(id + '-mant').value) || 23;
      return `ej. 0-${'0'.repeat(e)}-${'0'.repeat(m)}`;
    }
    function applyModePh() {
      const mode = getMode();
      const ph = mode === 'ieee754bin' ? ieee754Ph() : MODE_CFG[mode].ph;
      document.getElementById(id + '-dec1').placeholder = ph;
      document.getElementById(id + '-dec2').placeholder = ph;
    }

    // Modo: actualizar labels, placeholders, hint
    document.getElementById(id + '-mode').addEventListener('change', () => {
      const mc = MODE_CFG[getMode()];
      document.getElementById(id + '-lbl1').textContent      = `Operando 1 — ${mc.lbl}`;
      document.getElementById(id + '-lbl2').textContent      = `Operando 2 — ${mc.lbl}`;
      document.getElementById(id + '-mode-hint').textContent = mc.hint;
      document.getElementById(id + '-dec1').value            = '';
      document.getElementById(id + '-dec2').value            = '';
      applyModePh();
    });

    // Botones de formato rápido
    document.querySelectorAll(`#${id}-fmts .fmt-btn`).forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll(`#${id}-fmts .fmt-btn`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(id + '-exp').value  = btn.dataset.exp;
        document.getElementById(id + '-mant').value = btn.dataset.mant;
        document.getElementById(id + '-bias').value = btn.dataset.bias;
        applyModePh();
      });
    });

    [id + '-exp', id + '-mant', id + '-bias'].forEach(fid => {
      document.getElementById(fid)?.addEventListener('input', () => {
        document.querySelectorAll(`#${id}-fmts .fmt-btn`).forEach(b => {
          b.classList.toggle('active',
            b.dataset.exp  === document.getElementById(id + '-exp').value &&
            b.dataset.mant === document.getElementById(id + '-mant').value &&
            b.dataset.bias === document.getElementById(id + '-bias').value);
        });
        applyModePh();
      });
    });

    // Auto-detectar formato desde la entrada IEEE 754 binario
    function autoDetectIEEE754Format(val) {
      if (getMode() !== 'ieee754bin') return;
      const parts = (val || '').trim().split('-');
      if (parts.length !== 3) return;
      const [signBit, expPart, mantPart] = parts;
      if (!/^[01]$/.test(signBit) || !/^[01]+$/.test(expPart) || !/^[01]+$/.test(mantPart)) return;
      const newExp  = expPart.length;
      const newMant = mantPart.length;
      const newBias = Math.pow(2, newExp - 1) - 1;
      document.getElementById(id + '-exp').value  = newExp;
      document.getElementById(id + '-mant').value = newMant;
      document.getElementById(id + '-bias').value = newBias;
      document.querySelectorAll(`#${id}-fmts .fmt-btn`).forEach(b => {
        b.classList.toggle('active',
          parseInt(b.dataset.exp)  === newExp &&
          parseInt(b.dataset.mant) === newMant &&
          parseInt(b.dataset.bias) === newBias);
      });
      applyModePh();
    }
    [id + '-dec1', id + '-dec2'].forEach(fid => {
      document.getElementById(fid)?.addEventListener('input', e => autoDetectIEEE754Format(e.target.value));
    });

    bindStepControls(id, regNames);

    document.getElementById(id + '-init').addEventListener('click', () => {
      clearAlert(id);
      const { v1, v2, modes } = getInputs();
      const res = window.AC.FloatAddSub.compute(v1, v2, document.getElementById(id + '-op').value, getConfig(), modes);
      if (!res.valid) { showAlert(id, res.error); return; }
      setupStepController(id, { steps: res.steps, registerNames: regNames });
      document.getElementById(id + '-reinit').disabled = false;
    });

    document.getElementById(id + '-solve').addEventListener('click', () => {
      clearAlert(id);
      const { v1, v2, modes } = getInputs();
      const res = window.AC.FloatAddSub.compute(v1, v2, document.getElementById(id + '-op').value, getConfig(), modes);
      if (!res.valid) { showAlert(id, res.error); return; }
      renderFullTable(id, res.steps, regNames);
      document.querySelector(`[data-tab="${id}-tab-full"]`).click();
    });

    document.getElementById(id + '-reset').addEventListener('click', () => resetCalcUI(id));

    examples.forEach((ex, i) => {
      document.querySelector(`[data-ex="${id}-${i}"]`)?.addEventListener('click', () => {
        if (ex.mode) {
          document.getElementById(id + '-mode').value = ex.mode;
          const mc = MODE_CFG[ex.mode];
          document.getElementById(id + '-lbl1').textContent      = `Operando 1 — ${mc.lbl}`;
          document.getElementById(id + '-lbl2').textContent      = `Operando 2 — ${mc.lbl}`;
          document.getElementById(id + '-dec1').placeholder      = mc.ph;
          document.getElementById(id + '-dec2').placeholder      = mc.ph;
          document.getElementById(id + '-mode-hint').textContent = mc.hint;
        }
        document.getElementById(id + '-dec1').value  = ex.dec1;
        document.getElementById(id + '-dec2').value  = ex.dec2;
        document.getElementById(id + '-op').value    = ex.op;
        document.getElementById(id + '-exp').value   = ex.expBits;
        document.getElementById(id + '-mant').value  = ex.mantBits;
        document.getElementById(id + '-bias').value  = ex.bias;
        document.querySelectorAll(`#${id}-fmts .fmt-btn`).forEach(b => {
          b.classList.toggle('active', b.dataset.exp === ex.expBits && b.dataset.mant === ex.mantBits && b.dataset.bias === ex.bias);
        });
      });
    });
  }

  // --- PUNTO FLOTANTE: MULTIPLICACIÓN/DIVISIÓN ---
  function viewFloatMulDiv() {
    const id = 'fmd';
    const examples = [
      { label: '1.5 × 2.0 (IEEE 754 Simple)', dec1: '1.5', dec2: '2.0', op: 'mul', expBits: '8', mantBits: '23', bias: '127' },
      { label: '3.0 ÷ 1.5 (IEEE 754 Simple)', dec1: '3.0', dec2: '1.5', op: 'div', expBits: '8', mantBits: '23', bias: '127' },
      { label: '1.5 × 2.0 (1-4-7, bias=7)',   dec1: '1.5', dec2: '2.0', op: 'mul', expBits: '4', mantBits: '7',  bias: '7'   }
    ];
    render(`<div class="calc-page">
      <h2>4.4 – 4.5 Multiplicación y División en Punto Flotante</h2>
      <p class="description">En multiplicación: se suman exponentes (restando bias) y se multiplican mantisas. En división: se restan exponentes y se dividen mantisas.</p>
      <div class="calc-layout">
        <div class="calc-inputs">
          <h3>Entradas</h3>
          <div class="form-group"><label>Operando 1</label><input id="${id}-dec1" type="text" value="1.5" placeholder="decimal"></div>
          <div class="form-group"><label>Operación</label>
            <select id="${id}-op"><option value="mul">Multiplicación (×)</option><option value="div">División (÷)</option></select>
          </div>
          <div class="form-group"><label>Operando 2</label><input id="${id}-dec2" type="text" value="2.0" placeholder="decimal"></div>
          <div class="form-group"><label>Formato rápido</label>
            <div class="format-quick-btns">
              <button class="fmt-btn active" id="${id}-fmt-simple" data-exp="8"  data-mant="23" data-bias="127">Simple (IEEE 754)</button>
              <button class="fmt-btn"        id="${id}-fmt-half"   data-exp="5"  data-mant="10" data-bias="15" >Media  (IEEE 754)</button>
              <button class="fmt-btn"        id="${id}-fmt-double" data-exp="11" data-mant="52" data-bias="1023">Doble (IEEE 754)</button>
            </div>
          </div>
          <div class="form-group"><label>Bits exponente</label><input id="${id}-exp"  type="number" value="8"   min="2" max="15"></div>
          <div class="form-group"><label>Bits mantisa</label>  <input id="${id}-mant" type="number" value="23"  min="1" max="52"></div>
          <div class="form-group"><label>Bias</label>           <input id="${id}-bias" type="number" value="127" min="0" max="1023"></div>
          <div id="${id}-error" style="display:none;margin-top:8px;"></div>
          <div class="btn-group">
            <button id="${id}-init"  class="btn btn-primary">Inicializar</button>
            <button id="${id}-solve" class="btn btn-success">Resolver completo</button>
            <button id="${id}-reset" class="btn btn-outline">Reiniciar</button>
          </div>
          <div class="example-preloads"><p>Ejemplos:</p>
            ${examples.map((e, i) => `<button class="example-btn" data-ex="${id}-${i}">${F().escapeHtml(e.label)}</button>`).join('')}
          </div>
        </div>
        <div class="calc-output">
          <div class="output-tabs">
            <button class="tab-btn active" data-tab="${id}-tab-step">Paso a paso</button>
            <button class="tab-btn" data-tab="${id}-tab-full">Tabla completa</button>
          </div>
          <div id="${id}-tab-step" class="tab-panel active">
            <div class="step-controls">
              <button id="${id}-prev" class="btn btn-outline" disabled>◀ Anterior</button>
              <span id="${id}-counter" class="step-counter">—</span>
              <button id="${id}-next" class="btn btn-primary" disabled>Siguiente ▶</button>
            </div>
            <div class="progress-bar-wrap"><div id="${id}-progress" class="progress-bar" style="width:0%"></div></div>
            <div id="${id}-step"><p class="text-muted" style="margin-top:12px">Introduce los datos y pulsa "Inicializar".</p></div>
            <div style="margin-top:10px"><button id="${id}-reinit" class="btn btn-outline" style="width:auto;font-size:.82rem" disabled>⏮ Ir al inicio</button></div>
          </div>
          <div id="${id}-tab-full" class="tab-panel">
            <div id="${id}-table"><p class="text-muted">Pulsa "Resolver completo".</p></div>
          </div>
        </div>
      </div>
    </div>`, 'Mult./Div. en Punto Flotante');

    bindTabs(id);
    const regNames = [];

    function getConfig() {
      return { signBits: 1, expBits: parseInt(document.getElementById(id + '-exp').value), mantBits: parseInt(document.getElementById(id + '-mant').value), bias: document.getElementById(id + '-bias').value };
    }

    // Quick format buttons
    document.querySelectorAll(`#${id}-fmt-simple, #${id}-fmt-half, #${id}-fmt-double`).forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll(`#${id}-fmt-simple, #${id}-fmt-half, #${id}-fmt-double`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(id + '-exp').value  = btn.dataset.exp;
        document.getElementById(id + '-mant').value = btn.dataset.mant;
        document.getElementById(id + '-bias').value = btn.dataset.bias;
      });
    });

    // Deactivate quick buttons when user edits manually
    [id + '-exp', id + '-mant', id + '-bias'].forEach(fid => {
      document.getElementById(fid)?.addEventListener('input', () => {
        document.querySelectorAll(`#${id}-fmt-simple, #${id}-fmt-half, #${id}-fmt-double`).forEach(b => {
          const match = b.dataset.exp === document.getElementById(id + '-exp').value &&
                        b.dataset.mant === document.getElementById(id + '-mant').value &&
                        b.dataset.bias === document.getElementById(id + '-bias').value;
          b.classList.toggle('active', match);
        });
      });
    });

    bindStepControls(id, regNames);

    document.getElementById(id + '-init').addEventListener('click', () => {
      clearAlert(id);
      const res = window.AC.FloatMulDiv.compute(nd(document.getElementById(id + '-dec1').value), nd(document.getElementById(id + '-dec2').value), document.getElementById(id + '-op').value, getConfig());
      if (!res.valid) { showAlert(id, res.error); return; }
      setupStepController(id, { steps: res.steps, registerNames: regNames });
      document.getElementById(id + '-reinit').disabled = false;
    });

    document.getElementById(id + '-solve').addEventListener('click', () => {
      clearAlert(id);
      const res = window.AC.FloatMulDiv.compute(nd(document.getElementById(id + '-dec1').value), nd(document.getElementById(id + '-dec2').value), document.getElementById(id + '-op').value, getConfig());
      if (!res.valid) { showAlert(id, res.error); return; }
      renderFullTable(id, res.steps, regNames);
      document.querySelector(`[data-tab="${id}-tab-full"]`).click();
    });

    document.getElementById(id + '-reset').addEventListener('click', () => resetCalcUI(id));

    examples.forEach((ex, i) => {
      document.querySelector(`[data-ex="${id}-${i}"]`)?.addEventListener('click', () => {
        document.getElementById(id + '-dec1').value  = ex.dec1;
        document.getElementById(id + '-dec2').value  = ex.dec2;
        document.getElementById(id + '-op').value    = ex.op;
        document.getElementById(id + '-exp').value   = ex.expBits;
        document.getElementById(id + '-mant').value  = ex.mantBits;
        document.getElementById(id + '-bias').value  = ex.bias;
        // sync quick-format active state
        document.querySelectorAll(`#${id}-fmt-simple, #${id}-fmt-half, #${id}-fmt-double`).forEach(b => {
          b.classList.toggle('active', b.dataset.exp === ex.expBits && b.dataset.mant === ex.mantBits && b.dataset.bias === ex.bias);
        });
      });
    });
  }

  // --- EJERCICIOS ---
  function viewEjercicios(topic) {
    const exercises = window.AC.Exercises;
    const topics = [...new Set(exercises.map(e => e.topic))];

    const topicLabels = {
      suma_resta: 'Suma y Resta Binaria',
      sumadores: 'Sumadores',
      carry_anticipado: 'Carry Anticipado',
      multiplicacion: 'Multiplicación',
      division: 'División con Restauración',
      float_repr: 'Representación en Punto Flotante',
      float_addsub: 'Suma/Resta en Punto Flotante',
      float_muldiv: 'Multiplicación/División en Punto Flotante'
    };

    let html = '<div>';

    topics.forEach(t => {
      const topicExs = exercises.filter(e => e.topic === t);
      html += `<div class="exercises-section">
        <h3>${topicLabels[t] || t}</h3>`;

      topicExs.forEach(ex => {
        html += `<div class="exercise-card">
          <h4>${F().escapeHtml(ex.title)}</h4>
          <p class="exercise-statement">${F().escapeHtml(ex.statement)}</p>
          <div class="exercise-hint" id="hint-${ex.id}">
            <strong>Pista:</strong> ${F().escapeHtml(ex.hint)}
          </div>
          <div class="exercise-actions">
            <button class="btn btn-outline" onclick="toggleHint('${ex.id}')">Mostrar pista</button>
            <button class="btn btn-primary" onclick="solveExercise('${ex.id}')">Resolver paso a paso</button>
          </div>
          <div class="exercise-solution" id="sol-${ex.id}"></div>
        </div>`;
      });

      html += '</div>';
    });

    html += '</div>';
    render(html, 'Ejercicios');

    window.toggleHint = function (exId) {
      const el = document.getElementById('hint-' + exId);
      if (el) el.classList.toggle('visible');
    };

    window.solveExercise = function (exId) {
      const ex = exercises.find(e => e.id === exId);
      if (!ex) return;
      const inp = ex.inputs;
      let res;

      try {
        if (ex.solveWith === 'multiply2') {
          res = window.AC.Multiply2.compute(inp.M, inp.Q);
        } else if (ex.solveWith === 'divisionRestoring') {
          res = window.AC.DivisionRestoring.compute(inp.Q, inp.M);
        } else if (ex.solveWith === 'parallelAdder') {
          res = window.AC.Adders.parallelAdderSteps(inp.A, inp.B);
        } else if (ex.solveWith === 'carryLookahead') {
          res = window.AC.Adders.carryLookaheadSteps(inp.A, inp.B, inp.C0 || '0');
        } else if (ex.solveWith === 'floatRepr') {
          res = window.AC.FloatRepr.decToFloat(inp.decimal.toString(), { signBits: 1, expBits: inp.expBits, mantBits: inp.mantBits, bias: inp.bias });
        } else if (ex.solveWith === 'floatAddSub') {
          res = window.AC.FloatAddSub.compute(inp.dec1, inp.dec2, inp.op, { signBits: 1, expBits: inp.expBits, mantBits: inp.mantBits, bias: inp.bias });
        } else if (ex.solveWith === 'floatMulDiv') {
          res = window.AC.FloatMulDiv.compute(inp.dec1, inp.dec2, inp.op, { signBits: 1, expBits: inp.expBits, mantBits: inp.mantBits, bias: inp.bias });
        } else if (ex.solveWith === 'multiply1') {
          res = window.AC.Multiply1.compute(inp.MD || inp.M, inp.MR || inp.Q);
        }
      } catch (e) { res = { valid: false, error: e.message }; }

      const solEl = document.getElementById('sol-' + exId);
      if (!solEl) return;
      solEl.classList.add('visible');

      if (!res || !res.valid) {
        solEl.innerHTML = `<div class="alert alert-error">${F().escapeHtml(res ? res.error : 'Error desconocido')}</div>`;
        return;
      }

      const regMap = {
        multiply2: ['Iteración', 'MD', 'C', 'PP', 'MR'],
        divisionRestoring: ['A', 'Q', 'M'],
        parallelAdder: ['A[i]', 'B[i]', 'Cin', 'S', 'Cout'],
        carryLookahead: [],
        floatRepr: ['Signo', 'Exponente', 'Mantisa'],
        floatAddSub: [],
        floatMulDiv: [],
        multiply1: ['Cuenta', 'MD', 'PP', 'MR']
      };

      solEl.innerHTML = F().renderAlgorithmTable(res.steps, regMap[ex.solveWith] || []);
    };
  }

  // --- PENDIENTE ---
  function viewPending(title) {
    render(`<div class="pending-msg">
      <h3>${title}</h3>
      <p>Esta sección está preparada estructuralmente y se implementará en la próxima entrega.</p>
      <p style="margin-top:12px">Mientras tanto, puedes usar las calculadoras ya disponibles en las demás secciones.</p>
    </div>`, title);
  }

  // --- UTILIDAD: resetear UI del calculador ---
  function resetCalcUI(id) {
    resetCalc();
    const stepEl = document.getElementById(id + '-step');
    if (stepEl) stepEl.innerHTML = '<p class="text-muted">Introduce los datos y pulsa "Inicializar".</p>';
    const tableEl = document.getElementById(id + '-table');
    if (tableEl) tableEl.innerHTML = '<p class="text-muted">Pulsa "Resolver completo" para ver todos los pasos.</p>';
    const counter = document.getElementById(id + '-counter');
    if (counter) counter.textContent = '—';
    const prog = document.getElementById(id + '-progress');
    if (prog) prog.style.width = '0%';
    ['prev', 'next', 'reinit'].forEach(btn => {
      const el = document.getElementById(id + '-' + btn);
      if (el) el.disabled = true;
    });
  }

  // --- CALC GENÉRICO (para módulos simples) ---
  function bindCalc(id, module, regNames, examples) {
    bindStepControls(id, regNames);

    document.getElementById(id + '-init').addEventListener('click', () => {
      clearAlert(id);
      const M = document.getElementById(id + '-M').value.trim();
      const Q = document.getElementById(id + '-Q').value.trim();
      const res = module.compute(M, Q);
      if (!res.valid) { showAlert(id, res.error); return; }
      setupStepController(id, { steps: res.steps, registerNames: regNames });
      document.getElementById(id + '-reinit').disabled = false;
    });

    document.getElementById(id + '-solve').addEventListener('click', () => {
      clearAlert(id);
      const M = document.getElementById(id + '-M').value.trim();
      const Q = document.getElementById(id + '-Q').value.trim();
      const res = module.compute(M, Q);
      if (!res.valid) { showAlert(id, res.error); return; }
      renderFullTable(id, res.steps, regNames);
      document.querySelector(`[data-tab="${id}-tab-full"]`).click();
    });

    document.getElementById(id + '-reset').addEventListener('click', () => resetCalcUI(id));

    if (examples) {
      examples.forEach((ex, i) => {
        document.querySelector(`[data-ex="${id}-${i}"]`)?.addEventListener('click', () => {
          if (ex.M) document.getElementById(id + '-M').value = ex.M;
          if (ex.Q) document.getElementById(id + '-Q').value = ex.Q;
        });
      });
    }
  }

  // ====== AYUDA ======
  function viewAyuda() {
    render(`<div class="help-page">
      <div class="help-toolbar">
        <h2>Manual de Uso</h2>
        <button class="btn btn-primary" onclick="exportHelpPDF()">Exportar PDF</button>
      </div>
      <div id="help-content" class="help-body"></div>
    </div>`, 'Ayuda');

    const md = (window.AC.Help && window.AC.Help.content) || '*Contenido no disponible.*';
    const el = document.getElementById('help-content');
    if (window.marked) {
      el.innerHTML = window.marked.parse(md);
    } else {
      el.innerHTML = '<pre style="white-space:pre-wrap">' + md + '</pre>';
    }
  }

  window.exportHelpPDF = function () {
    const el = document.getElementById('help-content');
    if (!el) return;
    const css = `
      body{font-family:'Segoe UI',system-ui,sans-serif;font-size:10.5pt;margin:24pt;color:#222;line-height:1.55}
      h1{color:#1a3a6a;font-size:17pt;border-bottom:2pt solid #1a3a6a;padding-bottom:6pt;margin-bottom:12pt}
      h2{color:#1a3a6a;font-size:13pt;margin-top:18pt;border-bottom:.5pt solid #ccc;padding-bottom:3pt}
      h3{color:#1a3a6a;font-size:11pt;margin-top:12pt}
      h4{color:#333;font-size:10pt;margin-top:10pt}
      table{border-collapse:collapse;width:100%;font-size:9pt;margin:8pt 0}
      th{background:#1a3a6a;color:#fff;padding:4pt 8pt;text-align:left;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      td{padding:3pt 8pt;border-bottom:.5pt solid #ddd}
      code{font-family:'Consolas','Courier New',monospace;background:#f4f4f4;padding:1pt 4pt;border-radius:3pt;font-size:8.5pt}
      pre{background:#f4f4f4;padding:8pt;border-radius:4pt;font-size:8pt;overflow:hidden}
      blockquote{border-left:3pt solid #1a3a6a;margin:6pt 0;padding:4pt 10pt;color:#555;font-size:9.5pt}
      img{max-width:100%;height:auto;border:1pt solid #ccc;border-radius:4pt;margin:6pt 0}
      hr{border:none;border-top:.5pt solid #ccc;margin:14pt 0}
      p{margin:4pt 0 8pt}
      ul,ol{margin:4pt 0 8pt;padding-left:18pt}
      li{margin-bottom:2pt}
      @media print{button{display:none}}
    `;
    const w = window.open('', '_blank');
    if (!w) { alert('El navegador bloqueó la ventana emergente.'); return; }
    w.document.write(`<!DOCTYPE html><html lang="es"><head>
      <meta charset="UTF-8">
      <title>Manual de Uso — Procesamiento Aritmético</title>
      <style>${css}</style>
    </head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 400);
  };

  // ====== RUTAS ======
  function setupRoutes() {
    R.on('inicio', viewInicio);
    R.on('sumadores', viewSumadorParalelo);
    R.on('sumadores/repaso', viewRepaso);
    R.on('sumadores/semi', viewSemiSumador);
    R.on('sumadores/completo', viewSumadorCompleto);
    R.on('sumadores/paralelo', viewSumadorParalelo);
    R.on('sumadores/anticipado', viewCarryAnticipado);
    R.on('sumadores/calc-anticipado', viewCarryAnticipado);
    R.on('multiplicacion', viewMult1);
    R.on('multiplicacion/clasica', viewMult1);
    R.on('multiplicacion/alg2', viewMult2);
    R.on('division', viewDivision);
    R.on('division/restauracion', viewDivision);
    R.on('flotante', viewFloatRepr);
    R.on('flotante/representacion', viewFloatRepr);
    R.on('flotante/sumaresta', viewFloatAddSub);
    R.on('flotante/muldiv', viewFloatMulDiv);
    R.on('ejercicios', viewEjercicios);
    R.on('ayuda', viewAyuda);
    R.on('404', () => render('<div class="pending-msg"><h3>Sección no encontrada</h3><p>Usa el menú para navegar.</p></div>', 'No encontrado'));
  }

  // ====== SIDEBAR TOGGLE (MÓVIL) ======
  function setupMobileMenu() {
    const toggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    toggle?.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('visible');
    });

    overlay?.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('visible');
    });
  }

  // ====== INICIALIZACIÓN ======
  document.addEventListener('DOMContentLoaded', () => {
    setupRoutes();
    setupMobileMenu();
    R.init();
  });

})();
