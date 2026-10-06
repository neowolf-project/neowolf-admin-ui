'use strict';

(() => {
    const tree = document.getElementById('details-page-tree');
    const toggleAll = document.getElementById('details-toggle-all');
    const reset = document.getElementById('details-reset');
    const status = document.getElementById('details-tree-status');

    if (!(tree instanceof HTMLElement)) return;

    const nodes = () => [...tree.querySelectorAll('details.details-tree-node')];
    const allOpen = () => nodes().length > 0 && nodes().every((node) => node.open);

    const announce = (message) => {
        if (!(status instanceof HTMLElement)) return;
        status.textContent = '';
        requestAnimationFrame(() => { status.textContent = message; });
    };

    const syncToggle = () => {
        if (!(toggleAll instanceof HTMLButtonElement)) return;
        const expanded = allOpen();
        const label = expanded ? 'Collapse all' : 'Expand all';
        toggleAll.setAttribute('aria-label', label);
        toggleAll.dataset.tooltip = label;
    };

    tree.addEventListener('toggle', (event) => {
        if (event.target instanceof HTMLDetailsElement) syncToggle();
    }, true);

    toggleAll?.addEventListener('click', () => {
        const open = !allOpen();
        nodes().forEach((node) => { node.open = open; });
        syncToggle();
        announce(open ? 'All pages expanded.' : 'All pages collapsed.');
    });

    reset?.addEventListener('click', () => {
        nodes().forEach((node) => { node.open = node.dataset.depth === '0'; });
        syncToggle();
        announce('Page tree expansion reset.');
    });

    syncToggle();
})();
