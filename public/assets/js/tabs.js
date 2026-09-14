'use strict';

window.Neowolf = window.Neowolf || {};

(() => {
    const Neowolf = window.Neowolf;
    const controllers = [];

    function findTabForHash(tabs) {
        const hashId = window.location.hash.slice(1);

        if (!hashId) {
            return null;
        }

        const hashTarget =
            document.getElementById(hashId);

        if (!hashTarget) {
            return null;
        }

        return tabs.find((tab) => {
            if (tab.id === hashId) {
                return true;
            }

            const panelId =
                tab.getAttribute('aria-controls');

            const panel = panelId
                ? document.getElementById(panelId)
                : null;

            return panel
                && (
                    panel === hashTarget
                    || panel.contains(hashTarget)
                );
        }) || null;
    }

    function createController(tabList, index) {
        const tabListId =
            tabList.getAttribute('aria-label')
            || tabList.id
            || `tablist-${index}`;

        const storageKey =
            `neowolf-active-tab-${tabListId}`;

        function getTabs() {
            return [
                ...tabList.querySelectorAll(
                    ':scope > [role="tab"]'
                ),
            ];
        }

        function activate(
            tab,
            {
                moveFocus = false,
                updateHash = false,
            } = {}
        ) {
            if (!tab) {
                return;
            }

            getTabs().forEach((button) => {
                const selected = button === tab;

                button.setAttribute(
                    'aria-selected',
                    String(selected)
                );

                button.tabIndex =
                    selected ? 0 : -1;

                const panelId =
                    button.getAttribute('aria-controls');

                const panel = panelId
                    ? document.getElementById(panelId)
                    : null;

                if (panel) {
                    panel.hidden = !selected;
                }
            });

            localStorage.setItem(
                storageKey,
                tab.id
            );

            tabList.dispatchEvent(
                new CustomEvent('neowolf:tabchange', {
                    bubbles: true,
                    detail: {
                        tab,
                    },
                })
            );

            if (updateHash) {
                history.replaceState(
                    null,
                    '',
                    `#${tab.id}`
                );
            }

            if (moveFocus) {
                tab.focus();
            }
        }

        function moveFocus(tab, event) {
            const tabs = getTabs();
            const currentIndex = tabs.indexOf(tab);

            if (currentIndex === -1) {
                return;
            }

            let newIndex;

            switch (event.key) {
                case 'ArrowRight':
                    newIndex =
                        (currentIndex + 1)
                        % tabs.length;
                    break;

                case 'ArrowLeft':
                    newIndex =
                        (
                            currentIndex
                            - 1
                            + tabs.length
                        )
                        % tabs.length;
                    break;

                case 'Home':
                    newIndex = 0;
                    break;

                case 'End':
                    newIndex = tabs.length - 1;
                    break;

                default:
                    return;
            }

            event.preventDefault();

            activate(
                tabs[newIndex],
                {
                    moveFocus: true,
                    updateHash: true,
                }
            );
        }

        function attach(tab) {
            tab.addEventListener('click', () => {
                activate(
                    tab,
                    {
                        updateHash: true,
                    }
                );
            });

            tab.addEventListener(
                'keydown',
                (event) => {
                    moveFocus(tab, event);
                }
            );
        }

        const tabs = getTabs();

        tabs.forEach(attach);

        const hashTab = findTabForHash(tabs);

        const savedTabId =
            localStorage.getItem(storageKey);

        const savedTab =
            tabs.find(
                (tab) => tab.id === savedTabId
            ) || null;

        const initialTab =
            hashTab
            || savedTab
            || tabs.find(
                (tab) =>
                    tab.getAttribute('aria-selected')
                    === 'true'
            )
            || tabs[0]
            || null;

        if (initialTab) {
            activate(initialTab);
        }

        /*
         * Browsers may restore focus to a previously
         * focused tab after reload.
         */

        if (
            tabs.includes(document.activeElement)
            && document.activeElement !== initialTab
        ) {
            document.activeElement.blur();
        }

        return {
            tabList,
            getTabs,
            activate,
            attach,
        };
    }

    document
        .querySelectorAll(
            '[data-tabs] [role="tablist"]'
        )
        .forEach((tabList, index) => {
            controllers.push(
                createController(tabList, index)
            );
        });

    window.addEventListener('hashchange', () => {
        controllers.forEach((controller) => {
            const tab = findTabForHash(
                controller.getTabs()
            );

            if (tab) {
                controller.activate(
                    tab,
                    {moveFocus: true}
                );
            }
        });
    });

    document
        .querySelectorAll('[data-tabs]')
        .forEach((tabs) => {
            tabs.classList.add('tabs-ready');
        });

    /*
     * Firefox may restore focus to a tab whose
     * tabIndex is already -1.
     */

    let pointerDownOnTab = false;

    document.addEventListener(
        'pointerdown',
        (event) => {
            pointerDownOnTab =
                !!event.target.closest?.(
                    '[role="tab"]'
                );
        },
        true
    );

    document.addEventListener(
        'focusin',
        (event) => {
            const target = event.target;

            if (
                target.getAttribute?.('role')
                !== 'tab'
            ) {
                return;
            }

            if (pointerDownOnTab) {
                pointerDownOnTab = false;
                return;
            }

            if (target.tabIndex === -1) {
                target.blur();
            }
        }
    );

    Neowolf.tabs = {
        getController(tabList) {
            return controllers.find(
                (controller) =>
                    controller.tabList === tabList
            ) || null;
        },
    };
})();
