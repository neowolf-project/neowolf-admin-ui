'use strict';

window.Neowolf = window.Neowolf || {};

(() => {
    const Neowolf = window.Neowolf;
    const pageTree = document.getElementById('page-tree');
    const api = Neowolf.pageTree;

    if (!(pageTree instanceof HTMLElement) || !api) {
        return;
    }

    pageTree.dataset.frontendOrigin =
        window.location.hostname === 'admin-ui.neowolf.site'
            ? 'https://neowolf.site'
            : 'https://demo.neowolf.test';

    api.refresh();

    const resetButton = document.getElementById('reset-tree');
    const statusRegion =
        document.getElementById('tree-demo-message')
        ?? pageTree.querySelector('[data-page-tree-status]');

    const storageKey =
        pageTree.dataset.demoStorageKey
        ?? 'neowolf-page-tree-demo-v4';
    const collapsedStorageKey =
        pageTree.dataset.demoCollapsedStorageKey
        ?? 'neowolf-page-tree-collapsed-v1';

    const legacyStorageKeys = [
        'neowolf-page-tree-demo',
        'neowolf-page-tree-demo-v2',
        'neowolf-page-tree-demo-v3',
    ];

    const initialTree = structuredClone(api.serialize());
    const initialCollapsedPageIds = api.getCollapsedPageIds();

    function announce(message) {
        if (Neowolf.tree?.announce) {
            Neowolf.tree.announce(statusRegion, message);
            return;
        }

        if (statusRegion) {
            statusRegion.textContent = message;
        }
    }

    function saveTree(tree = api.serialize()) {
        try {
            localStorage.setItem(
                storageKey,
                JSON.stringify(tree)
            );
        } catch (error) {
            console.warn(
                'Could not save the demo page tree.',
                error
            );
        }
    }

    function saveCollapsedState(pageIds = api.getCollapsedPageIds()) {
        try {
            localStorage.setItem(
                collapsedStorageKey,
                JSON.stringify(pageIds)
            );
        } catch (error) {
            console.warn(
                'Could not save the demo collapsed state.',
                error
            );
        }
    }

    function loadTree() {
        let stored;

        try {
            stored = localStorage.getItem(storageKey);
        } catch {
            return false;
        }

        if (!stored) {
            return false;
        }

        try {
            const tree = JSON.parse(stored);

            if (!api.restore(tree)) {
                localStorage.removeItem(storageKey);
                return false;
            }

            return true;
        } catch (error) {
            console.warn(
                'Could not restore the stored demo tree.',
                error
            );

            try {
                localStorage.removeItem(storageKey);
            } catch {
                // Ignore unavailable localStorage.
            }

            return false;
        }
    }

    function loadCollapsedState() {
        let stored;

        try {
            stored = localStorage.getItem(collapsedStorageKey);
        } catch {
            return;
        }

        if (!stored) {
            return;
        }

        try {
            const pageIds = JSON.parse(stored);

            if (!Array.isArray(pageIds)) {
                return;
            }

            api.setCollapsedPageIds(
                pageIds.filter(Number.isInteger)
            );
        } catch (error) {
            console.warn(
                'Could not restore the demo collapsed state.',
                error
            );
        }
    }

    function clearDemoStorage() {
        try {
            localStorage.removeItem(storageKey);
            localStorage.removeItem(collapsedStorageKey);

            legacyStorageKeys.forEach((key) => {
                localStorage.removeItem(key);
            });
        } catch {
            // Ignore unavailable localStorage.
        }
    }

    function resetDemo() {
        clearDemoStorage();

        api.restore(
            structuredClone(initialTree),
            {notify: false}
        );
        api.setCollapsedPageIds(initialCollapsedPageIds);

        saveTree();
        saveCollapsedState();

        announce(
            'Tree reset to the original demo structure.'
        );
    }

    pageTree.addEventListener(
        'neowolf:page-tree-change',
        (event) => {
            saveTree(event.detail.tree);
        }
    );

    pageTree.addEventListener(
        'neowolf:page-tree-collapse',
        (event) => {
            saveCollapsedState(
                event.detail.collapsedPageIds
            );
        }
    );

    resetButton?.addEventListener('click', resetDemo);

    const restored = loadTree();
    loadCollapsedState();

    if (restored) {
        announce('Restored page tree from localStorage.');
    } else {
        saveTree();
        saveCollapsedState();
        announce('Original page tree stored in localStorage.');
    }
})();
