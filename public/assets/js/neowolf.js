'use strict';

window.Neowolf = window.Neowolf || {};

(() => {
    const Neowolf = window.Neowolf;
    const root = document.documentElement;

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

    document.querySelectorAll('dialog').forEach(trapDialogFocus);

    Neowolf.root = root;
    Neowolf.dom = {setHidden, isVisible};
    Neowolf.interaction = {isUsingPointer, blurAfterPointerInteraction};
    Neowolf.dialog = {
        trapFocus: trapDialogFocus,
        blurOpenerAfterPointerClose: blurDialogOpenerAfterPointerClose,
    };
})();
