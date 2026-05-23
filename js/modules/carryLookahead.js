// Calculadora de carry anticipado — interfaz y lógica extendida
// (La lógica principal está en adders.js; este módulo provee la interfaz de calculadora)
window.AC = window.AC || {};

window.AC.CarryLookahead = (function () {

  function compute(a_str, b_str, c0_str) {
    if (!window.AC.Adders) {
      return { valid: false, error: 'Módulo de sumadores no cargado.', steps: [] };
    }
    return window.AC.Adders.carryLookaheadSteps(a_str, b_str, c0_str);
  }

  return { compute };
})();
