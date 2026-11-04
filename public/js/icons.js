/* Inline SVG icon set (stroke icons, 24x24 grid). Exposed as window.VB_ICONS. */
(function () {
  'use strict';
  const p = {
    bath: '<path d="M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-3z"/><path d="M6 12V5a2 2 0 0 1 3.5-1.3"/><path d="M7 20l-1 2M17 20l1 2"/>',
    grid: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
    palette: '<path d="M12 22a10 10 0 1 1 10-10c0 2.8-2.2 4-4 4h-1.8a1.8 1.8 0 0 0-1.3 3.1A1.6 1.6 0 0 1 12 22z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="10.5" cy="6.5" r="1"/><circle cx="15.5" cy="7.5" r="1"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7l10-5z"/><path d="m2 12 10 5 10-5"/><path d="m2 17 10 5 10-5"/>',
    cabinet: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16M9 10v2M15 10v2"/>',
    gem: '<path d="M6 3h12l4 6-10 12L2 9l4-6z"/><path d="M2 9h20M12 21 8 9l4-6 4 6-4 12"/>',
    door: '<rect x="5" y="2" width="14" height="20" rx="1"/><path d="M12 2v20M9.5 11v2M14.5 11v2"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0 5 5l-9.4 9.4a2.1 2.1 0 0 1-3-3l9.4-9.4a4 4 0 0 0-5-5l2.6 2.6-.6 2.4-2.4.6-2.6-2.6"/>',
    mirror: '<rect x="5" y="2" width="14" height="20" rx="7"/><path d="M9 8l3-3M9 12l6-6"/>',
    dots: '<circle cx="5" cy="5" r="1.4"/><circle cx="12" cy="5" r="1.4"/><circle cx="19" cy="5" r="1.4"/><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/><circle cx="5" cy="19" r="1.4"/><circle cx="12" cy="19" r="1.4"/><circle cx="19" cy="19" r="1.4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    accessible: '<circle cx="12" cy="4" r="2"/><path d="M12 7v6h5l2 6"/><path d="M8 10a6 6 0 1 0 8 8"/><path d="M8 9h7"/>',
    noImage: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m3 3 18 18"/><path d="m21 15-5-5-3 3"/><circle cx="8.5" cy="8.5" r="1.5"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    party: '<path d="M5.8 11.3 2 22l10.7-3.8"/><path d="M4 3h.01M22 8h.01M15 2h.01M22 20h.01"/><path d="m22 2-2.2.8a2.9 2.9 0 0 0-1.9 3.2c.1.9-.6 1.7-1.5 1.7h-.4c-.9 0-1.6.7-1.6 1.6V10"/><path d="M11 13c1.9 1.9 2.4 4.4 1.3 5.5S8.6 18.9 6.7 17 4.3 12.6 5.4 11.5 9.1 11.1 11 13z"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>'
  };
  window.VB_ICONS = function icon(name, size = 16, cls = '') {
    return `<svg class="ico ${cls}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${p[name] || ''}</svg>`;
  };
})();
