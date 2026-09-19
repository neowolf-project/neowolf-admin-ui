'use strict';

(() => {
    const index = document.getElementById('snippet-index');
    const addButton = document.getElementById('add-snippet');

    if (!index) {
        return;
    }

    /*
     * Demo persistence only.
     *
     * The shared Neowolf sorter owns all pointer and keyboard behaviour.
     * This page script only simulates database persistence with localStorage.
     * In Neowolf, replace this with the Snippet reorder endpoint.
     */

    const storageKey = 'neowolf-demo-snippet-order';
    const list = index.querySelector('.admin-index-list');

    function getRows() {
        return [
            ...list.querySelectorAll('.admin-index-row'),
        ];
    }

    function applyOrder(order) {
        const rows = new Map(
            getRows().map((row) => [
                row.dataset.id,
                row,
            ])
        );

        order.forEach((id) => {
            const key = String(id);
            const row = rows.get(key);

            if (!row) {
                return;
            }

            list.append(row);
            rows.delete(key);
        });

        /*
         * Preserve newly added records that are not present in
         * the stored demo order.
         */
        rows.forEach((row) => {
            list.append(row);
        });
    }

    try {
        const stored = localStorage.getItem(storageKey);

        if (stored) {
            const order = JSON.parse(stored);

            if (Array.isArray(order)) {
                applyOrder(order);
            }
        }
    } catch {
        // Ignore unavailable or invalid demo storage.
    }

    index.addEventListener(
        'neowolf:sortable-flat-change',
        (event) => {
            try {
                if (event.detail.reason === 'reset') {
                    localStorage.removeItem(storageKey);
                    return;
                }

                localStorage.setItem(
                    storageKey,
                    JSON.stringify(event.detail.order)
                );
            } catch {
                // Ignore unavailable demo storage.
            }
        }
    );

    /*
     * Delete Snippet.
     *
     * The common Neowolf dialog owns the dialog behaviour.
     * This script only supplies the Snippet-specific message and action.
     */
    index.addEventListener('click', async (event) => {
        const deleteButton = event.target.closest(
            '.admin-index-actions .delete'
        );

        if (!deleteButton || !index.contains(deleteButton)) {
            return;
        }

        event.preventDefault();

        const row = deleteButton.closest('.admin-index-row');

        if (!row) {
            return;
        }

        const snippetName = row.dataset.snippetName?.trim()
            || 'this snippet';

        const isProtected = row.dataset.isProtected === '1';

        if (typeof window.Neowolf?.dialog?.open !== 'function') {
            return;
        }

        if (isProtected) {
            await window.Neowolf.dialog.open({
                title: 'Cannot delete snippet',
                message: `Snippet "${snippetName}" is in use and cannot be deleted.`,
                confirmText: 'OK',
            });

            return;
        }

        const confirmed = await window.Neowolf.dialog.open({
            title: 'Delete snippet',
            message: `Delete snippet "${snippetName}"?`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
        });

        if (!confirmed) {
            return;
        }

        /*
         * Demo deletion only.
         *
         * In Neowolf, submit the delete request using POST and CSRF
         * protection instead of removing the row directly.
         */
        row.remove();

        try {
            localStorage.setItem(
                storageKey,
                JSON.stringify(
                    getRows()
                        .map((item) => item.dataset.id)
                        .filter(Boolean)
                )
            );
        } catch {
            // Ignore unavailable demo storage.
        }
    });

    /*
     * Add Snippet demo.
     *
     * The production action should simply navigate to the add form.
     * If a common Neowolf dialog API with an open() method is available,
     * this demo uses it first.
     */
    addButton?.addEventListener('click', async () => {
        if (typeof window.Neowolf?.dialog?.open !== 'function') {
            window.location.href = '/beheer/snippet/add';
            return;
        }

        const confirmed = await window.Neowolf.dialog.open({
            title: 'Add Snippet',
            message: 'Open the form to create a new snippet?',
            confirmText: 'Add Snippet',
            cancelText: 'Cancel',
        });

        if (confirmed) {
            window.location.href = '/beheer/snippet/add';
        }
    });
})();