/**
 * menu.js — inyecta el menú lateral en todas las páginas de la app
 * Incluir DESPUÉS de auth.js
 */
(function () {
  const menuHTML = `
    <div class="menu-overlay hidden" id="menu-overlay"></div>
    <aside class="side-menu hidden" id="side-menu">
      <div class="side-menu-header">
        <button class="menu-close-btn" id="menu-close-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="side-menu-logo-wrap">
        <div class="app-logo-circle" style="margin:0 auto 12px; width:80px; height:80px;">
          <svg viewBox="0 0 100 100" fill="none" width="42" height="42">
            <path d="M50 22 L70 38 L70 68 L30 68 L30 38 Z" stroke="#2D6A50" stroke-width="2.5" fill="none"/>
            <path d="M42 68 L42 52 L58 52 L58 68" stroke="#2D6A50" stroke-width="2.5" fill="none"/>
            <circle cx="50" cy="34" r="5" stroke="#2D6A50" stroke-width="2.5" fill="none"/>
            <path d="M24 40 L50 22 L76 40" stroke="#2D6A50" stroke-width="2.5" fill="none"/>
          </svg>
          <span>Cielito Home</span>
        </div>
      </div>
      <h2 class="side-menu-question">¿Que necesitas hoy?</h2>
      <nav class="side-menu-nav">
        <a href="acerca.html" class="side-menu-item" data-page="acerca">
          <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8" stroke="white" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="12" x2="12" y2="16" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
          Acerca de
        </a>
        <a href="ajustes.html" class="side-menu-item" data-page="ajustes">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
          Ajustes
        </a>
        <a href="soporte.html" class="side-menu-item" data-page="soporte">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Soporte Técnico
        </a>
        <a href="condiciones.html" class="side-menu-item" data-page="condiciones">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          Términos y Condiciones
        </a>
        <a href="#" class="side-menu-item" id="menu-logout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Cerrar Sesión
        </a>
      </nav>
    </aside>`;

  // Insertar al inicio del body
  document.body.insertAdjacentHTML('afterbegin', menuHTML);

  // Marcar item activo según la página actual
  const page = window.location.pathname.split('/').pop().replace('.html', '');
  document.querySelectorAll('.side-menu-item[data-page]').forEach(item => {
    if (item.dataset.page === page) item.classList.add('active');
  });

  // Abrir menú
  const openBtn = document.getElementById('menu-open-btn');
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      document.getElementById('side-menu').classList.remove('hidden');
      document.getElementById('menu-overlay').classList.remove('hidden');
    });
  }

  // Cerrar menú
  function cerrarMenu() {
    document.getElementById('side-menu').classList.add('hidden');
    document.getElementById('menu-overlay').classList.add('hidden');
  }

  document.getElementById('menu-close-btn').addEventListener('click', cerrarMenu);
  document.getElementById('menu-overlay').addEventListener('click', cerrarMenu);
  document.getElementById('menu-logout').addEventListener('click', (e) => {
    e.preventDefault();
    Auth.logout();
  });
})();
