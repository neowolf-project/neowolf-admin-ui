'use strict';

window.Neowolf = window.Neowolf || {};

(() => {
    const Neowolf = window.Neowolf;
    const helper = Neowolf.tree;
    const states = new Map();

    if (!helper) {
        throw new Error('sortable-flat-tree.js requires tree-helpers.js');
    }

    const defaults = {
        listSelector: '[data-sortable-list]',
        itemSelector: '[data-sortable-item]',
        labelSelector: '[data-sortable-label]',
        interactiveSelector: 'a, button, input, select, textarea, [contenteditable="true"]',
        animation: 150,
        focusFirstOnEnable: true,
    };

    function getItems(state) {
        return helper.directChildren(state.list, state.options.itemSelector);
    }

    function getId(item) {
        return item.dataset.id ?? item.dataset.sortableId ?? '';
    }

    function getLabel(state, item) {
        if (typeof state.options.getLabel === 'function') {
            return state.options.getLabel(item);
        }

        return item.querySelector(state.options.labelSelector)?.textContent.trim()
            || item.dataset.label
            || getId(item)
            || 'Item';
    }

    function getOrder(state) {
        return getItems(state).map(getId).filter(Boolean);
    }

    function getPosition(state, item) {
        const items = getItems(state);
        return {
            position: helper.positionOf(items, item),
            total: items.length,
        };
    }

    function announce(state, message) {
        helper.announce(state.status, message);
    }

    function emitChange(state, reason = 'reorder') {
        helper.emit(state.root, 'neowolf:sortable-flat-change', {
            order: getOrder(state),
            reason,
        });
    }

    function applyOrder(state, order) {
        const items = new Map(getItems(state).map((item) => [getId(item), item]));

        order.forEach((id) => {
            const item = items.get(String(id));
            if (!item) return;
            state.list.append(item);
            items.delete(String(id));
        });

        items.forEach((item) => state.list.append(item));
    }

    function setActiveItem(state, item, {focus = true, speak = true} = {}) {
        if (!item) return;

        getItems(state).forEach((candidate) => {
            candidate.tabIndex = candidate === item ? 0 : -1;
        });

        if (focus) item.focus();

        if (speak) {
            const {position, total} = getPosition(state, item);
            announce(state, `${getLabel(state, item)}, position ${position} of ${total}.`);
        }
    }

    function setItemsFocusable(state, enabled) {
        const items = getItems(state);

        items.forEach((item, index) => {
            if (!enabled) {
                item.removeAttribute('tabindex');
                return;
            }

            item.tabIndex = index === 0 ? 0 : -1;
        });
    }

    function focusRelative(state, item, direction) {
        const items = getItems(state);
        const index = items.indexOf(item);
        if (index < 0) return;

        let targetIndex = index;
        if (direction === 'up') targetIndex = index - 1;
        if (direction === 'down') targetIndex = index + 1;
        if (direction === 'first') targetIndex = 0;
        if (direction === 'last') targetIndex = items.length - 1;

        setActiveItem(state, items[helper.clamp(targetIndex, items.length)]);
    }

    function startKeyboardMove(state, item) {
        if (state.movingItem) return;

        state.movingItem = item;
        state.orderBeforeMove = getOrder(state);
        item.classList.add('is-keyboard-moving');

        const {position, total} = getPosition(state, item);
        announce(state,
            `${getLabel(state, item)} picked up. Position ${position} of ${total}. ` +
            'Use arrow keys, Home or End to move. Press Space to place, or Escape to cancel.'
        );
    }

    function moveKeyboardItem(state, direction) {
        const item = state.movingItem;
        if (!item) return;

        const items = getItems(state);
        const index = items.indexOf(item);
        if (index < 0) return;

        let targetIndex = index;
        if (direction === 'up') targetIndex = index - 1;
        if (direction === 'down') targetIndex = index + 1;
        if (direction === 'first') targetIndex = 0;
        if (direction === 'last') targetIndex = items.length - 1;
        targetIndex = helper.clamp(targetIndex, items.length);

        if (targetIndex === index) return;

        const target = items[targetIndex];
        if (targetIndex > index) target.after(item);
        else target.before(item);

        setActiveItem(state, item, {speak: false});
        const {position, total} = getPosition(state, item);
        announce(state, `${getLabel(state, item)} moved to position ${position} of ${total}.`);
    }

    function finishKeyboardMove(state) {
        const item = state.movingItem;
        if (!item) return;

        item.classList.remove('is-keyboard-moving');
        state.movingItem = null;
        state.orderBeforeMove = null;
        setActiveItem(state, item, {speak: false});

        const {position, total} = getPosition(state, item);
        announce(state, `${getLabel(state, item)} placed. Position ${position} of ${total}.`);
        emitChange(state, 'keyboard');
    }

    function cancelKeyboardMove(state, {announceCancellation = true} = {}) {
        const item = state.movingItem;
        if (!item) return;

        const label = getLabel(state, item);
        if (state.orderBeforeMove) applyOrder(state, state.orderBeforeMove);

        item.classList.remove('is-keyboard-moving');
        state.movingItem = null;
        state.orderBeforeMove = null;
        setActiveItem(state, item, {speak: false});

        if (announceCancellation) announce(state, `${label} move cancelled.`);
    }

    function onItemKeydown(state, event) {
        const item = event.target.closest(state.options.itemSelector);
        if (!item || event.target !== item || !state.enabled) return;

        if (!state.movingItem) {
            const actions = {
                ArrowUp: 'up', ArrowDown: 'down', Home: 'first', End: 'last',
            };

            if (actions[event.key]) {
                event.preventDefault();
                focusRelative(state, item, actions[event.key]);
            } else if (event.code === 'Space') {
                event.preventDefault();
                startKeyboardMove(state, item);
            }
            return;
        }

        if (item !== state.movingItem) return;

        const actions = {
            ArrowUp: 'up', ArrowDown: 'down', Home: 'first', End: 'last',
        };

        if (actions[event.key]) {
            event.preventDefault();
            moveKeyboardItem(state, actions[event.key]);
        } else if (event.code === 'Space') {
            event.preventDefault();
            finishKeyboardMove(state);
        }
    }

    function enablePointerSorting(state) {
        if (state.sortable || typeof window.Sortable === 'undefined') return;

        state.sortable = window.Sortable.create(state.list, {
            animation: state.options.animation,
            draggable: state.options.itemSelector,
            filter: state.options.interactiveSelector,
            preventOnFilter: false,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            onEnd() {
                emitChange(state, 'pointer');
            },
        });
    }

    function disablePointerSorting(state) {
        state.sortable?.destroy();
        state.sortable = null;
    }

function setEnabled(state, enabled, {focusFirst = false} = {}) {
    if (state.enabled === enabled) return;

    if (!enabled) {
        cancelKeyboardMove(state, {
            announceCancellation: false,
        });
    }

    state.enabled = enabled;

    state.root.classList.toggle(
        'is-reordering',
        enabled
    );

    if (state.toggle) {
        state.toggle.setAttribute(
            'aria-pressed',
            String(enabled)
        );

        state.toggle.textContent = enabled
            ? 'Finish reordering'
            : 'Reorder';
    }

    setItemsFocusable(state, enabled);

    if (enabled) {
        enablePointerSorting(state);

        announce(
            state,
            'Reorder mode enabled. Use arrow keys to navigate and Space to pick up an item.'
        );

        if (focusFirst) {
            setActiveItem(
                state,
                getItems(state)[0],
                {speak: false}
            );
        }

        return;
    }

    disablePointerSorting(state);

    announce(
        state,
        'Reorder mode disabled.'
    );
}

    function init(root, options = {}) {
        if (!(root instanceof HTMLElement)) return null;
        if (states.has(root)) return states.get(root).api;

        const settings = {...defaults, ...options};
        const list = root.querySelector(settings.listSelector);
        if (!list) return null;

        const toggle = helper.getToggle(root);

        const state = {
            root,
            list,
            toggle,
            status: helper.getStatusRegion(root),
            options: settings,
            enabled: false,
            sortable: null,
            movingItem: null,
            orderBeforeMove: null,
            api: null,
        };

        const api = {
            enable: () => setEnabled(state, true),
            disable: () => setEnabled(state, false),
            toggle: () => setEnabled(state, !state.enabled),
            getOrder: () => getOrder(state),
            applyOrder: (order) => applyOrder(state, order),
            isEnabled: () => state.enabled,
        };
        state.api = api;
        states.set(root, state);

        helper.registerShortcutController({
            root,
            toggle,
            isEnabled: () => state.enabled,
            toggleMode: () => setEnabled(state, !state.enabled, {focusFirst: true}),
            cancelMove: () => {
                if (!state.movingItem) return false;
                cancelKeyboardMove(state);
                return true;
            },
            disable: () => setEnabled(state, false),
        });

        list.addEventListener('keydown', (event) => onItemKeydown(state, event));
        toggle?.addEventListener('click', () => setEnabled(state, !state.enabled, {
            focusFirst: settings.focusFirstOnEnable && !Neowolf.interaction?.isUsingPointer?.(),
        }));
        return api;
    }

    Neowolf.sortableFlatTree = {init};

    document.querySelectorAll('[data-sortable-flat-tree]').forEach((root) => init(root));
})();
