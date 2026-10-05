'use strict';

(() => {
    const tree = document.getElementById('aria-page-tree');

    if (!(tree instanceof HTMLElement)) {
        return;
    }

    const getItems = () => [
        ...tree.querySelectorAll('[role="treeitem"]'),
    ];

    const getVisibleItems = () => {
        return getItems().filter((item) => {
            let parent = item.parentElement;

            while (parent && parent !== tree) {
                if (
                    parent.getAttribute('role') === 'group'
                    && parent.parentElement?.getAttribute('aria-expanded') === 'false'
                ) {
                    return false;
                }

                parent = parent.parentElement;
            }

            return true;
        });
    };

    const getGroup = (item) => {
        return [...item.children].find(
            (child) => child.getAttribute('role') === 'group',
        ) ?? null;
    };

    const getParentItem = (item) => {
        const group = item.parentElement;

        if (group?.getAttribute('role') !== 'group') {
            return null;
        }

        const parent = group.parentElement;

        return parent?.getAttribute('role') === 'treeitem'
            ? parent
            : null;
    };

    const getFirstChild = (item) => {
        const group = getGroup(item);

        if (!group) {
            return null;
        }

        return [...group.children].find(
            (child) => child.getAttribute('role') === 'treeitem',
        ) ?? null;
    };

    const focusItem = (item) => {
        if (!(item instanceof HTMLElement)) {
            return;
        }

        for (const treeItem of getItems()) {
            treeItem.tabIndex = treeItem === item ? 0 : -1;
        }

        item.focus();
    };

    const expand = (item) => {
        if (item.hasAttribute('aria-expanded')) {
            item.setAttribute('aria-expanded', 'true');
        }
    };

    const collapse = (item) => {
        if (item.hasAttribute('aria-expanded')) {
            item.setAttribute('aria-expanded', 'false');
        }
    };

    tree.addEventListener('keydown', (event) => {
        const item = event.target.closest('[role="treeitem"]');

        if (!(item instanceof HTMLElement)) {
            return;
        }

        const visibleItems = getVisibleItems();
        const index = visibleItems.indexOf(item);

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();

                if (index < visibleItems.length - 1) {
                    focusItem(visibleItems[index + 1]);
                }

                break;

            case 'ArrowUp':
                event.preventDefault();

                if (index > 0) {
                    focusItem(visibleItems[index - 1]);
                }

                break;

            case 'ArrowRight':
                event.preventDefault();

                if (
                    item.hasAttribute('aria-expanded')
                    && item.getAttribute('aria-expanded') === 'false'
                ) {
                    expand(item);
                    break;
                }

                if (item.getAttribute('aria-expanded') === 'true') {
                    focusItem(getFirstChild(item));
                }

                break;

            case 'ArrowLeft':
                event.preventDefault();

                if (item.getAttribute('aria-expanded') === 'true') {
                    collapse(item);
                    break;
                }

                focusItem(getParentItem(item));
                break;

            case 'Home':
                event.preventDefault();
                focusItem(visibleItems[0]);
                break;

            case 'End':
                event.preventDefault();
                focusItem(visibleItems.at(-1));
                break;

            default:
                break;
        }
    });

    tree.addEventListener('click', (event) => {
        const item = event.target.closest('[role="treeitem"]');

        if (!(item instanceof HTMLElement)) {
            return;
        }

        focusItem(item);

        if (item.hasAttribute('aria-expanded')) {
            const expanded = item.getAttribute('aria-expanded') === 'true';

            item.setAttribute('aria-expanded', String(!expanded));
        }
    });
})();