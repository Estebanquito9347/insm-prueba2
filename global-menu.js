(function () {
  if (window.__globalMenuInitialized) return;
  window.__globalMenuInitialized = true;

  const GLOBAL_MENU_ID = 'globalSideMenu';
  const BACKDROP_ID = 'globalMenuBackdrop';

  function siteHref(path) {
    const script = document.querySelector('script[src*="global-menu.js"]');
    const siteRoot = script ? new URL('.', script.src).href : window.location.href;
    return new URL(path, siteRoot).href;
  }

  function cleanupLegacyMenus() {
    document.querySelectorAll('.side-menu').forEach((menu) => {
      if (menu.id !== GLOBAL_MENU_ID) {
        menu.remove();
      }
    });

    document.querySelectorAll('.menu-icon').forEach((icon) => {
      icon.removeAttribute('onclick');
      icon.setAttribute('data-global-menu-trigger', 'true');
    });

    document.querySelectorAll('[onclick*="toggleSideMenu"]').forEach((element) => {
      element.removeAttribute('onclick');
    });
  }

  function initGlobalMenu() {
    const existing = document.getElementById(GLOBAL_MENU_ID);
    if (existing) return;

    const backdrop = document.createElement('div');
    backdrop.id = BACKDROP_ID;
    backdrop.className = 'global-menu-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');

    const menu = document.createElement('aside');
    menu.id = GLOBAL_MENU_ID;
    menu.className = 'global-side-menu';
    menu.setAttribute('aria-label', 'Índice global');

    const header = document.createElement('div');
    header.className = 'global-menu-header';

    const title = document.createElement('h3');
    title.className = 'global-menu-title';
    title.textContent = 'Índice de Sección';

    const closeButton = document.createElement('button');
    closeButton.className = 'global-menu-close';
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Cerrar menú');
    closeButton.textContent = '×';
    closeButton.addEventListener('click', () => toggleGlobalMenu(false));

    header.appendChild(title);
    header.appendChild(closeButton);

    const tree = document.createElement('ul');
    tree.className = 'global-menu-tree';
    tree.appendChild(buildMenuItem('INICIO', null, [
      { href: siteHref('index.html') }
    ]));
    tree.appendChild(buildMenuItem('INSTITUCIÓN', [
      { label: 'Sobre Nosotros', href: siteHref('NuestroColegio.html#quienes-somos') },
      { label: 'Nuestra Trayectoria', href: siteHref('NuestroColegio.html#trayectoria') },
      { label: 'Misión y Valores', href: siteHref('NuestroColegio.html#mision') }
    ]));
    tree.appendChild(buildMenuItem('NIVELES - CATEGORÍAS', [
      { label: 'Nivel Inicial', children: [
        { label: 'Información General', href: siteHref('NivelInicial.html#bienvenida') },
        { label: 'Orientaciones', href: siteHref('NivelInicial.html#especialidades') },
        { label: 'Uniforme', href: siteHref('NivelInicial.html#uniforme') },
        { label: 'Inscripción', href: siteHref('NivelInicial.html#requerimientos') },
        { label: 'Proyectos', href: siteHref('ProyectosInicial.html') }
      ]},
      { label: 'Nivel Primario', children: [
        { label: 'Información General', href: siteHref('NivelPrimario.html#bienvenida') },
        { label: 'Orientaciones', href: siteHref('NivelPrimario.html#especialidades') },
        { label: 'Uniforme', href: siteHref('NivelPrimario.html#uniforme') },
        { label: 'Inscripción', href: siteHref('NivelPrimario.html#requerimientos') },
        { label: 'Proyectos', href: siteHref('ProyectosPrimario.html') }
      ]},
      { label: 'Nivel Secundario', children: [
        { label: 'Información General', href: siteHref('NivelSecundario.html#bienvenida') },
        { label: 'Orientaciones', href: siteHref('NivelSecundario.html#especialidades') },
        { label: 'Uniforme', href: siteHref('NivelSecundario.html#uniforme') },
        { label: 'Inscripción', href: siteHref('NivelSecundario.html#requerimientos') },
        { label: 'Proyectos', href: siteHref('ProyectosSecundario.html') }
      ]},
      { label: 'Nivel Terciario', children: [
        { label: 'Información General', href: siteHref('NivelTerciario.html#bienvenida') },
        { label: 'Orientaciones', href: siteHref('NivelTerciario.html#especialidades') },
        { label: 'Uniforme', href: siteHref('NivelTerciario.html#uniforme') },
        { label: 'Inscripción', href: siteHref('NivelTerciario.html#requerimientos') },
        { label: 'Proyectos', href: siteHref('ProyectosTerciario.html') }
      ]}
    ]));
    tree.appendChild(buildMenuItem('EXPLORÁ', [
      { label: 'Contacto', href: siteHref('Contacto.html#info-contacto') },
      { label: 'Inscripciones 2027', href: siteHref('Inscripcion2027.html') }
    ]));

    menu.appendChild(header);
    menu.appendChild(tree);
    document.body.appendChild(backdrop);
    document.body.appendChild(menu);

    backdrop.addEventListener('click', () => toggleGlobalMenu(false));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') toggleGlobalMenu(false);
    });
  }

  function buildMenuItem(label, children, singleLink) {
    const item = document.createElement('li');
    const hasChildren = Array.isArray(children) && children.length > 0;
    item.className = 'global-tree-item' + (hasChildren ? ' has-children' : ' root-item');

    if (hasChildren) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'global-tree-toggle';
      const arrow = document.createElement('span');
      arrow.className = 'global-tree-arrow';
      arrow.textContent = '▶';
      const text = document.createElement('span');
      text.textContent = label;
      button.appendChild(arrow);
      button.appendChild(text);
      button.addEventListener('click', () => {
        const parent = button.parentElement;
        parent.classList.toggle('open');
      });

      const list = document.createElement('ul');
      list.className = 'global-tree-children';
      children.forEach((child) => {
        if (child.children && Array.isArray(child.children)) {
          list.appendChild(buildMenuItem(child.label, child.children));
        } else {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = child.href;
          a.textContent = child.label;
          a.addEventListener('click', () => toggleGlobalMenu(false));
          li.appendChild(a);
          list.appendChild(li);
        }
      });

      item.appendChild(button);
      item.appendChild(list);
    } else if (singleLink && singleLink.length) {
      const link = document.createElement('a');
      link.href = singleLink[0].href;
      link.className = 'global-tree-toggle';
      const arrow = document.createElement('span');
      arrow.className = 'global-tree-arrow';
      arrow.textContent = '◀';
      const text = document.createElement('span');
      text.textContent = label;
      link.appendChild(arrow);
      link.appendChild(text);
      link.addEventListener('click', () => toggleGlobalMenu(false));
      item.appendChild(link);
    }

    return item;
  }

  function toggleGlobalMenu(forceState) {
    const menu = document.getElementById(GLOBAL_MENU_ID);
    const backdrop = document.getElementById(BACKDROP_ID);
    if (!menu || !backdrop) return;

    const nextState = typeof forceState === 'boolean' ? forceState : !menu.classList.contains('active');
    menu.classList.toggle('active', nextState);
    backdrop.classList.toggle('active', nextState);
    document.body.classList.toggle('no-scroll', nextState);
    document.documentElement.classList.toggle('no-scroll', nextState);
  }

  window.toggleGlobalMenu = toggleGlobalMenu;
  window.toggleSideMenu = toggleGlobalMenu;
  window.toggleMenu = toggleGlobalMenu;

  function bindTrigger() {
    document.addEventListener('click', (event) => {
      const icon = event.target.closest('.menu-icon');
      if (!icon) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      toggleGlobalMenu();
    }, true);
  }

  function init() {
    cleanupLegacyMenus();
    initGlobalMenu();
    bindTrigger();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
