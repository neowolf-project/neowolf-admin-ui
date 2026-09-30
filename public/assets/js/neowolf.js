'use strict';

window.Neowolf = window.Neowolf || {};

(() => {
    const Neowolf = window.Neowolf;
    const root = document.documentElement;
    const body = document.body;

    root.classList.add('using-pointer');

    document.addEventListener('keydown', (event) => {
        if (event.metaKey || event.ctrlKey || event.altKey) {
            return;
        }

        root.classList.replace('using-pointer', 'using-keyboard');
    });

    document.addEventListener('pointerdown', () => {
        root.classList.replace('using-keyboard', 'using-pointer');
    });

    function setHidden(element, isHidden) {
        if (!element) {
            return;
        }

        element.toggleAttribute('hidden', isHidden);
    }

    function isVisible(element) {
        return element instanceof HTMLElement
            && element.offsetParent !== null
            && getComputedStyle(element).visibility !== 'hidden';
    }

    function isUsingPointer() {
        return root.classList.contains('using-pointer');
    }

    function blurAfterPointerInteraction(element) {
        if (element && isUsingPointer()) {
            element.blur();
        }
    }

    function trapDialogFocus(dialog) {
        dialog.addEventListener('keydown', (event) => {
            if (event.key !== 'Tab') {
                return;
            }

            const focusable = [
                ...dialog.querySelectorAll(
                    'a[href], button:not([disabled]), input:not([disabled]), ' +
                    'select:not([disabled]), textarea:not([disabled]), ' +
                    '[tabindex]:not([tabindex="-1"])'
                ),
            ].filter(isVisible);

            if (focusable.length === 0) {
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
                return;
            }

            if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        });
    }

    function blurDialogOpenerAfterPointerClose(dialog, opener) {
        dialog.addEventListener('close', () => {
            if (document.activeElement === opener) {
                blurAfterPointerInteraction(opener);
            }
        });
    }

    function setExpanded(control, expanded) {
        if (!control) {
            return;
        }

        const targetId = control.getAttribute('aria-controls');

        if (!targetId) {
            return;
        }

        const target = document.getElementById(targetId);

        if (!target) {
            return;
        }

        control.setAttribute('aria-expanded', String(expanded));
        setHidden(target, !expanded);
    }

    function setAllExpanded(container, expanded) {
        if (!container) {
            return;
        }

        container
            .querySelectorAll('[aria-expanded][aria-controls]')
            .forEach((control) => {
                setExpanded(control, expanded);
            });
    }

    function slugify(value) {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function initPluginPresentation() {
        const toggle = document.querySelector(
            '[data-plugin-presentation-toggle]'
        );

        if (
            !toggle
            || !body.hasAttribute('data-plugin-presentation')
        ) {
            return;
        }

        const storageKey = 'neowolf-plugin-presentation';
        const presentations = ['tabs', 'sidebar'];

        function setPresentation(presentation) {
            if (!presentations.includes(presentation)) {
                return;
            }

            body.dataset.pluginPresentation = presentation;

            const nextPresentation = presentation === 'tabs'
                ? 'sidebar'
                : 'tabs';

            const nextLabel = nextPresentation === 'tabs'
                ? 'Tabs'
                : 'Sidebar';

            toggle.textContent = nextLabel;
            toggle.setAttribute(
                'aria-label',
                `Switch plugin navigation to ${nextPresentation}`
            );
        }

        let presentation = body.dataset.pluginPresentation;

        try {
            const storedPresentation = localStorage.getItem(storageKey);

            if (presentations.includes(storedPresentation)) {
                presentation = storedPresentation;
            }
        } catch {
            // Ignore unavailable or blocked localStorage.
        }

        setPresentation(presentation);

        toggle.addEventListener('click', () => {
            const presentation =
                body.dataset.pluginPresentation === 'tabs'
                    ? 'sidebar'
                    : 'tabs';

            setPresentation(presentation);

            try {
                localStorage.setItem(storageKey, presentation);
            } catch {
                // Ignore unavailable or blocked localStorage.
            }

            blurAfterPointerInteraction(toggle);
        });
    }

    document.querySelectorAll('dialog').forEach(trapDialogFocus);

    initPluginPresentation();

    Neowolf.root = root;
    Neowolf.dom = {setHidden, isVisible};
    Neowolf.interaction = {
        isUsingPointer,
        blurAfterPointerInteraction,
    };
    Neowolf.dialog = {
        trapFocus: trapDialogFocus,
        blurOpenerAfterPointerClose: blurDialogOpenerAfterPointerClose,
    };
    Neowolf.disclosure = {
        setExpanded,
        setAllExpanded,
    };
    Neowolf.string = {slugify};
})();