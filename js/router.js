// Enrutador basado en hash para navegación entre secciones
window.AC = window.AC || {};

window.AC.Router = (function () {
  const handlers = {};
  let currentSection = null;

  function on(hash, handler) {
    handlers[hash] = handler;
  }

  function navigate(hash) {
    window.location.hash = '#' + hash;
  }

  function getHash() {
    return window.location.hash.replace('#', '') || 'inicio';
  }

  function dispatch() {
    const hash = getHash();
    const parts = hash.split('/');
    const section = parts[0];

    // Actualizar navegación activa
    document.querySelectorAll('.nav-link').forEach(el => {
      el.classList.remove('active');
      if (el.dataset.section === section || el.dataset.section === hash) {
        el.classList.add('active');
      }
    });

    // Colapsar submenús y expandir el activo
    document.querySelectorAll('.nav-submenu').forEach(el => {
      el.classList.remove('open');
    });
    const activeParent = document.querySelector(`.nav-link[data-section="${section}"]`);
    if (activeParent) {
      const submenu = activeParent.parentElement.querySelector('.nav-submenu');
      if (submenu) submenu.classList.add('open');
    }

    if (handlers[hash]) {
      handlers[hash]();
      currentSection = hash;
    } else if (handlers[section]) {
      handlers[section](parts.slice(1));
      currentSection = section;
    } else if (handlers['404']) {
      handlers['404']();
    }
  }

  function init() {
    window.addEventListener('hashchange', dispatch);
    dispatch();
  }

  return { on, navigate, init, getHash, dispatch };
})();
