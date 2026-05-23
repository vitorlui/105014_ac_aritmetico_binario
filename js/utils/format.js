// Utilidades de formateo y visualización
window.AC = window.AC || {};

window.AC.Format = (function () {

  // Formatea una cadena binaria con resaltado de bits específicos
  // highlights: array de índices de bits a resaltar (base 0, desde la izquierda)
  function formatBinHighlight(binStr, highlights, cssClass) {
    if (!binStr) return '';
    const cls = cssClass || 'bit-highlight';
    const hlSet = new Set(highlights || []);
    return binStr.split('').map((bit, i) => {
      if (hlSet.has(i)) {
        return `<span class="${cls}">${bit}</span>`;
      }
      return `<span class="bit">${bit}</span>`;
    }).join('');
  }

  // Resalta el bit Q0 (LSB = último índice)
  function formatBinHighlightQ0(binStr) {
    if (!binStr) return '';
    const last = binStr.length - 1;
    return binStr.split('').map((bit, i) => {
      if (i === last) {
        return `<span class="bit-q0">${bit}</span>`;
      }
      return `<span class="bit">${bit}</span>`;
    }).join('');
  }

  // Genera el HTML de una tabla de registros
  function renderRegisters(registers, highlights) {
    if (!registers || Object.keys(registers).length === 0) return '';
    highlights = highlights || {};
    let html = '<div class="registers-row">';
    for (const [name, value] of Object.entries(registers)) {
      const hl = highlights[name] || [];
      const isSpecial = ['C', 'M'].includes(name);
      html += `<div class="register-cell ${isSpecial ? 'register-special' : ''}">
        <span class="register-label">${name}</span>
        <span class="register-value mono">${formatBinHighlight(value, hl)}</span>
      </div>`;
    }
    html += '</div>';
    return html;
  }

  // Genera el HTML de una tarjeta de paso
  function renderStepCard(step, expanded) {
    const isResult = step.isResult || false;
    const cardClass = isResult ? 'step-card step-card--result' : 'step-card';
    return `<div class="${cardClass}" data-step="${step.stepNumber}">
      <div class="step-header">
        <span class="step-number">Paso ${step.stepNumber}</span>
        <span class="step-title">${escapeHtml(step.title)}</span>
      </div>
      ${renderRegisters(step.registers, step.highlight)}
      <div class="step-operation${step.operationHtml ? '' : ' mono'}">${step.operationHtml || escNl(step.operation)}</div>
      <div class="step-explanation">${escNl(step.explanation)}</div>
    </div>`;
  }

  // Genera una fila de tabla para steps con columnas fijas
  function renderStepTableRow(step, columns) {
    let cells = columns.map(col => {
      const val = step[col] !== undefined ? step[col] : '';
      return `<td class="mono">${escapeHtml(String(val))}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }

  // Renderiza una tabla de pasos del algoritmo
  function renderAlgorithmTable(steps, registerNames) {
    if (!steps || steps.length === 0) return '<p class="text-muted">Sin pasos para mostrar.</p>';

    const headers = ['#', 'Título', ...registerNames, 'Operación', 'Explicación'];
    let html = '<div class="table-responsive"><table class="algorithm-table"><thead><tr>';
    headers.forEach(h => { html += `<th>${h}</th>`; });
    html += '</tr></thead><tbody>';

    steps.forEach(step => {
      html += '<tr' + (step.isResult ? ' class="row-result"' : '') + '>';
      html += `<td class="mono">${step.stepNumber}</td>`;
      html += `<td class="title-cell">${escapeHtml(step.title)}</td>`;
      registerNames.forEach(reg => {
        const val = step.registers ? (step.registers[reg] !== undefined ? step.registers[reg] : '—') : '—';
        const isResultHl = step.isResult && step.highlight && step.highlight[reg] !== undefined;
        html += `<td class="mono${isResultHl ? ' td-result-hl' : ''}">${escapeHtml(val)}</td>`;
      });
      html += `<td class="${step.operationHtml ? '' : 'mono '}step-op-cell">${step.operationHtml || escNl(step.operation || '')}</td>`;
      html += `<td class="explanation-cell">${escNl(step.explanation || '')}</td>`;
      html += '</tr>';
    });

    html += '</tbody></table></div>';
    return html;
  }

  // Genera el panel de paso actual (modo paso a paso)
  function renderCurrentStep(step) {
    if (!step) return '<p class="text-muted">Pulsa "Inicializar" para empezar.</p>';
    const isResult = step.isResult || false;
    return `<div class="current-step-panel ${isResult ? 'current-step--result' : ''}">
      <div class="current-step-header">
        <span class="badge-step">Paso ${step.stepNumber}</span>
        <strong>${escapeHtml(step.title)}</strong>
      </div>
      <div class="current-step-registers">
        ${renderRegisters(step.registers, step.highlight)}
      </div>
      <div class="current-step-op">
        <span class="label-op">Operación:</span>
        ${step.operationHtml
          ? `<div>${step.operationHtml}</div>`
          : `<span class="mono">${escNl(step.operation || '')}</span>`}
      </div>
      <div class="current-step-expl">
        <span class="label-expl">Explicación:</span>
        <p>${escNl(step.explanation || '')}</p>
      </div>
    </div>`;
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escNl(str) {
    return escapeHtml(str)
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>')
      .replace(/ {2}/g, '&nbsp;&nbsp;');
  }

  // Genera la tabla de verdad HTML
  function renderTruthTable(rows, headers) {
    let html = '<table class="truth-table"><thead><tr>';
    headers.forEach(h => { html += `<th>${h}</th>`; });
    html += '</tr></thead><tbody>';
    rows.forEach(row => {
      html += '<tr>';
      headers.forEach(h => { html += `<td class="mono">${row[h]}</td>`; });
      html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  return {
    formatBinHighlight,
    formatBinHighlightQ0,
    renderRegisters,
    renderStepCard,
    renderAlgorithmTable,
    renderCurrentStep,
    escapeHtml,
    escNl,
    renderTruthTable
  };
})();
