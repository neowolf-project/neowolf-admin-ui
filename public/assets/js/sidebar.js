'use strict';

(() => {
    const compactSidebar = window.matchMedia(
        '(max-width: 80rem) and (min-width: 30.001rem)'
    );

    function syncTooltips() {
        document.querySelectorAll('.admin-sidebar nav a').forEach((link) => {
            const label = link.querySelector('.nav-label');

            if (compactSidebar.matches && label) {
                link.dataset.tooltip = label.textContent.trim();
                link.dataset.placement = 'right';
            } else {
                delete link.dataset.tooltip;
                delete link.dataset.placement;
            }
        });
    }

    compactSidebar.addEventListener('change', syncTooltips);
    syncTooltips();
})();