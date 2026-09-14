'use strict';

window.Neowolf = window.Neowolf || {};

(() => {
    const Neowolf = window.Neowolf;

    function clamp(index, length) {
        if (length <= 0) {
            return -1;
        }

        return Math.max(0, Math.min(index, length - 1));
    }

    function directChildren(container, selector) {
        return [...container.children].filter((child) => child.matches(selector));
    }

    function positionOf(items, item) {
        return items.indexOf(item) + 1;
    }

    function visibleElements(container, selector) {
        const isVisible = Neowolf.dom?.isVisible
            ?? ((element) => element.offsetParent !== null);

        return [...container.querySelectorAll(selector)].filter(isVisible);
    }

    function createStatusRegion(container, className = 'visually-hidden') {
        const status = document.createElement('div');
        status.className = className;
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        status.setAttribute('aria-atomic', 'true');
        container.append(status);
        return status;
    }

    function getStatusRegion(container, selector = '[data-sortable-status]') {
        return container.querySelector(selector) ?? createStatusRegion(container);
    }

    function announce(status, message) {
        if (!status) {
            return;
        }

        status.textContent = '';
        requestAnimationFrame(() => {
            status.textContent = message;
        });
    }

    function emit(element, name, detail = {}) {
        element.dispatchEvent(new CustomEvent(name, {
            bubbles: true,
            detail,
        }));
    }

    const shortcutControllers = new Set();

    function registerShortcutController(controller) {
        shortcutControllers.add(controller);

        return () => shortcutControllers.delete(controller);
    }

    function getVisibleShortcutControllers() {
        const isVisible = Neowolf.dom?.isVisible ?? (() => true);

        return [...shortcutControllers].filter((controller) => (
            isVisible(controller.root) || isVisible(controller.toggle)
        ));
    }

    function getFocusedController(controllers) {
        return controllers.find((controller) => (
            controller.root?.contains(document.activeElement)
            || controller.toggle?.contains(document.activeElement)
        )) ?? null;
    }

    document.addEventListener('keydown', (event) => {
        const shortcut = event.altKey
            && event.shiftKey
            && event.key.toLowerCase() === 'r'
            && !event.ctrlKey
            && !event.metaKey;

        if (shortcut) {
            const controllers = getVisibleShortcutControllers();
            const controller = getFocusedController(controllers)
                ?? (controllers.length === 1 ? controllers[0] : null);

            if (!controller) {
                return;
            }

            event.preventDefault();
            controller.toggleMode();
            return;
        }

        if (event.key !== 'Escape') {
            return;
        }

        const enabled = [...shortcutControllers].filter((controller) =>
            controller.isEnabled()
        );
        const controller = getFocusedController(enabled)
            ?? (enabled.length === 1 ? enabled[0] : null);

        if (!controller) {
            return;
        }

        event.preventDefault();

        if (controller.cancelMove?.()) {
            return;
        }

        controller.disable();
    });

    function getToggle(root) {
        if (!root.id) {
            return null;
        }

        return document.querySelector(
            `[data-sortable-toggle="${CSS.escape(root.id)}"]`
        );
    }

    Neowolf.tree = {
        announce,
        clamp,
        getToggle,
        createStatusRegion,
        directChildren,
        emit,
        getStatusRegion,
        positionOf,
        registerShortcutController,
        visibleElements,
    };
})();
