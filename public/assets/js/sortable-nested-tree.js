'use strict';

window.Neowolf = window.Neowolf || {};

(() => {
    const Neowolf = window.Neowolf;
    const helper = Neowolf.tree;
    const states = new Map();

    if (!helper) {
        throw new Error('sortable-nested-tree.js requires tree-helpers.js');
    }

    const defaults = {
        rootListSelector: '[data-sortable-root-list]',
        listSelector: '[data-sortable-children]',
        itemSelector: '[data-sortable-item]',
        handleSelector: '[data-sortable-handle]',
        labelSelector: '[data-sortable-label]',
        animation: 150,
        emptyInsertThreshold: 48,
        groupName: null,
        statusRegion: null,
        getId: (item) => item.dataset.id ?? item.dataset.sortableId ?? '',
        getLabel: null,
        canMove: null,
        onModeChange: null,
    };

    function getDirectItems(state, list) {
        return helper.directChildren(list, state.options.itemSelector);
    }

    function getChildList(state, item) {
        return [...item.children].find((child) => child.matches(state.options.listSelector)) ?? null;
    }

    function getLabel(state, item) {
        if (typeof state.options.getLabel === 'function') return state.options.getLabel(item);
        return item.querySelector(state.options.labelSelector)?.textContent.trim()
            || item.dataset.label
            || state.options.getId(item)
            || 'Item';
    }

    function parentItem(state, list) {
        return list.closest(state.options.itemSelector);
    }

    function getPosition(state, item) {
        return helper.positionOf(getDirectItems(state, item.parentElement), item);
    }

    function buildLocation(state, item) {
        const list = item.parentElement;
        const parent = parentItem(state, list);
        return {
            id: state.options.getId(item),
            parentId: parent ? state.options.getId(parent) : null,
            position: getPosition(state, item),
        };
    }

    function announce(state, message) {
        helper.announce(state.status, message);
    }

    function emitChange(state, item, reason, previous = null) {
        helper.emit(state.root, 'neowolf:sortable-nested-change', {
            item: buildLocation(state, item),
            previous,
            reason,
        });
    }

    function getAllLists(state) {
        return [
            state.rootList,
            ...state.root.querySelectorAll(state.options.listSelector),
        ].filter((list, index, lists) => lists.indexOf(list) === index);
    }

    function validTarget(state, item, list, position) {
        const parent = parentItem(state, list);

        if (parent && (parent === item || item.contains(parent))) {
            return false;
        }

        if (typeof state.options.canMove === 'function') {
            return state.options.canMove({item, list, parent, position}) !== false;
        }

        return true;
    }

    function createSortable(state, list) {
        if (state.instances.has(list) || typeof window.Sortable === 'undefined') return;

        const sortable = window.Sortable.create(list, {
            group: {
                name: state.groupName,
                pull: true,
                put: true,
            },
            animation: state.options.animation,
            handle: state.options.handleSelector,
            draggable: state.options.itemSelector,
            forceFallback: true,
            fallbackTolerance: 3,
            fallbackOnBody: true,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            swapThreshold: 0.5,
            invertSwap: true,
            invertedSwapThreshold: 0.5,
            emptyInsertThreshold: state.options.emptyInsertThreshold,
            disabled: !state.enabled,

            onStart(event) {
                state.pointerPrevious = buildLocation(state, event.item);
                event.item.classList.add('is-moving');
                announce(state, `${getLabel(state, event.item)} selected for moving.`);
            },

            onMove(event) {
                const position = event.newIndex ?? 0;
                if (!validTarget(state, event.dragged, event.to, position)) {
                    return false;
                }

                const destinationParent = parentItem(state, event.to);
                const parentLabel = destinationParent ? getLabel(state, destinationParent) : 'root';
                announce(state, `Move target: inside ${parentLabel}.`);
                return true;
            },

            onEnd(event) {
                event.item.classList.remove('is-moving');
                emitChange(state, event.item, 'pointer', state.pointerPrevious);
                state.pointerPrevious = null;
            },
        });

        state.instances.set(list, sortable);
    }

    function refresh(state) {
        getAllLists(state).forEach((list) => createSortable(state, list));
        state.instances.forEach((sortable) => sortable.option('disabled', !state.enabled));
    }

    function getVisibleHandles(state) {
        return helper.visibleElements(state.root, state.options.handleSelector)
            .filter((handle) => !handle.disabled);
    }

    function focusHandle(state, handle, speak = true) {
        if (!handle) return;
        handle.focus();
        if (!speak) return;
        const item = handle.closest(state.options.itemSelector);
        if (item) announce(state, `${getLabel(state, item)} move handle selected.`);
    }

    function focusRelativeHandle(state, handle, delta) {
        const handles = getVisibleHandles(state);
        const index = handles.indexOf(handle);
        if (index < 0) return;
        focusHandle(state, handles[helper.clamp(index + delta, handles.length)]);
    }

    function appendKeyboardTargets(state, item, list, targets) {
        const siblings = getDirectItems(state, list)
            .filter((candidate) => candidate !== item);

        /*
         * Keyboard destinations follow the visual tree order rather than
         * grouping every position by list. This means Up/Down walks through
         * each possible insertion point exactly where it appears on screen:
         *
         * - before the first item in this list;
         * - through each item's child destinations;
         * - after that item's complete subtree.
         */
        if (validTarget(state, item, list, 0)) {
            targets.push({list, position: 0});
        }

        siblings.forEach((sibling, index) => {
            const childList = getChildList(state, sibling);

            if (
                childList
                && sibling !== item
                && !item.contains(sibling)
            ) {
                appendKeyboardTargets(
                    state,
                    item,
                    childList,
                    targets
                );
            }

            const position = index + 1;

            if (validTarget(state, item, list, position)) {
                targets.push({list, position});
            }
        });
    }

    function getKeyboardTargets(state, item) {
        const targets = [];

        appendKeyboardTargets(
            state,
            item,
            state.rootList,
            targets
        );

        const currentList = item.parentElement;
        const currentPosition = getDirectItems(state, currentList).indexOf(item);
        const currentIndex = targets.findIndex((target) =>
            target.list === currentList && target.position === currentPosition
        );

        /*
         * The item's current slot is not a move destination. Excluding it keeps
         * keyboard feedback meaningful: every cue represents an actual change
         * to the tree rather than offering a no-op position.
         *
         * Keep the original target index as the insertion point so pickup can
         * start at the nearest meaningful destination in visual order.
         */
        const movableTargets = targets.filter((target, index) => index !== currentIndex);
        const initialIndex = movableTargets.length === 0
            ? -1
            : Math.min(
                currentIndex >= 0 ? currentIndex : 0,
                movableTargets.length - 1
            );

        return {
            targets: movableTargets,
            initialIndex,
        };
    }

    function describeTarget(state, item, target) {
        const parent = parentItem(state, target.list);
        const parentLabel = parent ? getLabel(state, parent) : 'root';
        const siblings = getDirectItems(state, target.list).filter((candidate) => candidate !== item);
        const before = siblings[target.position - 1] ?? null;
        const after = siblings[target.position] ?? null;
        const label = getLabel(state, item);

        if (!before && !after) return `${label} will be the first item inside ${parentLabel}.`;
        if (!before) return `${label} will be before ${getLabel(state, after)}, inside ${parentLabel}.`;
        if (!after) return `${label} will be after ${getLabel(state, before)}, inside ${parentLabel}.`;
        return `${label} will be between ${getLabel(state, before)} and ${getLabel(state, after)}, inside ${parentLabel}.`;
    }

    function clearKeyboardTargetFeedback(state) {
        state.root
            .querySelectorAll('.keyboard-drop-before, .keyboard-drop-after, .keyboard-drop-inside')
            .forEach((element) => {
                element.classList.remove(
                    'keyboard-drop-before',
                    'keyboard-drop-after',
                    'keyboard-drop-inside'
                );
            });
    }

    function showKeyboardTargetFeedback(state) {
        clearKeyboardTargetFeedback(state);

        if (!state.movingItem || state.keyboardTargetIndex < 0) {
            return;
        }

        const target = state.keyboardTargets[state.keyboardTargetIndex];
        const siblings = getDirectItems(state, target.list)
            .filter((candidate) => candidate !== state.movingItem);
        const before = siblings[target.position - 1] ?? null;
        const after = siblings[target.position] ?? null;
        const parent = parentItem(state, target.list);

        let feedbackTarget = null;

        if (after) {
            after.classList.add('keyboard-drop-before');
            feedbackTarget = after;
        } else if (before) {
            before.classList.add('keyboard-drop-after');
            feedbackTarget = before;
        } else if (parent) {
            parent.classList.add('keyboard-drop-inside');
            feedbackTarget = parent;
        }

        feedbackTarget?.scrollIntoView({
            block: 'nearest',
            inline: 'nearest',
        });
    }

    function startKeyboardMove(state, handle) {
        if (state.movingItem) return;
        const item = handle.closest(state.options.itemSelector);
        if (!item) return;

        const {targets, initialIndex} = getKeyboardTargets(state, item);
        if (targets.length === 0) {
            announce(state, `${getLabel(state, item)} cannot be moved because there is no valid destination.`);
            return;
        }

        state.movingItem = item;
        state.movingHandle = handle;
        state.movingHandleTooltip = handle.dataset.tooltip ?? null;

        /*
         * Once the handle has been picked up, the "Move …" tooltip has served
         * its purpose. Keep focus on the source handle, but remove the tooltip
         * while the user chooses a destination so it does not compete with the
         * drop-position feedback.
         */
        delete handle.dataset.tooltip;

        state.keyboardTargets = targets;
        state.previousLocation = buildLocation(state, item);
        state.keyboardTargetIndex = initialIndex;

        item.classList.add('is-moving');
        handle.classList.add('keyboard-picked-up');
        state.instances.forEach((sortable) => sortable.option('disabled', true));
        showKeyboardTargetFeedback(state);

        announce(state,
            `${getLabel(state, item)} selected for moving. ` +
            `${describeTarget(state, item, targets[state.keyboardTargetIndex])} ` +
            'Use Up or Down Arrow to choose a position, Enter or Space to drop, or Escape to cancel.'
        );
    }

    function moveKeyboardTarget(state, delta) {
        if (!state.movingItem) return;
        const next = helper.clamp(state.keyboardTargetIndex + delta, state.keyboardTargets.length);
        if (next === state.keyboardTargetIndex) return;
        state.keyboardTargetIndex = next;
        showKeyboardTargetFeedback(state);
        announce(state, describeTarget(state, state.movingItem, state.keyboardTargets[next]));
    }

    function finishKeyboardMove(state, cancelled = false) {
        const item = state.movingItem;
        const handle = state.movingHandle;
        if (!item) return;

        if (!cancelled) {
            const target = state.keyboardTargets[state.keyboardTargetIndex];
            const siblings = getDirectItems(state, target.list).filter((candidate) => candidate !== item);
            target.list.insertBefore(item, siblings[target.position] ?? null);
            announce(state, `${getLabel(state, item)} moved. ${describeTarget(state, item, target).replace(' will be ', ' is now ')}`);
            emitChange(state, item, 'keyboard', state.previousLocation);
        } else {
            announce(state, `Move cancelled. ${getLabel(state, item)} was not moved.`);
        }

        clearKeyboardTargetFeedback(state);
        item.classList.remove('is-moving');
        handle?.classList.remove('keyboard-picked-up');

        if (handle && state.movingHandleTooltip !== null) {
            handle.dataset.tooltip = state.movingHandleTooltip;
        }

        state.movingItem = null;
        state.movingHandle = null;
        state.movingHandleTooltip = null;
        state.keyboardTargets = [];
        state.keyboardTargetIndex = -1;
        state.previousLocation = null;
        refresh(state);
        handle?.focus();
    }

    function setEnabled(state, enabled) {
        if (state.enabled === enabled) {
            return;
        }

        if (!enabled && state.movingItem) {
            finishKeyboardMove(state, true);
        }

        state.enabled = enabled;
        state.root.classList.toggle('reorder-mode', enabled);
        state.toggle?.setAttribute('aria-pressed', String(enabled));
        refresh(state);

        if (enabled) {
            const handles = getVisibleHandles(state);

            if (handles.length > 0) {
                focusHandle(state, handles[0], false);
            }

            announce(
                state,
                'Reorder mode enabled. Use arrow keys to move between handles and Enter or Space to select an item.'
            );
        } else {
            announce(state, 'Reorder mode disabled.');
        }

        if (typeof state.options.onModeChange === 'function') {
            state.options.onModeChange({
                root: state.root,
                enabled,
                api: state.api,
            });
        }
    }

    function init(root, options = {}) {
        if (!(root instanceof HTMLElement)) return null;
        if (states.has(root)) return states.get(root).api;

        const settings = {...defaults, ...options};
        const rootList = root.querySelector(settings.rootListSelector)
            ?? root.querySelector(settings.listSelector);
        if (!rootList) return null;

        const toggle = helper.getToggle(root);

        const state = {
            root,
            rootList,
            toggle,
            status: settings.statusRegion instanceof HTMLElement
                ? settings.statusRegion
                : helper.getStatusRegion(root),
            options: settings,
            groupName: settings.groupName ?? `neowolf-nested-${root.id || Math.random().toString(36).slice(2)}`,
            enabled: false,
            instances: new Map(),
            movingItem: null,
            movingHandle: null,
            movingHandleTooltip: null,
            keyboardTargets: [],
            keyboardTargetIndex: -1,
            previousLocation: null,
            pointerPrevious: null,
            api: null,
        };

        const api = {
            enable: () => setEnabled(state, true),
            disable: () => setEnabled(state, false),
            toggle: () => setEnabled(state, !state.enabled),
            refresh: () => refresh(state),
            isEnabled: () => state.enabled,
        };
        state.api = api;
        states.set(root, state);
        refresh(state);

        helper.registerShortcutController({
            root,
            toggle,
            isEnabled: () => state.enabled,
            toggleMode: () => setEnabled(state, !state.enabled),
            cancelMove: () => {
                if (!state.movingItem) return false;
                finishKeyboardMove(state, true);
                return true;
            },
            disable: () => setEnabled(state, false),
        });

        root.addEventListener('keydown', (event) => {
            const handle = event.target.closest(settings.handleSelector);
            if (!handle || !state.enabled) return;

            if (event.code === 'Space' || event.key === 'Enter') {
                event.preventDefault();

                if (state.movingItem) {
                    finishKeyboardMove(state, false);
                } else {
                    startKeyboardMove(state, handle);
                }

                return;
            }

            if (event.key === 'ArrowUp') {
                event.preventDefault();
                if (state.movingItem) moveKeyboardTarget(state, -1);
                else focusRelativeHandle(state, handle, -1);
                return;
            }

            if (event.key === 'ArrowDown') {
                event.preventDefault();
                if (state.movingItem) moveKeyboardTarget(state, 1);
                else focusRelativeHandle(state, handle, 1);
            }
        });

        toggle?.addEventListener('click', () => setEnabled(state, !state.enabled));
        return api;
    }

    Neowolf.sortableNestedTree = {init};

    document.querySelectorAll('[data-sortable-nested-tree]').forEach((root) => init(root));
})();
